"""Create delivery assets in a disposable website build directory."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess


def read_assignment(path, variable):
    text = path.read_text(encoding="utf-8").strip()
    prefix = f"window.{variable}="
    if not text.startswith(prefix):
        raise ValueError(f"Unexpected asset manifest: {path}")
    return json.loads(text[len(prefix):].removesuffix(";"))


def asset_path(root, relative):
    result = (root / relative).resolve()
    if root not in result.parents:
        raise ValueError(f"Asset outside build directory: {relative}")
    return result


def optimize(root, ffmpeg):
    manifest_path = root / "project-images.js"
    manifest = read_assignment(manifest_path, "projectImages")
    image_before = image_after = medium_count = 0
    for item in (item for group in manifest.values() for item in group):
        source = asset_path(root, item["src"])
        source_size = source.stat().st_size
        image_before += source_size
        if item.get("width", 0) <= 1400:
            image_after += source_size
            continue
        relative = "media/reading/" + source.stem + ".webp"
        target = asset_path(root, relative)
        target.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
            "-vf", "scale=1400:-2:flags=lanczos", "-frames:v", "1",
            "-c:v", "libwebp", "-quality", "84", "-compression_level", "6", str(target)
        ], check=True)
        if target.stat().st_size < source_size:
            item["reading"] = relative
            item["readingWidth"] = 1400
            image_after += target.stat().st_size
            medium_count += 1
        else:
            target.unlink()
            image_after += source_size
    manifest_path.write_text("window.projectImages=" + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")

    playlist_path = root / "playlist.js"
    playlist = read_assignment(playlist_path, "turntablePlaylist")
    music_before = music_after = 0
    for track in playlist:
        source = asset_path(root, track["src"].split("?")[0])
        music_before += source.stat().st_size
        target = source.with_suffix(".optimized.mp3")
        subprocess.run([
            ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
            "-map", "0:a:0", "-vn", "-map_metadata", "-1", "-c:a", "libmp3lame",
            "-b:a", "128k", str(target)
        ], check=True)
        os.replace(target, source)
        music_after += source.stat().st_size
        track["src"] = track["src"].split("?")[0] + "?v=128k-20261107"
    playlist_path.write_text("window.turntablePlaylist=" + json.dumps(playlist, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(json.dumps({
        "medium_images": medium_count, "reading_bytes_before": image_before,
        "reading_bytes_after": image_after, "music_bytes_before": music_before,
        "music_bytes_after": music_after
    }))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("build_directory", type=Path)
    parser.add_argument("--ffmpeg", default=shutil.which("ffmpeg"))
    args = parser.parse_args()
    if not args.ffmpeg:
        parser.error("ffmpeg is required")
    optimize(args.build_directory.resolve(), args.ffmpeg)
