"""Build GitHub Pages-compatible static route entry points; no dependencies."""
from pathlib import Path
import json
from html import escape
ROOT=Path(__file__).resolve().parents[1]
projects=json.loads((ROOT/'content/projects.json').read_text())
(ROOT/'content/projects.js').write_text('window.PROJECTS = '+json.dumps(projects,ensure_ascii=False)+';\n')
template=(ROOT/'templates/workbench.html').read_text()
routes=['','work','process','cmf','about','contact','guestbook']+['work/'+p['id'] for p in projects]
for route in routes:
 folder=ROOT/route;folder.mkdir(exist_ok=True,parents=True)
 prefix='../'*len(route.split('/')) if route else './'
 (folder/'index.html').write_text(template.replace('__BASE__',prefix))
# Preserve every previously shared project URL.
for p in projects:
 (ROOT/'projects'/f'{p["id"]}.html').write_text(f'<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=../work/{p["id"]}/"><title>{escape(p["title"])}｜陈湘</title></head><body><p>项目已移至新工作台。<a href="../work/{p["id"]}/">查看{escape(p["title"])}</a></p></body></html>\n')
lines=['# 陈湘个人网站 · 作品目录\n','15 个项目，6 个完整案例、9 个图集／研究条目。分类允许交叉归属，详情保持唯一。\n','| 作品 | 内容类型 | 材料状态 | 详情 |\n|---|---|---|---|']
for p in projects:
 lines.append(f'| {p["title"]} | {dict(case="完整案例",gallery="作品图集",research="研究资料")[p["contentType"]]} | {"图文待补充" if p["pending"] else "已有资料"} | [查看](work/{p["id"]}/) |')
for p in projects:
 lines.extend([f'\n## {p["title"]}\n',p['subtitle'],f'\n本人贡献：{p["role"]}',f'\n来源：{p["source"]}'])
(ROOT/'WORKS.md').write_text('\n'.join(lines)+'\n')
print(f'Generated {len(routes)} route entry points and {len(projects)} legacy redirects.')
