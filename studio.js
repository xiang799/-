import * as THREE from './vendor/three/three.module.min.js';

const stage = document.getElementById('three-workbench');
const viewport = document.getElementById('scene-viewport');
const canvas = document.getElementById('studio-canvas');
const BASE = new URL(document.querySelector('base').href);
const $ = s => document.querySelector(s);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = () => innerWidth <= 760;
const C = { cream: 0xeee6cf, paper: 0xf0ebdb, ink: 0x3e4c3a, sage: 0x8a9a76, olive: 0x677b56, clay: 0xc27f60, blue: 0x8aaeb5, lilac: 0xafa0bd, brass: 0xbba66c, wood: 0xc09c6c, charcoal: 0x28332f };
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
} catch {
  document.body.dataset.sceneEngine = 'fallback';
}
if (renderer) init();

function init() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile() ? 1.5 : 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new THREE.Scene();
  const room = new THREE.Group(); scene.add(room);
  const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, .1, 100);
  const baseCamera = new THREE.Vector3(11, 10, 15);
  const baseTarget = new THREE.Vector3(0, 2.6, 0);
  camera.position.copy(baseCamera); camera.lookAt(baseTarget);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(0, 0);
  const entries = new Map();
  const interactive = [];
  const textures = [];
  let frame = 0, lastTime = performance.now(), until = 0, hovered = null, focused = null;
  let visible = true, reading = false, night = false, transition = null, openingTimer = null;
  let destroyed = false, renderedFrames = 0;
  let currentFeature = 'dayibu';
  let fitHeight = 14;
  const targetPointer = new THREE.Vector2();
  const rayPoint = new THREE.Vector2();
  const labelVector = new THREE.Vector3();
  const front = new THREE.Vector3(0, 1, 0);
  const lampLights = [];
  const hemi = new THREE.HemisphereLight(0xfff2d4, 0x5d745d, 2.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffefcf, 4.0); sun.position.set(-6, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile() ? 1024 : 2048, mobile() ? 1024 : 2048);
  sun.shadow.camera.left = -12; sun.shadow.camera.right = 12; sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
  sun.shadow.normalBias = .035; sun.shadow.bias = -.0002; sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xd6e7da, 1.2); fill.position.set(7, 6, -2); scene.add(fill);

  function mat(color, roughness = .78, metalness = 0) { return new THREE.MeshStandardMaterial({ color, roughness, metalness }); }
  const materials = { paper: mat(C.paper), cream: mat(C.cream), ink: mat(C.ink), sage: mat(C.sage), olive: mat(C.olive), clay: mat(C.clay), blue: mat(C.blue), brass: mat(C.brass, .4, .45), metal: mat(0xaaa99a, .4, .45), dark: mat(C.charcoal), darkWood: mat(0x806348) };
  function box(w, h, d, material, x = 0, y = 0, z = 0, parent = room) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function roundedShape(w, h, radius) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2, r = Math.min(radius, w / 2, h / 2);
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  function round(w, h, depth, radius, material, parent = room) {
    const geometry = new THREE.ExtrudeGeometry(roundedShape(w, h, radius), { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .035, bevelThickness: .025, curveSegments: 5 });
    geometry.translate(0, 0, -depth / 2);
    const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(r1, r2, h, material, x, y, z, parent = room, segments = 24) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, segments), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function sphere(radius, material, x, y, z, parent = room) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), material); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  function rod(a, b, radius, material, parent = room) {
    const direction = new THREE.Vector3().subVectors(b, a), mesh = cylinder(radius, radius, direction.length(), material, 0, 0, 0, parent, 12);
    mesh.position.copy(a).add(b).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(front, direction.normalize()); return mesh;
  }
  function texture(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const context = c.getContext('2d'); draw(context, w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); textures.push(t); return t;
  }
  function sheet(w, h, tex, parent = room, horizontal = false) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false }));
    if (horizontal) mesh.rotation.x = -Math.PI / 2;
    parent.add(mesh); return mesh;
  }
  function textTexture(lines, { bg = '#eee6cf', fg = '#4e5b43', width = 512, height = 512, size = 50, top = 80, left = 45, spacing = 1.6, mono = false } = {}) {
    return texture(width, height, (ctx, w, h) => {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); ctx.fillStyle = fg;
      ctx.font = `${size}px ${mono ? 'monospace' : 'Arial,"Microsoft YaHei",sans-serif'}`;
      lines.forEach((line, i) => ctx.fillText(line, left, top + i * size * spacing));
    });
  }
  function register(id, group, anchor, action, motion = 'lift') {
    const entry = { id, group, anchor: new THREE.Vector3(...anchor), action, motion, basePosition: group.position.clone(), baseRotation: group.rotation.clone(), lift: 0, amount: 0, part: null };
    entries.set(id, entry);
    group.traverse(o => { if (o.isMesh) { o.userData.entry = id; interactive.push(o); } });
    return entry;
  }
  const wood = texture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#b99464'; ctx.fillRect(0, 0, w, h);
    // Deterministic fine wood grain, without a remote texture or asset dependency.
    let seed = 17;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 470; i++) {
      const y = random() * h; ctx.strokeStyle = `rgba(${random() > .5 ? '80,49,20' : '235,217,169'},${random() * .1})`;
      ctx.lineWidth = random() * 1.4 + .2; ctx.beginPath(); ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * .3, y + random() * 16, w * .6, y - random() * 13, w, y + random() * 8); ctx.stroke();
    }
  });
  const woodMat = new THREE.MeshStandardMaterial({ map: wood, roughness: .84 });
  const floor = round(16.2, 10.5, .35, .25, mat(0x879278)); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -.2, .1);
  const backWall = box(16.2, 6.5, .3, mat(0x8a977c), 0, 3.04, -4.9);
  // A narrow return wall makes the space read as a room while keeping every object visible.
  const sideWall = box(.22, 6.5, 4.2, mat(0x849274), -8, 3.04, -2.7);
  // A framed window on the return wall, with actual geometry for the muntins.
  box(.10, 2.55, 2.37, materials.cream, -7.83, 4.18, -2.56);
  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0xa9c2b1, roughness: .42, emissive: 0x52775c, emissiveIntensity: .12 });
  box(.025, 2.30, 2.12, windowMaterial, -7.765, 4.18, -2.56);
  box(.085, .065, 2.16, materials.cream, -7.72, 4.18, -2.56);
  box(.085, 2.34, .065, materials.cream, -7.72, 4.18, -2.56);
  box(.28, .10, 2.65, materials.cream, -7.70, 2.90, -2.56);
  box(16, .18, .08, materials.darkWood, 0, .06, -4.7);
  box(.1, .18, 4.1, materials.darkWood, -7.84, .06, -2.7);
  const desktop = round(13.4, 6.9, .27, .15, woodMat); desktop.rotation.x = -Math.PI / 2; desktop.position.set(0, 1.83, .15);
  // Desk legs, under-desk drawers, and an open stool add depth below the work surface.
  for (const x of [-5.85, 5.85]) for (const z of [-2.45, 2.55]) {
    const leg = box(.2, 1.65, .23, materials.darkWood, x, .92, z); leg.rotation.z = x < 0 ? .03 : -.03;
  }
  box(11.65, .2, .16, materials.darkWood, 0, 1.2, -2.45);
  const drawers = new THREE.Group(); drawers.position.set(-4.45, .9, -.45); room.add(drawers);
  box(2.1, 1.6, 2.65, mat(0x9f865e), 0, 0, 0, drawers);
  for (let i = 0; i < 3; i++) {
    box(1.99, .44, .07, woodMat, 0, .51 - i * .51, 1.36, drawers);
    box(.55, .035, .08, materials.brass, 0, .53 - i * .51, 1.43, drawers);
  }
  const stool = new THREE.Group(); stool.position.set(.3, 0, 4.03); room.add(stool);
  cylinder(.92, .95, .15, mat(0xb79b73), 0, 1.0, 0, stool);
  for (const x of [-.55, .55]) for (const z of [-.48, .48]) rod(new THREE.Vector3(x, .95, z), new THREE.Vector3(x * 1.25, .04, z * 1.25), .065, materials.darkWood, stool);
  rod(new THREE.Vector3(-.62, .39, -.52), new THREE.Vector3(.62, .39, -.52), .035, materials.darkWood, stool);
  rod(new THREE.Vector3(-.62, .39, .52), new THREE.Vector3(.62, .39, .52), .035, materials.darkWood, stool);
  // Shelf and the five independently interactive category folders.
  box(5.1, .16, .95, woodMat, -4.45, 3.65, -4.12);
  for (const x of [-6.2, -2.65]) { box(.08, .55, .08, materials.darkWood, x, 3.31, -4.31); box(.08, .08, .56, materials.darkWood, x, 3.57, -4.13); }
  const folderColors = ['#c97e5a', '#aec09b', '#91b1b7', '#d8c782', '#b4a0bf'];
  const folderNames = ['工业设计', '交互设计', '体验与服务', 'AIGC 探索', '视觉与信息'];
  const folderIds = ['industrial', 'interaction', 'service', 'aigc', 'visual'];
  folderIds.forEach((id, i) => {
    const g = new THREE.Group(); g.position.set(-6.18 + i * .86, 3.74, -4.07); g.rotation.z = (i - 2) * -.032; room.add(g);
    const height = [1.65, 1.85, 1.73, 1.81, 1.62][i];
    const fm = mat(folderColors[i]); box(.69, height, .7, fm, 0, height / 2, 0, g);
    box(.60, height - .13, .64, materials.paper, .035, height / 2, -.005, g);
    box(.07, height, .73, fm, -.32, height / 2, .005, g);
    const count = window.PROJECTS.filter(p => p.categories.includes(id)).length;
    const label = texture(256, 640, ctx => {
      ctx.fillStyle = folderColors[i]; ctx.fillRect(0, 0, 256, 640); ctx.fillStyle = '#43513d';
      ctx.strokeStyle = '#53634388'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(128, 67, 29, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '23px monospace'; ctx.textAlign = 'center'; ctx.fillText('0' + (i + 1), 128, 75);
      ctx.font = '38px Arial,"Microsoft YaHei"';
      const chars = folderNames[i].replace('AIGC ', '').split('');
      if (id === 'aigc') { ctx.font = '30px Arial'; ctx.fillText('AIGC', 128, 205); ctx.font = '38px Arial'; ['探', '索'].forEach((c, j) => ctx.fillText(c, 128, 275 + j * 65)); }
      else chars.forEach((c, j) => ctx.fillText(c, 128, 170 + j * 62));
      ctx.font = '27px monospace'; ctx.fillText(String(count).padStart(2, '0'), 128, 581);
    });
    sheet(.64, height - .04, label, g).position.set(0, height / 2, .361);
    register(id, g, [0, height * .65, .45], { route: 'work/?category=' + id }, 'folder');
  });
  // Pinned personal note.
  const note = new THREE.Group(); note.position.set(-.68, 4.85, -4.53); note.rotation.z = -.09; room.add(note);
  box(1.76, 1.8, .028, mat(0xe1d39f), 0, 0, 0, note);
  sheet(1.71, 1.73, textTexture(['保持好奇，', '认真做一点', '有用的设计。', '', '陈湘 / 关于我 ↗'], { bg: '#e4d7a9', size: 53, top: 112, spacing: 1.5 }), note).position.z = .022;
  const tape = box(.72, .23, .018, mat(0xc4bd8e), -.05, .9, .04, note); tape.rotation.z = .06;
  register('about', note, [0, -.45, .1], { route: 'about/' });
  // Framed felt board. The welcome note is explicitly authored by the owner.
  const board = new THREE.Group(); board.position.set(3.95, 4.62, -4.54); room.add(board);
  box(3.9, 2.25, .15, woodMat, 0, 0, 0, board);
  const feltTex = texture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#6f7e61'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c8d1b222'; for (let y = 0; y < h; y += 4) for (let x = y % 3; x < w; x += 4) ctx.fillRect(x, y, 1, 1);
    ctx.fillStyle = '#dce0bf'; ctx.font = '17px Arial'; ctx.fillText('一些路过这里的声音', 28, 35);
  });
  sheet(3.64, 2.01, feltTex, board).position.z = .081;
  const welcome = new THREE.Group(); welcome.position.set(-.33, -.02, .12); welcome.rotation.z = -.085; board.add(welcome);
  box(2.18, 1.2, .025, mat(0xe9dca5), 0, 0, 0, welcome);
  sheet(2.14, 1.16, textTexture(['你好呀，', '很高兴在这里遇见你。', '', '工作台欢迎便签 · 非访客留言'], { width: 768, height: 420, size: 43, top: 100, left: 48, spacing: 1.4 }), welcome).position.z = .017;
  sphere(.045, materials.clay, .03, .52, .05, welcome);
  register('guestbook', board, [0, -.9, .2], { route: 'guestbook/' });
  // Computer and actual project artwork on its screen.
  const monitor = new THREE.Group(); monitor.position.set(0, 1.99, -.85); monitor.rotation.y = -.06; room.add(monitor);
  const foot = round(1.5, 1.04, .08, .08, materials.metal, monitor); foot.rotation.x = -Math.PI / 2; foot.position.set(0, .02, .2);
  box(.26, .9, .28, materials.metal, 0, .5, -.1, monitor);
  const monitorHead = new THREE.Group(); monitorHead.position.set(0, 1.82, -.05); monitorHead.rotation.x = -.055; monitor.add(monitorHead);
  const casing = round(4.0, 2.62, .19, .13, materials.dark, monitorHead);
  box(3.91, .27, .205, mat(0xbcc2ad), 0, -1.12, .01, monitorHead);
  const logo = sheet(.27, .16, textTexture(['cx.'], { width: 128, height: 64, bg: '#bcc2ad', fg: '#56664d', size: 48, top: 51, left: 27 }), monitorHead); logo.position.set(0, -1.13, .118);
  const screenCanvas = document.createElement('canvas'); screenCanvas.width = 1280; screenCanvas.height = 720;
  const screenContext = screenCanvas.getContext('2d');
  const screenTexture = new THREE.CanvasTexture(screenCanvas); screenTexture.colorSpace = THREE.SRGBColorSpace; textures.push(screenTexture);
  const screen = sheet(3.73, 2.11, screenTexture, monitorHead); screen.position.set(0, .11, .135);
  const screenGlow = new THREE.PointLight(0xe6efd5, .3, 3); screenGlow.position.set(0, 1.8, 1.1); monitor.add(screenGlow);
  register('monitor', monitor, [0, 1.1, .55], { route: 'work/dayibu/' }, 'monitor').part = monitorHead;
  async function paintScreen(id) {
    currentFeature = id; const project = window.PROJECTS.find(p => p.id === id);
    entries.get('monitor').action.route = 'work/' + id + '/';
    const ctx = screenContext;
    ctx.fillStyle = '#e9e6d9'; ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#657254'; ctx.font = '16px monospace'; ctx.fillText('SELECTED WORK  /  CHEN XIANG', 42, 38);
    const image = new Image();
    image.onload = () => {
      if (currentFeature !== id) return;
      const ratio = Math.min(1188 / image.width, 580 / image.height); const w = image.width * ratio, h = image.height * ratio;
      ctx.drawImage(image, (1280 - w) / 2, 56 + (580 - h) / 2, w, h);
      ctx.fillStyle = '#e9e6d9'; ctx.fillRect(0, 646, 1280, 74); ctx.fillStyle = '#3d5034'; ctx.font = '24px Arial,"Microsoft YaHei"'; ctx.fillText(project.title, 42, 689);
      ctx.font = '16px monospace'; ctx.fillText('OPEN PROJECT ↗', 1030, 690); screenTexture.needsUpdate = true; wake(500);
    };
    image.onerror = () => { ctx.fillStyle = '#526747'; ctx.font = '40px Arial'; ctx.fillText(project.title, 60, 340); screenTexture.needsUpdate = true; wake(300); };
    image.src = new URL('assets/' + project.cover, BASE).href;
    screenTexture.needsUpdate = true;
  }
  paintScreen('dayibu');
  // A tactile keyboard with discrete keycaps.
  const keyboard = new THREE.Group(); keyboard.position.set(0, 2.04, 1.45); keyboard.rotation.y = -.06; room.add(keyboard);
  const keyboardBase = round(3.2, 1.05, .08, .08, mat(0xa0a78b), keyboard); keyboardBase.rotation.x = -Math.PI / 2;
  for (let row = 0; row < 4; row++) for (let col = 0; col < 12; col++) {
    const key = box(.19, .065, .17, row === 0 && col < 3 ? materials.sage : materials.cream, -1.39 + col * .252, .09, -.36 + row * .23, keyboard);
  }
  box(1.12, .07, .15, materials.paper, 0, .09, .44, keyboard);
  // Turntable, record grooves and a mechanical tonearm.
  const record = new THREE.Group(); record.position.set(-4.25, 2.01, 1.15); record.rotation.y = -.16; room.add(record);
  const recordBase = round(3.0, 2.3, .25, .1, woodMat, record); recordBase.rotation.x = -Math.PI / 2;
  box(2.87, .04, 2.17, materials.olive, 0, .15, 0, record);
  const vinyl = new THREE.Group(); vinyl.position.set(-.29, .21, 0); record.add(vinyl);
  cylinder(.92, .92, .035, mat(0x252d28, .4), 0, 0, 0, vinyl, 64);
  for (let i = 0; i < 15; i++) {
    const groove = new THREE.Mesh(new THREE.TorusGeometry(.38 + i * .033, .0035, 3, 64), mat(i % 2 ? 0x3c443b : 0x353d33, .45)); groove.rotation.x = Math.PI / 2; groove.position.y = .021; vinyl.add(groove);
  }
  cylinder(.27, .27, .01, materials.clay, 0, .027, 0, vinyl, 40);
  const label = sheet(.42, .42, textTexture(['cx.', 'SIDE A'], { bg: '#c27f60', fg: '#694c35', size: 130, top: 220, left: 127, spacing: 1.4 }), vinyl, true); label.position.y = .035;
  cylinder(.026, .026, .03, materials.brass, 0, .055, 0, vinyl, 12);
  const arm = new THREE.Group(); arm.position.set(.99, .18, -.8); record.add(arm);
  cylinder(.13, .15, .12, materials.dark, 0, .03, 0, arm);
  rod(new THREE.Vector3(0, .15, 0), new THREE.Vector3(-.15, .25, 1.05), .035, materials.metal, arm);
  box(.14, .12, .3, materials.dark, -.15, .21, 1.08, arm);
  cylinder(.07, .08, .07, materials.brass, 1.18, .21, .8, record);
  register('music', record, [0, .3, .9], { action: 'music' }, 'record').part = arm;
  // Sketchbook with a hinged cover and the user-provided drawing page.
  const sketch = new THREE.Group(); sketch.position.set(-1.95, 2.02, 2.64); sketch.rotation.y = -.22; room.add(sketch);
  box(2.21, .11, 1.68, materials.olive, 0, 0, 0, sketch);
  box(2.12, .1, 1.58, materials.paper, .025, .065, 0, sketch);
  const inner = sheet(2.05, 1.5, textTexture(['NOTES / 03', '', '观察 · 草图 · 迭代'], { width: 720, height: 520, bg: '#f0ebdb', size: 40, top: 90, left: 55 }), sketch, true); inner.position.y = .124;
  const coverHinge = new THREE.Group(); coverHinge.position.set(-1.08, .135, 0); sketch.add(coverHinge);
  box(2.16, .025, 1.66, mat(0xddd8ba), 1.08, 0, 0, coverHinge);
  const sketchTex = texture(768, 550, (ctx, w, h) => {
    ctx.fillStyle = '#e7e1cc'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#8c9a7224'; ctx.lineWidth = 1;
    for (let y = 55; y < h; y += 34) { ctx.beginPath(); ctx.moveTo(28, y); ctx.lineTo(w - 28, y); ctx.stroke(); }
    ctx.fillStyle = '#889677'; ctx.font = '17px monospace'; ctx.fillText('NOTES & ITERATIONS   /  No.03', 42, 53);
    ctx.fillStyle = '#526647'; ctx.font = '52px Arial,"Microsoft YaHei"'; ctx.fillText('好想法，', 43, 154); ctx.fillText('都有草稿。', 43, 227);
    ctx.strokeStyle = '#6b7a5a'; ctx.lineWidth = 2;
    const points = [[412,280],[535,197],[681,246],[560,343],[412,280],[412,363],[557,422],[681,333],[681,246],[560,343],[557,422]];
    ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));ctx.stroke();
    ctx.beginPath();ctx.ellipse(485,330,22,35,.4,0,Math.PI*2);ctx.ellipse(610,352,22,35,.4,0,Math.PI*2);ctx.stroke();
    ctx.font = '17px Arial';ctx.fillText('DESIGN IS A PROCESS.   速写本 ↗', 43, 505);
  });
  const sourceSketch = new Image();
  sourceSketch.onload = () => {
    const ctx = sketchTex.image.getContext('2d');
    ctx.fillStyle = '#e7e1cc'; ctx.fillRect(375, 150, 353, 302);
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(sourceSketch, 375, 160, 352, 250); ctx.globalCompositeOperation = 'source-over';
    sketchTex.needsUpdate = true; wake(400);
  };
  sourceSketch.src = new URL('assets/portfolio-15.webp', BASE).href;
  const coverFace = sheet(2.12, 1.62, sketchTex, coverHinge, true); coverFace.position.set(1.08, .017, 0);
  for (let i = 0; i < 8; i++) { const ring = new THREE.Mesh(new THREE.TorusGeometry(.067, .012, 5, 12), materials.dark); ring.rotation.y = Math.PI / 2; ring.position.set(-1.09, .12, -.66 + i * .185); sketch.add(ring); }
  register('sketchbook', sketch, [0, .1, .5], { route: 'process/' }, 'book').part = coverHinge;
  // Original project colors as a small fan of material samples.
  const cmf = new THREE.Group(); cmf.position.set(2.45, 2.08, 1.75); cmf.rotation.y = .18; room.add(cmf);
  let sampleTop;
  ['#d12920', '#2e58a6', '#779649'].forEach((color, i) => {
    const sample = new THREE.Group(); sample.position.set(-.33 + i * .32, i * .05, 0); sample.rotation.y = (i - 1) * .35; cmf.add(sample);
    box(.92, .035, 1.48, materials.paper, 0, 0, 0, sample);
    const map = texture(300, 480, (ctx,w,h) => { ctx.fillStyle = '#ede8d6';ctx.fillRect(0,0,w,h);ctx.fillStyle = color;ctx.fillRect(12,12,w-24,310);ctx.fillStyle='#647252';ctx.font='42px Georgia';ctx.fillText('CMF',24,380);ctx.font='19px monospace';ctx.fillText(color.toUpperCase(),24,430); });
    sheet(.88, 1.42, map, sample, true).position.y = .021;
    cylinder(.024, .024, .02, materials.brass, -.33, .04, -.61, sample);
    if (i === 2) sampleTop = sample;
  });
  cylinder(.43, .43, .08, mat(0xd0c4a2), 1.11, .02, .15, cmf, 32);
  register('cmf', cmf, [0, .1, .9], { route: 'cmf/' }, 'sample').part = sampleTop;
  // Letter and its triangular flap.
  const envelope = new THREE.Group(); envelope.position.set(4.65, 2.02, 2.82); envelope.rotation.y = -.18; room.add(envelope);
  box(1.95, .025, 1.21, mat(0xe6dfc6), 0, 0, 0, envelope);
  const envelopeTex = texture(700, 430, (ctx,w,h) => {
    ctx.fillStyle='#e4ddc6';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#a7ad8b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w/2,h*.6);ctx.lineTo(w,0);ctx.stroke();
    ctx.fillStyle='#71835e';ctx.fillRect(576,37,77,85);ctx.fillStyle='#e2e7cd';ctx.font='32px Georgia';ctx.fillText('CX',591,88);ctx.fillStyle='#667650';ctx.font='18px monospace';ctx.fillText('TO: NEXT OPPORTUNITY',43,280);ctx.font='36px Arial';ctx.fillText('简历与联系 ↗',43,349);
  });
  sheet(1.92, 1.18, envelopeTex, envelope, true).position.y = .017;
  const flap = new THREE.Group(); flap.position.set(0, .024, -.605); envelope.add(flap);
  const flapGeometry = new THREE.BufferGeometry(); flapGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.975,0,0,.975,0,0,0,0,.7],3));flapGeometry.computeVertexNormals();
  flap.add(new THREE.Mesh(flapGeometry,new THREE.MeshStandardMaterial({color:0xe9e2ca,side:THREE.DoubleSide,roughness:.9})));
  register('contact', envelope, [0, .15, .5], { route: 'contact/' }, 'envelope').part = flap;
  // Typewriter with raised paper, roller and individual keys.
  const typewriter = new THREE.Group(); typewriter.position.set(4.45, 2.13, -.08); typewriter.rotation.y = -.13; room.add(typewriter);
  const typeBase = round(2.65, 1.79, .27, .14, mat(0x9aaa87), typewriter);typeBase.rotation.x=-Math.PI/2;
  box(2.55,.16,1.6,mat(0xabb99a),0,.18,0,typewriter);
  const roller=cylinder(.12,.12,2.45,materials.dark,0,.58,-.68,typewriter);roller.rotation.z=Math.PI/2;
  for(const x of [-1.36,1.36]) {const knob=cylinder(.13,.13,.16,materials.cream,x,.58,-.68,typewriter);knob.rotation.z=Math.PI/2;}
  const paper=new THREE.Group();paper.position.set(0,.61,-.74);paper.rotation.x=-.12;typewriter.add(paper);
  box(1.95,1.5,.018,materials.paper,0,.75,0,paper);
  sheet(1.91,1.46,textTexture(['HELLO, STRANGER.', '', '欢迎来坐坐。', '留一点灵感，', '或者打个招呼。', '', '写张便签 ↗'],{width:600,height:480,size:37,top:65,left:38,spacing:1.37}),paper).position.set(0,.75,.015);
  for(let row=0;row<3;row++)for(let col=0;col<9-row;col++)cylinder(.071,.073,.05,col===0?materials.olive:materials.cream,-1.02+col*.25+row*.12,.34,-.2+row*.29,typewriter,16);
  box(1.08,.06,.13,materials.cream,0,.34,.73,typewriter);
  rod(new THREE.Vector3(-1.2,.45,-.68),new THREE.Vector3(-1.55,.45,-.15),.027,materials.metal,typewriter);
  register('compose',typewriter,[0,.55,.6],{action:'compose'},'typewriter').part=paper;
  // Plant, pencil cup and desk lamp are quiet scene dressing.
  const plant=new THREE.Group();plant.position.set(-5.8,2.04,-1.95);room.add(plant);
  cylinder(.37,.27,.63,materials.clay,0,.3,0,plant);cylinder(.34,.34,.018,mat(0x4d4631),0,.62,0,plant);
  rod(new THREE.Vector3(0,.56,0),new THREE.Vector3(.08,1.8,0),.023,materials.olive,plant);
  for(let i=0;i<7;i++){
    const angle=i*2.2,leaf=sphere(.25,i%2?mat(0x6c8656):mat(0x7d9667),Math.cos(angle)*.23,.9+i*.12,Math.sin(angle)*.21,plant);
    leaf.scale.set(.65,1.9,.24);leaf.rotation.set(Math.sin(angle)*.7,angle,Math.cos(angle)*.65);
  }
  const cup=new THREE.Group();cup.position.set(-2.7,2.04,-2.0);room.add(cup);
  cylinder(.22,.18,.56,materials.cream,0,.27,0,cup);
  for(let i=0;i<4;i++)rod(new THREE.Vector3((i-1.5)*.07,.4,0),new THREE.Vector3((i-1.5)*.12,1.02+i*.03,.02),.024,[materials.clay,materials.olive,materials.brass,materials.ink][i],cup);
  const lamp=new THREE.Group();lamp.position.set(5.75,1.98,-2.0);room.add(lamp);
  cylinder(.48,.5,.09,materials.olive,0,.06,0,lamp);
  rod(new THREE.Vector3(0,.12,0),new THREE.Vector3(0,1.3,0),.035,materials.brass,lamp);
  rod(new THREE.Vector3(0,1.3,0),new THREE.Vector3(-.45,2.05,0),.04,materials.brass,lamp);
  rod(new THREE.Vector3(-.45,2.05,0),new THREE.Vector3(-1.03,1.97,.1),.04,materials.brass,lamp);
  for(const [x,y] of [[0,1.3],[-.45,2.05]])sphere(.085,materials.olive,x,y,0,lamp);
  const shade=new THREE.Mesh(new THREE.ConeGeometry(.47,.42,32,1,true),new THREE.MeshStandardMaterial({color:0x6a7e57,side:THREE.DoubleSide,roughness:.7}));shade.position.set(-1.07,1.8,.1);lamp.add(shade);
  cylinder(.38,.38,.015,new THREE.MeshBasicMaterial({color:0xffe3a1}),-1.07,1.6,.1,lamp,32);
  const glow=new THREE.PointLight(0xffcc81,1.5,7,2);glow.position.set(-1.07,1.5,.1);lamp.add(glow);lampLights.push(glow);
  const loosePencil=new THREE.Group();loosePencil.position.set(-4.18,2.03,2.98);loosePencil.rotation.y=.3;room.add(loosePencil);
  const pencil=cylinder(.025,.025,1.7,materials.brass,0,0,0,loosePencil,6);pencil.rotation.z=Math.PI/2;
  const pencilTip=new THREE.Mesh(new THREE.ConeGeometry(.026,.14,6),materials.cream);pencilTip.rotation.z=-Math.PI/2;pencilTip.position.x=.92;loosePencil.add(pencilTip);

  function wake(ms=900){ if(destroyed)return;until=Math.max(until,performance.now()+ms);if(!frame)frame=requestAnimationFrame(tick); }
  function fit() {
    const rect=viewport.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const aspect=rect.width/rect.height;
    renderer.setSize(rect.width,rect.height,false);
    camera.position.copy(baseCamera);camera.lookAt(baseTarget);camera.updateMatrixWorld();
    const bounds=new THREE.Box3().setFromObject(room);
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
      const v=new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);
    }
    fitHeight=Math.max((maxY-minY)*1.03,(maxX-minX)/aspect*1.04);
    // Center on the actual projected room rather than the geometric origin.
    const midY=(minY+maxY)/2;const up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
    baseTarget.addScaledVector(up,midY);baseCamera.addScaledVector(up,midY);
    camera.top=fitHeight/2;camera.bottom=-fitHeight/2;camera.left=-fitHeight*aspect/2;camera.right=fitHeight*aspect/2;
    camera.position.copy(baseCamera);camera.lookAt(baseTarget);camera.updateProjectionMatrix();wake(600);
  }
  const labels=[...document.querySelectorAll('.scene-hotspot')];
  function updateLabels(){
    if(mobile())return;
    const rect=viewport.getBoundingClientRect();
    for(const entry of entries.values()){
      const label=labels.find(el=>el.dataset.scene===entry.id);if(!label)continue;
      labelVector.copy(entry.anchor);entry.group.localToWorld(labelVector);labelVector.project(camera);
      label.style.left=((labelVector.x*.5+.5)*rect.width)+'px';label.style.top=((-labelVector.y*.5+.5)*rect.height+14)+'px';
    }
  }
  function setHover(id){
    if(hovered===id)return;hovered=id;canvas.style.cursor=id?'pointer':'default';
    labels.forEach(el=>el.classList.toggle('is-hovered',el.dataset.scene===id));
    $('#scene-hint').textContent=id?({industrial:'抽出文件夹，看看工业设计。',interaction:'翻开文件夹，看看交互设计。',service:'从体验与服务的角度看作品。',aigc:'看看人和 AI 一起探索的可能。',visual:'翻翻视觉与信息设计。',monitor:'点击屏幕，打开这份作品。',sketchbook:'翻开速写本，看看想法的过程。',cmf:'抽一张色卡，看看材料与颜色。',about:'读一张便签，认识陈湘。',contact:'打开信封，查看简历与联系方式。',music:'放一张唱片，陪想法待一会儿。',compose:'打几个字，留一张便签。',guestbook:'看看路过这里的人留下了什么。'}[id]):'移动鼠标看看，点一件物品坐下来。';wake(700);
  }
  function pick(clientX,clientY){
    const rect=canvas.getBoundingClientRect();rayPoint.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(rayPoint,camera);
    return raycaster.intersectObjects(interactive,false)[0]?.object.userData.entry||null;
  }
  function activate(id){
    const entry=entries.get(id);if(!entry||reading||transition)return;
    focused=id;setHover(id);
    const target=entry.group.getWorldPosition(new THREE.Vector3());target.y+=entry.anchor.y*.45;
    transition={id,start:performance.now(),target};
    if(reducedMotion.matches){open(entry);return;}
    wake(500);openingTimer=setTimeout(()=>open(entry),320);
  }
  function open(entry){
    openingTimer=null;window.dispatchEvent(new CustomEvent('studio:open',{detail:entry.action}));
    transition=null;wake(100);
  }
  function tick(time){
    frame=0;if(destroyed)return;
    const dt=Math.min(.045,(time-lastTime)/1000||.016);lastTime=time;
    const damping=1-Math.exp(-dt*11);
    if(!reading){
      pointer.lerp(reducedMotion.matches?new THREE.Vector2():targetPointer,damping);
      const wanted=baseCamera.clone();wanted.x+=pointer.x*.34;wanted.y+=pointer.y*.16;
      const target=baseTarget.clone();
      let zoom=1;
      if(transition&&!reducedMotion.matches){const q=Math.min(1,(time-transition.start)/320),ease=1-Math.pow(1-q,3);target.lerp(transition.target,ease*.07);zoom=1+ease*.055;}
      camera.position.lerp(wanted,damping);camera.lookAt(target);camera.zoom=THREE.MathUtils.lerp(camera.zoom,zoom,damping);camera.updateProjectionMatrix();
      for(const e of entries.values()){
        const selected=e.id===hovered||e.id===focused;
        const opening=transition?.id===e.id;
        e.lift=THREE.MathUtils.lerp(e.lift,selected?(opening ? .12 : .055):0,damping);
        e.amount=THREE.MathUtils.lerp(e.amount,opening?1:selected ? .22 : 0,damping);
        e.group.position.copy(e.basePosition);e.group.position.y+=e.lift;
        if(e.motion==='folder')e.group.position.z+=e.amount*.30;
        if(e.motion==='monitor')e.part.rotation.x=-.055-e.amount*.035;
        if(e.motion==='book')e.part.rotation.z=e.amount*.95;
        if(e.motion==='sample'){e.part.position.y=.10+e.amount*.22;e.part.position.z=e.amount*.2;}
        if(e.motion==='envelope')e.part.rotation.x=-e.amount*.7;
        if(e.motion==='typewriter')e.part.position.y=.61+e.amount*.45;
        if(e.motion==='record')e.part.rotation.y=(document.body.classList.contains('playing')?.25:0)+e.amount*.12;
      }
      if(document.body.classList.contains('playing')&&!reducedMotion.matches)vinyl.rotation.y+=dt*.65;
    }
    const lightTarget=night ? .50 : 2.5;hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,lightTarget,damping);
    sun.intensity=THREE.MathUtils.lerp(sun.intensity,night ? .25 : 4.0,damping);
    fill.intensity=THREE.MathUtils.lerp(fill.intensity,night ? .30 : 1.2,damping);
    for(const light of lampLights)light.intensity=THREE.MathUtils.lerp(light.intensity,night?9:1.5,damping);
    renderer.render(scene,camera);renderedFrames++;updateLabels();
    if(visible&&!document.hidden&&!reading&&(time<until||document.body.classList.contains('playing')))frame=requestAnimationFrame(tick);
  }
  viewport.addEventListener('pointermove',event=>{
    if(reading||event.pointerType==='touch')return;
    const r=viewport.getBoundingClientRect();targetPointer.set((event.clientX-r.left)/r.width*2-1,-((event.clientY-r.top)/r.height*2-1));
    setHover(pick(event.clientX,event.clientY));wake(600);
  });
  viewport.addEventListener('pointerleave',()=>{targetPointer.set(0,0);setHover(null);wake(800);});
  let down=null;
  viewport.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY};});
  viewport.addEventListener('pointerup',event=>{
    if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>9)return;
    const id=pick(event.clientX,event.clientY);down=null;if(id)activate(id);
  });
  labels.forEach(label=>{
    label.addEventListener('focus',()=>{setHover(label.dataset.scene);});
    label.addEventListener('blur',()=>{if(!transition)setHover(null);});
    label.addEventListener('pointerenter',()=>setHover(label.dataset.scene));
    label.addEventListener('pointerleave',()=>{if(!label.matches(':focus-visible'))setHover(null);});
  });
  $('#scene-label-toggle').addEventListener('click',event=>{
    const button=event.currentTarget,pressed=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(pressed));
    button.querySelector('span').textContent=pressed?'−':'＋';stage.classList.toggle('labels-on',pressed);
  });
  $('#scene-light-toggle').addEventListener('click',event=>{
    night=!night;event.currentTarget.setAttribute('aria-pressed',String(night));event.currentTarget.innerHTML=night?'☾ <span>灯下</span>':'☀ <span>日光</span>';stage.classList.toggle('night-mode',night);wake(1200);
  });
  window.addEventListener('studio:feature',event=>paintScreen(event.detail.id));
  const observer=new MutationObserver(()=>{
    const wasReading=reading;reading=!!document.querySelector('dialog[open]');
    if(wasReading&&!reading){focused=null;transition=null;targetPointer.set(0,0);setHover(null);wake(1100);}
    else if(reading){if(openingTimer){clearTimeout(openingTimer);openingTimer=null;transition=null;}if(frame)cancelAnimationFrame(frame);frame=0;renderer.render(scene,camera);updateLabels();}
    else wake(400);
  });
  document.querySelectorAll('dialog').forEach(d=>observer.observe(d,{attributes:true,attributeFilter:['open']}));
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  const intersection=new IntersectionObserver(items=>{visible=items[0].isIntersecting;if(visible)wake(500);else if(frame){cancelAnimationFrame(frame);frame=0;}},{rootMargin:'120px'});intersection.observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else wake(500);});
  reducedMotion.addEventListener('change',()=>{targetPointer.set(0,0);wake(500);});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&transition&&!reading){clearTimeout(openingTimer);openingTimer=null;transition=null;focused=null;setHover(null);wake(700);}
  });
  const resize=new ResizeObserver(()=>fit());resize.observe(viewport);
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();destroyed=true;if(frame)cancelAnimationFrame(frame);clearTimeout(openingTimer);stage.hidden=true;document.body.classList.remove('has-three');document.body.dataset.sceneEngine='fallback';window.STUDIO_3D.ready=false;
    observer.disconnect();intersection.disconnect();resize.disconnect();
  });
  stage.hidden=false;document.body.classList.add('has-three');document.body.dataset.sceneEngine='three.js';
  reading=!!document.querySelector('dialog[open]');
  fit();renderer.render(scene,camera);updateLabels();
  window.STUDIO_3D={
    ready:true,engine:'three.js',version:THREE.REVISION,activate,hitTest:pick,
    get diagnostics(){return{frames:renderedFrames,objects:entries.size,reading,hovered,focused,night,playing:document.body.classList.contains('playing'),drawCalls:renderer.info.render.calls};},
    project(id){const e=entries.get(id);if(!e)return null;const p=e.group.localToWorld(e.anchor.clone()).project(camera),r=canvas.getBoundingClientRect();return{x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height};},
    get cameraPosition(){return camera.position.toArray();}
  };
  window.dispatchEvent(new CustomEvent('studio:ready'));
  wake(1000);
}
