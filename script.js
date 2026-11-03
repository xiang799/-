'use strict';
const BASE = new URL(document.querySelector('base').href);
const PROJECTS = window.PROJECTS;
const CONFIG = window.SITE_CONFIG || { music: [], guestbookApi: '' };
const categories = { industrial: '工业设计', interaction: '交互设计', service: '体验与服务', aigc: 'AIGC 探索', visual: '视觉与信息设计' };
const types = { case: '完整案例', gallery: '作品图集', research: '研究资料' };
const $ = (s, el = document) => el.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = path => new URL(path, BASE).href;
const asset = file => url('assets/' + file);
const link = (path, text, cls = '') => `<a data-nav class="${cls}" href="${esc(url(path))}">${text}</a>`;
const panel = $('#content-panel');
const viewer = $('#image-viewer');
const panelBody = $('#panel-body');
const audio = $('#background-audio');
let lastOpener = null;
let activeRoute = '';
let toastTimer;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const guest = { items: [], loading: false, loaded: false, error: '', newest: null, cursor: null };
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}
function syncLock() {
  const opened = [...document.querySelectorAll('dialog[open]')];
  const top = opened.at(-1) || document.body;
  document.body.classList.toggle('body-locked', opened.length > 0);
  // Native dialogs make siblings inert. Keep pause and status controls in the
  // active top layer, so they remain usable while reading or editing a note.
  for (const id of ['music-dock', 'toast']) {
    const element = document.getElementById(id);
    if (element && element.parentElement !== top) top.append(element);
  }
}
function relativeRoute() {
  const path = location.pathname.startsWith(BASE.pathname) ? location.pathname.slice(BASE.pathname.length) : '';
  return decodeURIComponent(path).replace(/^\/+|\/+$/g, '');
}
function rememberScroll() {
  history.replaceState({ ...history.state, scroll: panel.open ? panel.scrollTop : window.scrollY }, '', location.href);
}
function navigate(path, { replace = false } = {}) {
  rememberScroll();
  const previous = location.pathname + location.search;
  history[replace ? 'replaceState' : 'pushState']({ app: true, previous, scroll: 0 }, '', url(path));
  renderRoute();
}
function panelHeading(eyebrow, title, right = '') {
  return `<div class="panel-heading"><div><p class="eyebrow">${eyebrow}</p><h2 id="panel-title" tabindex="-1">${title}</h2></div>${right}</div>`;
}
function card(p) {
  const cover = p.cover ? `<img src="${esc(asset(p.id === 'yaozhi' ? 'yaozhi-preview.webp' : p.cover))}" alt="${esc(p.title)}作品预览" loading="eager" decoding="async">` : `<div class="cover-placeholder"><small>${esc(p.en)}</small><b>${p.pending ? '待补充' : 'AI / 01'}</b><small>${p.pending ? '项目材料整理中' : '训练研究 · 暂无成果图'}</small></div>`;
  return `<article class="project-card">${link(`work/${p.id}/`, `<div class="project-cover">${cover}<span class="card-open" aria-hidden="true">↗</span></div><span class="content-type">${types[p.contentType]}${p.pending ? ' · 材料待补充' : ''}</span><h3>${esc(p.title)}</h3><p class="subtitle">${esc(p.subtitle)}</p><div class="tag-line">${p.categories.map(c => `<span>${categories[c]}</span>`).join('')}</div><p class="card-role">${esc(p.roleShort)}</p>`)}</article>`;
}
function workView(params) {
  const category = params.get('category') || 'all';
  const featured = params.get('featured') === '1';
  const filtered = PROJECTS.filter(p => (!featured || p.featured) && (category === 'all' || p.categories.includes(category)));
  const filters = [['all', '全部作品'], ...Object.entries(categories)].map(([key, text]) => link(`work/${key === 'all' ? '' : '?category=' + key}`, `${text} <small>${PROJECTS.filter(p => key === 'all' || p.categories.includes(key)).length}</small>`, category === key && !featured ? 'active' : '')).join('');
  return `${panelHeading('THE PROJECT ARCHIVE', featured ? '从这四个项目，<em>认识我。</em>' : '一些思考，也有一些<em>答案。</em>', `<span class="small-label">${filtered.length} PROJECTS</span>`)}<p class="panel-lead">从产品形态到交互体验，记录观察、选择与方案形成的过程。分类可以交叉，项目详情始终是同一份。</p><nav class="filter-list" aria-label="作品类别">${filters}${link('work/?featured=1', '首页精选', featured ? 'active' : '')}</nav><div class="project-grid">${filtered.map(card).join('')}</div>`;
}
function figure(image, caption, cls = 'story-image') {
  return `<figure class="${cls}"><button data-image="${esc(image)}" data-caption="${esc(caption)}" aria-label="放大：${esc(caption)}"><img src="${esc(asset(image))}" alt="${esc(caption)}" loading="lazy" decoding="async"></button><figcaption>${esc(caption)} · 点击查看原图 ↗</figcaption></figure>`;
}
const decisionNotes = {
  dayibu: '把衣帽架的模块化组合与应用内的衣物建档、搭配管理放在同一个方案中，让物理收纳与数字信息相互关联。展板提供模块、尺寸与界面流程，尚未提供不同版本的测试记录。',
  'cable-robot': '以跨越斜拉索作业路径为核心组织结构方案。草图、部件拆解与遥控流程共同说明设备移动和操作的构想；现有资料以设计表达为主。',
  hikeshare: '把登山杖与共享设施作为一套系统考虑，结合景区徒步场景组织产品功能、存取与使用流程，避免只讨论单件产品的外形。',
  jizai: '将四季、节气与杯碟纹样、色彩、礼盒连接，形成从饮茶器物到赠礼包装的一组视觉与产品语言。',
  chaozong: '将长沙方言放入自助购茶流程，通过语音助手与表情、界面和场景联系在地文化与操作体验。',
  yaozhi: '围绕同伴支持提出状态、心情分享和相互鼓励的社区交流方式，纳入团队平台概念。个人参与以用户调研与功能构思为主。'
};
function projectView(id) {
  const p = PROJECTS.find(p => p.id === id);
  if (!p) return `${panelHeading('PAGE NOT FOUND', '这份项目暂时找不到。')}${link('work/', '返回作品目录 ↗')}`;
  document.title = p.title + '｜陈湘的工作台';
  const overview = `<div class="case-topline"><span>${esc(types[p.contentType])} / ${esc(p.en)}</span><span>${esc(p.stage)}</span></div><h2 class="case-title" id="panel-title" tabindex="-1">${esc(p.title)}</h2><p class="case-intro">${esc(p.subtitle)}</p><div class="case-meta"><div><label>项目方向 / 类型</label><p>${p.categories.map(c => categories[c]).join(' / ')}<br>${esc(types[p.contentType])}</p></div><div><label>本人贡献${p.roleConfirmed ? ' · 已确认' : ' · 待确认具体分工'}</label><p>${esc(p.role)}</p></div></div>`;
  const cover = p.cover ? `<button data-image="${esc(p.cover)}" data-caption="${esc(p.title)}主视觉" style="padding:0;width:100%"><img class="case-cover" src="${esc(asset(p.cover))}" alt="${esc(p.title)}主视觉"></button>` : '';
  let body;
  if (p.pending) {
    body = `<div class="empty-note">这个项目已加入作品目录。完整图文、项目背景与本人职责尚未提供，资料补齐后会在这里呈现。</div>`;
  } else if (p.contentType === 'case') {
    const process = p.process;
    const gallery = p.gallery;
    const finalImage = gallery[Math.min(gallery.length - 1, p.id === 'cable-robot' ? 6 : 0)];
    const entries = [
      ['background', '01 / 问题与背景', p.sections[0][0], p.sections[0][1], process[0] ? [process[0].image, process[0].title] : gallery[0]],
      ['research', '02 / 研究与洞察', p.id === 'jizai' ? '从文化主题到器物表达' : '让方案有可以追溯的依据', p.sections[Math.min(1, p.sections.length - 1)][1], process[1] ? [process[1].image, process[1].title] : gallery[1]],
      ['decisions', '03 / 设计决策', '为什么选择这样的连接方式？', decisionNotes[id], process[2] ? [process[2].image, process[2].title] : gallery[gallery.length - 1]],
      ['outcome', '04 / 最终方案', p.sections[2][0], p.sections[2][1], finalImage]
    ];
    body = `<nav class="chapter-nav" aria-label="案例章节">${entries.map(([slug, label]) => `<a data-chapter="${slug}" href="#${slug}">${label.split(' / ')[1]}</a>`).join('')}<a data-chapter="reflection" href="#reflection">制作与反思</a><a data-chapter="originals" href="#originals">原稿图集</a></nav>${cover}${entries.map(([slug, number, title, text, image]) => `<section class="story-row" id="${slug}"><div><span class="chapter-number">${number}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></div>${image ? figure(image[0], image[1]) : ''}</section>`).join('')}<section class="case-simple" id="reflection"><span class="small-label">05 / 制作与反思</span><h3>已经呈现的部分，与下一步。</h3><p>现有资料包含${id === 'yaozhi' || id === 'chaozong' || id === 'dayibu' ? '调研／信息组织、界面与场景方案' : '设计构思、产品效果与结构表达'}。实物验证、版本测试及复盘记录尚未提供，后续可以继续补充。${p.roleConfirmed ? '个人贡献已在项目概览中单独列明。' : '项目时间、团队分工及个人贡献还需要进一步确认。'}</p></section>`;
  } else {
    body = `${cover}${p.sections.map(([title, text]) => `<section class="case-simple"><h3>${esc(title)}</h3><p>${esc(text)}</p></section>`).join('')}${p.gallery.length ? `<div class="gallery-grid">${p.gallery.map(g => figure(g[0], g[1], 'gallery-item')).join('')}</div>` : `<p class="empty-note">成果图、训练记录与外部链接待补充。</p>`}`;
  }
  const originals = p.contentType === 'case' ? `<details id="originals" class="original-gallery"><summary>查看完整原稿与展板图集（${p.gallery.length} 张）</summary><div class="gallery-grid">${p.gallery.map(g => figure(g[0], g[1], 'gallery-item')).join('')}</div></details>` : '';
  const related = PROJECTS.filter(x => x.id !== id && !x.pending && x.categories.some(c => p.categories.includes(c))).slice(0, 3);
  return `${overview}${body}${originals}<p class="source-note">资料来源：${esc(p.source)}。保留原图内容与水印。</p><section class="related"><h3>也许你还想看看</h3><div class="related-links">${related.map(x => link(`work/${x.id}/`, esc(x.title) + ' ↗')).join('')}${link('work/', '全部作品 ↗')}</div></section>`;
}
function processView(params) {
  const id = params.get('project') || 'all';
  const available = PROJECTS.filter(p => p.process.length);
  const options = `<option value="all">全部过程档案</option>${available.map(p => `<option value="${p.id}" ${p.id === id ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}`;
  const content = available.filter(p => id === 'all' || p.id === id).flatMap(p => p.process.map(item => `<article class="process-card"><button data-image="${esc(item.image)}" data-caption="${esc(item.title)}" aria-label="放大${esc(item.title)}"><img src="${esc(asset(item.image))}" alt="${esc(item.title)}" loading="lazy"></button><p class="phase">${esc(p.title)} / ${esc(item.phase)}</p><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p>${link(`work/${p.id}/`, '查看完整项目 ↗')}</article>`)).join('');
  return `${panelHeading('THE SKETCHBOOK', '好想法，<em>都有草稿。</em>')}<p class="panel-lead">从观察、草图到方案表达。这里的过程图与案例使用同一份资料，按现有材料呈现。</p><label class="small-label">按项目翻阅 <select class="project-select" id="process-select">${options}</select></label><div class="process-grid" style="margin-top:27px">${content}</div>`;
}
const palettes = {
  jizai: { title: '季载 · 四季配色', colors: [['春 · 青山色', '#779649'], ['夏 · 珊瑚橘', '#d12920'], ['秋 · 紫黛色', '#72127c'], ['冬 · 海涛蓝', '#2e58a6']], reason: '原展板以四季组织茶具纹样与礼盒。配色来自展板标注；下图为原方案中的四季包装，不模拟尚不存在的改色效果。', image: 'jizai-board-3.webp' },
  yaozhi: { title: '药止 · 品牌色彩', colors: [['品牌紫', '#8164FE'], ['辅助粉', '#F5B8E3'], ['文字灰', '#3E3E3E']], reason: '以紫色为品牌主色，辅助粉色与深灰文字建立界面层级。色值依据原展板标注，图示为原有界面方案。', image: 'yaozhi-board-3.webp' },
  chaozong: { title: '潮宗茶栈 · 界面色彩', colors: [['主色', '#EA4735'], ['辅助色', '#222222'], ['底色', '#F8F6F5']], reason: '原方案以暖红、深色文字与浅色底组织方言售茶界面；色值来自原展板的色彩规范。', image: 'chaozong-board-2.webp' }
};
function cmfView(params) {
  const id = Object.hasOwn(palettes, params.get('project')) ? params.get('project') : 'jizai';
  const data = palettes[id];
  const selected = Math.min(data.colors.length - 1, Math.max(0, Number(params.get('color')) || 0));
  const [name, hex] = data.colors[selected];
  const rgb = hex.match(/[\da-f]{2}/ig).map(x => parseInt(x, 16)).join(', ');
  return `${panelHeading('COLOR · MATERIAL · FINISH', '让想法，<em>触手可及。</em>')}<p class="panel-lead">已有方案里的色彩、材质与应用。区分设计选材与实物制作，不推测潘通编号。</p><div class="cmf-layout"><div><label class="small-label">选择项目 <select class="project-select" id="cmf-select">${Object.entries(palettes).map(([key, p]) => `<option value="${key}" ${key === id ? 'selected' : ''}>${p.title}</option>`).join('')}</select></label><div class="swatch-row" role="group" aria-label="项目色卡">${data.colors.map(([n, c], i) => `<button class="swatch-button" data-color="${i}" data-project="${id}" style="--swatch:${c}" aria-label="${n} ${c}" aria-pressed="${i === selected}"></button>`).join('')}</div><h3 class="swatch-name">${name}</h3><p class="swatch-values">HEX ${hex}<br>RGB ${rgb}</p><p class="cmf-note">${data.reason}</p>${link(`work/${id}/`, '查看项目应用 ↗', 'text-button')}</div><div class="cmf-application">${figure(data.image, data.title + ' · 原方案应用', 'application-image')}</div></div><div class="material-list"><article><img src="${asset('yu-chair-cover.webp')}" alt="渔网座椅原方案"><h3>废弃渔网 × 钢管</h3><p>渔再生座椅 · 拟采用材料。以金属骨架与网面构成座椅的支撑及使用面。${link('work/yu-chair/', '查看项目 ↗')}</p></article><article><img src="${asset('sunflower-cover.webp')}" alt="豆形灯原方案"><h3>不锈钢灯柄</h3><p>豆·葵 · 原方案标注的设计选材。用于连接灯头、托盘与底座。${link('work/sunflower/', '查看项目 ↗')}</p></article><article><img src="${asset('jizai-cover.webp')}" alt="季载杯碟原方案"><h3>陶瓷 × 金属</h3><p>季载 · 方案中的器物材料关系，结合杯碟纹样与反射表达节气。${link('work/jizai/', '查看项目 ↗')}</p></article></div>`;
}
function aboutView() {
  return `${panelHeading('A LITTLE ABOUT CHEN XIANG', '保持好奇，<em>认真回应。</em>')}<div class="profile-layout"><aside class="profile-sidebar"><img class="profile-photo" src="${asset('chen-xiang.jpg')}" alt="陈湘的证件照"><h3>陈湘 <small>Chen Xiang</small></h3><p>中南大学 · 设计学硕士在读<br>产品设计本科 · 2028 届</p>${link('contact/', '下载简历 / 联系我 ↗')}</aside><div><p class="bio">我是陈湘，中南大学设计学硕士在读，本科就读产品设计。关注用户研究、产品体验与设计落地，也在探索 AIGC 如何支持创作和产品设计。</p><p class="bio">从访谈、问卷与需求拆解，到原型、建模和生产资料交付，希望把对人的观察转化为清晰、可沟通的方案。</p><section class="about-section"><h3>教育背景</h3><div class="timeline"><time>2025.09 — 预计 2028</time><div><h4>中南大学 · 设计学硕士</h4><p>985 / 211 · 在读</p></div></div><div class="timeline"><time>2021.09 — 2025.06</time><div><h4>中南大学 · 产品设计本科</h4></div></div></section><section class="about-section"><h3>实习与项目实践</h3><div class="timeline"><time>2026.06 — 2026.10</time><div><h4>上海亦玩游乐设备有限公司 · 产品研发</h4><p>梳理儿童红绿灯的按钮、灯光与语音规则；完成建模、渲染与生产资料交付，对接厂家与跨部门协作，项目进入外包生产阶段。</p></div></div><div class="timeline"><time>2024.09 — 2024.12</time><div><h4>湖南极友科技有限公司 · AIGC 岗产品助理</h4><p>制作官网高保真原型与交互说明，对接软件部完成改版上线；参与脚本、分镜、视频与海报创作。</p></div></div><div class="timeline"><time>2025.09 — 2025.11</time><div><h4>苏泊尔校企合作 · 吸尘器前期研究</h4><p>主要承担行业背景与品牌竞品分析，参与报告和设计策略讨论。依据当前简历整理，未与空气净化器项目合并。</p></div></div><div class="timeline"><time>2025</time><div><h4>孟极 AIGC 产品设计工作流 · 项目组长</h4><p>清理约 200 张 CT 设备图片并训练 LoRA 模型，经负责人审核后由公司发布至 Liblib。</p>${link('work/ct-lora/', '查看研究资料 ↗', 'text-button')}</div></div></section><section class="about-section"><h3>能力与工具</h3><p class="skill-text">用户访谈 / 问卷分析 / 用户画像 / 用户旅程 / 功能规则与需求拆解<br>Figma / Axure / 墨刀 / Rhino / KeyShot / Photoshop / Illustrator / Office / LoRA 训练</p><div class="related-links" style="margin-top:16px">${link('work/yaozhi/', '用户研究 · 药止 ↗')}${link('work/cable-robot/', '产品与结构表达 · 钢索机器人 ↗')}${link('work/ct-lora/', 'AI 实践 · CT LoRA ↗')}</div></section><section class="about-section"><h3>代表荣誉</h3><p class="skill-text">第 19 届“好创意”生成式人工智能计时赛 · 国家二等奖<br>湖南省大学生工业设计竞赛 · 省级一等奖、二等奖<br>BICC 中英国际设计大赛 · 银奖、铜奖<br>研究生学业奖学金一等奖 · 中南大学优秀学生</p></section></div></div>`;
}
function contactView() {
  return `${panelHeading('A LETTER TO THE NEXT OPPORTUNITY', '聊聊下一件，<em>有意思的事。</em>')}<p class="panel-lead">欢迎产品设计相关实习机会，也欢迎关于作品、体验与创作的交流。</p><div class="contact-grid"><div><div class="contact-row"><span>EMAIL / 邮箱</span><a class="contact-value" href="mailto:3273802897@qq.com">3273802897@qq.com</a><button class="text-button" data-copy="3273802897@qq.com">复制邮箱</button></div><div class="contact-row"><span>PHONE / 电话</span><a class="contact-value" href="tel:13974810029">13974810029</a><button class="text-button" data-copy="13974810029">复制电话</button></div><div class="contact-actions"><a class="primary-button" href="mailto:3273802897@qq.com">发送邮件 ↗</a><a class="secondary-button" href="${asset('chen-xiang-resume.pdf')}" download="陈湘_产品实习简历.pdf">下载简历 ↓</a></div><p class="contact-subtitle">中南大学 · 设计学硕士在读 / 2028 届<br>个人介绍、经历与作品可以从这里继续了解。</p>${link('about/', '关于陈湘 ↗', 'text-button')}</div><div><iframe class="resume-preview" src="${asset('chen-xiang-resume.pdf')}#toolbar=0" title="陈湘产品实习简历 PDF 预览" loading="lazy"></iframe><p class="source-note">若浏览器不支持预览，可使用${`<a href="${asset('chen-xiang-resume.pdf')}" target="_blank" rel="noopener" style="text-decoration:underline">新标签页查看 PDF ↗</a>`}或直接下载。</p></div></div>`;
}
const noteColors = { yellow: '#efdda1', pink: '#e8b9ad', green: '#cbd5b8', blue: '#b9ccd4' };
function guestNotes() {
  return guest.items.map(n => `<article id="note-${esc(n.id)}" class="guest-note ${n.id === guest.newest ? 'new-note' : ''}" style="--note:${noteColors[n.color] || noteColors.yellow}"><p>${esc(n.body)}</p><small>— ${esc(n.nickname || '一位路过的朋友')}</small><time>${esc(new Date(n.created_at).toLocaleDateString('zh-CN'))}</time></article>`).join('');
}
function guestbookView() {
  const state = !CONFIG.guestbookApi ? '公共留言暂未开放，欢迎先写下草稿或通过邮件打个招呼。' : guest.loading ? '正在看看大家留下了什么…' : guest.error || (guest.items.length ? '谢谢你把片刻的想法留在这里。' : '这里还没有访客留言，来留下第一声问候吧。');
  return `${panelHeading('SMALL NOTES, NICE ENCOUNTERS', '一些路过，<em>一些回声。</em>', '<div class="guestbook-heading-actions"><button class="primary-button" data-action="compose">写一张便签 ＋</button><button class="text-button" data-action="reload-guest">刷新留言</button></div>')}<p class="guest-status" role="status">${esc(state)}</p><div class="guestbook-grid">${guestNotes()}</div>${guest.cursor ? '<button class="secondary-button" data-action="more-guest" style="margin-top:25px">更早的便签 ↓</button>' : ''}${!guest.items.length ? '<div class="empty-note">还没有公开的访客便签。工作台上的欢迎语来自站主，访客留言只在真实保存成功后显示。</div>' : ''}`;
}
function renderRoute() {
  const route = relativeRoute();
  const params = new URLSearchParams(location.search);
  // An image is a history entry over the existing main panel, so closing it
  // preserves the panel DOM and its exact scroll position.
  if (params.has('image') && route === activeRoute && panel.open) { showImage(params); return; }
  if (viewer.open) viewer.close();
  for (const id of ['music-dialog', 'compose-dialog']) if ($('#' + id).open) $('#' + id).close();
  activeRoute = route;
  document.title = '陈湘的设计工作台';
  if (!route) {
    if (panel.open) panel.close();
    requestAnimationFrame(() => { window.scrollTo({ top: history.state?.scroll || 0, behavior: 'instant' }); lastOpener?.focus({ preventScroll: true }); });
    syncLock();
    return;
  }
  let html;
  const [section, id] = route.split('/');
  if (section === 'work' && !id) html = workView(params);
  else if (section === 'work' && id) html = projectView(id);
  else if (route === 'process') html = processView(params);
  else if (route === 'cmf') html = cmfView(params);
  else if (route === 'about') html = aboutView();
  else if (route === 'contact') html = contactView();
  else if (route === 'guestbook') html = guestbookView();
  else html = `${panelHeading('NOT FOUND', '好像翻到了空白页。')}${link('work/', '回作品目录 ↗')}`;
  panelBody.innerHTML = `<div class="panel-content">${html}</div>`;
  $('#panel-breadcrumb').textContent = id ? '作品 / 项目档案' : ({ work: '作品目录', process: '速写本 / 设计过程', cmf: '色彩与材质', about: '关于陈湘', contact: '简历与联系', guestbook: '访客留言' }[route] || '工作台');
  if (!panel.open) panel.showModal();
  $('#panel-title')?.focus({ preventScroll: true });
  panel.scrollTo({ top: history.state?.scroll || 0, behavior: 'instant' });
  requestAnimationFrame(() => { panel.scrollTo({ top: history.state?.scroll || 0, behavior: 'instant' }); });
  syncLock();
  if (params.has('image')) showImage(params);
  if (route === 'guestbook' && params.get('note')) requestAnimationFrame(() => document.getElementById('note-' + params.get('note'))?.scrollIntoView({ block: 'center' }));
  if (route === 'guestbook' && !guest.loaded && !guest.loading && CONFIG.guestbookApi) loadGuestbook();
}
function showImage(params) {
  const file = params.get('image');
  const known = PROJECTS.some(p => p.cover === file || p.gallery.some(g => g[0] === file));
  if (!known) return;
  $('#image-full').src = asset(file);
  $('#image-full').alt = params.get('caption') || '作品原图';
  $('#image-caption').textContent = params.get('caption') || '作品原图';
  if (!viewer.open) viewer.showModal();
  viewer.scrollTop = 0;
  syncLock();
}
function closeImage() {
  if (history.state?.image) history.back();
  else { const next = new URL(location.href); next.searchParams.delete('image'); next.searchParams.delete('caption'); history.replaceState(history.state, '', next); viewer.close(); syncLock(); }
}
document.addEventListener('click', event => {
  const sceneObject = event.target.closest('[data-scene]');
  if (sceneObject && window.STUDIO_3D?.ready && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    event.preventDefault(); lastOpener = sceneObject; window.STUDIO_3D.activate(sceneObject.dataset.scene); return;
  }
  const anchor = event.target.closest('a[data-nav]');
  if (anchor && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
    const target = new URL(anchor.href);
    if (target.origin !== location.origin || !target.pathname.startsWith(BASE.pathname)) return;
    event.preventDefault();
    if (!panel.open) lastOpener = anchor;
    navigate(target.pathname.slice(BASE.pathname.length) + target.search);
    return;
  }
  const image = event.target.closest('[data-image]');
  if (image) {
    rememberScroll();
    const next = new URL(location.href);
    next.searchParams.set('image', image.dataset.image); next.searchParams.set('caption', image.dataset.caption || '作品原图');
    history.pushState({ ...history.state, image: true }, '', next);
    showImage(next.searchParams);
  }
  const chapter = event.target.closest('[data-chapter]');
  if (chapter) { event.preventDefault(); const target = $('#' + chapter.dataset.chapter, panelBody); if (target?.tagName === 'DETAILS') target.open = true; target?.scrollIntoView({ behavior: reduced() ? 'instant' : 'smooth' }); }
  const swatch = event.target.closest('[data-color]');
  if (swatch) navigate(`cmf/?project=${swatch.dataset.project}&color=${swatch.dataset.color}`, { replace: true });
  const copy = event.target.closest('[data-copy]');
  if (copy) { navigator.clipboard?.writeText(copy.dataset.copy).then(() => toast('已复制：' + copy.dataset.copy)).catch(() => toast('复制失败，请长按或选中文字复制。')); if (!navigator.clipboard) toast('请选中文字复制：' + copy.dataset.copy); }
  const feature = event.target.closest('[data-feature]');
  if (feature) selectFeature(feature.dataset.feature);
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'music') openMusic();
  if (action === 'compose') openComposer();
  if (action === 'reload-guest') loadGuestbook();
  if (action === 'more-guest') loadGuestbook(true);
  const close = event.target.closest('[data-close]');
  if (close) { $('#' + close.dataset.close).close(); syncLock(); }
});
document.addEventListener('change', event => {
  if (event.target.id === 'process-select') navigate('process/' + (event.target.value === 'all' ? '' : '?project=' + event.target.value));
  if (event.target.id === 'cmf-select') navigate('cmf/?project=' + event.target.value);
});
$('#panel-close').addEventListener('click', () => navigate(''));
$('#panel-back').addEventListener('click', () => {
  const prev = history.state?.previous;
  if (history.state?.app && prev?.startsWith(BASE.pathname)) history.back();
  else navigate(relativeRoute().startsWith('work/') ? 'work/' : '');
});
panel.addEventListener('cancel', event => { event.preventDefault(); navigate(''); });
viewer.addEventListener('cancel', event => { event.preventDefault(); closeImage(); });
$('#image-close').addEventListener('click', closeImage);
window.addEventListener('popstate', () => {
  // Back from an image should only close that image, keeping the reading panel.
  if (!new URLSearchParams(location.search).has('image') && viewer.open && relativeRoute() === activeRoute) { viewer.close(); syncLock(); return; }
  renderRoute();
});
document.querySelectorAll('dialog').forEach(d => d.addEventListener('close', syncLock));
function selectFeature(id) {
  const p = PROJECTS.find(p => p.id === id);
  $('#monitor-image').src = asset(p.cover);
  $('#monitor-image').alt = p.title + '作品预览';
  $('#monitor-title').textContent = p.title;
  $('.monitor-caption>span:last-child').textContent = String(PROJECTS.filter(x => x.featured).findIndex(x => x.id === id) + 1).padStart(2, '0') + ' / 04';
  $('.monitor').href = url('work/' + id + '/');
  $('.monitor').setAttribute('aria-label', '电脑：查看' + p.title);
  document.querySelectorAll('[data-feature]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.feature === id)));
  const sceneMonitor = document.querySelector('[data-scene="monitor"]');
  if (sceneMonitor) sceneMonitor.href = url('work/' + id + '/');
  window.dispatchEvent(new CustomEvent('studio:feature', { detail: { id } }));
}
document.querySelectorAll('[data-count]').forEach(el => el.textContent = String(PROJECTS.filter(p => p.categories.includes(el.dataset.count)).length).padStart(2, '0'));
// Music is independent of main panels and never resumes automatically on reload.
let currentTrack = null;
function openMusic() {
  const tracks = Array.isArray(CONFIG.music) ? CONFIG.music : [];
  $('#music-library').innerHTML = tracks.length ? tracks.map((t, i) => `<article class="music-entry"><div class="album" aria-hidden="true">${t.cover ? `<img src="${esc(url(t.cover))}" alt="">` : 'cx.'}</div><div><h3>${esc(t.title)}</h3><p>${esc(t.artist)}</p><button data-track="${i}">${currentTrack === i && !audio.paused ? '暂停这张唱片' : '放上唱片机 ▶'}</button></div></article>`).join('') : '<div class="music-empty"><span aria-hidden="true">◎</span><p>唱片位留好了，歌单还在挑选中。<br>等真实音源放入后，你可以在这里选择播放。</p></div>';
  if (!$('#music-dialog').open) $('#music-dialog').showModal();
  syncLock();
}
async function playTrack(index) {
  const track = CONFIG.music?.[index];
  if (!track?.src) return;
  if (currentTrack === index && !audio.paused) { audio.pause(); return; }
  if (currentTrack !== index) { audio.pause(); audio.src = url(track.src); currentTrack = index; }
  audio.volume = Number($('#music-volume').value);
  $('#music-status').textContent = '正在加载唱片…';
  try { await audio.play(); $('#music-status').textContent = '正在播放：' + track.title; $('#music-dock').hidden = false; $('#dock-title').textContent = track.title; }
  catch { $('#music-status').textContent = '这张唱片暂时没能播放，请点击重试。作品浏览不受影响。'; }
}
$('#music-library').addEventListener('click', event => { const button = event.target.closest('[data-track]'); if (button) playTrack(Number(button.dataset.track)); });
function musicState() {
  document.body.classList.toggle('playing', !audio.paused);
  $('#dock-toggle').textContent = audio.paused ? '▶' : 'Ⅱ';
  $('#dock-toggle').setAttribute('aria-label', audio.paused ? '播放音乐' : '暂停音乐');
  document.querySelectorAll('[data-track]').forEach(button => { button.textContent = Number(button.dataset.track) === currentTrack && !audio.paused ? '暂停这张唱片' : '放上唱片机 ▶'; });
  $('#desk-music-state').textContent = currentTrack === null ? '· 歌单待放入' : audio.paused ? '· 已暂停' : '· 正在播放';
}
audio.addEventListener('play', musicState); audio.addEventListener('pause', musicState);
audio.addEventListener('error', () => { audio.pause(); $('#music-status').textContent = '音源加载失败，点击唱片重试。'; musicState(); });
$('#music-volume').addEventListener('input', event => audio.volume = Number(event.target.value));
$('#dock-toggle').addEventListener('click', () => currentTrack !== null && playTrack(currentTrack));
$('#dock-stop').addEventListener('click', () => { audio.pause(); audio.currentTime = 0; $('#music-dock').hidden = true; });
document.addEventListener('play', event => { if (event.target.tagName === 'VIDEO') audio.pause(); }, true);
// Drafts are local; only successful API responses become public notes.
function storeDraft() {
  const form = $('#guest-form');
  try { localStorage.setItem('chen-studio-message-draft', JSON.stringify({ nickname: form.elements.nickname.value, body: form.elements.body.value, color: form.elements.color.value })); } catch { /* Storage may be unavailable in private mode. */ }
}
function updatePreview() {
  const f = $('#guest-form');
  const text = f.elements.body.value;
  $('#message-count').textContent = `${[...text].length} / 120 字`;
  $('#note-preview').style.background = noteColors[f.elements.color.value];
  $('#note-preview p').textContent = text || '你的想法会出现在这里。';
  $('#note-preview small').textContent = f.elements.nickname.value || '一位路过的朋友';
  storeDraft();
}
function openComposer() {
  const f = $('#guest-form');
  try { const d = JSON.parse(localStorage.getItem('chen-studio-message-draft')); if (d) { f.elements.nickname.value = String(d.nickname || '').slice(0, 24); f.elements.body.value = String(d.body || '').slice(0, 240); if (noteColors[d.color]) f.elements.color.value = d.color; } } catch { /* Invalid local drafts are ignored. */ }
  updatePreview();
  $('#guest-submit').disabled = !CONFIG.guestbookApi;
  $('#guest-submit-status').textContent = CONFIG.guestbookApi ? '留言会公开展示；每位访客两次提交至少间隔 60 秒。' : '公共留言暂未开放。你可以预览并保留草稿；草稿只保存在这台设备上，尚未公开。';
  $('#compose-dialog').showModal(); syncLock();
}
$('#guest-form').addEventListener('input', updatePreview);
async function guestRequest(path, options = {}) {
  if (!CONFIG.guestbookApi) throw new Error('公共留言暂未开放。');
  const response = await fetch(CONFIG.guestbookApi.replace(/\/$/, '') + path, { ...options, signal: AbortSignal.timeout(12000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || '留言服务暂时不可用，请稍后重试。');
  return data;
}
async function loadGuestbook(more = false) {
  if (guest.loading) return;
  if (!CONFIG.guestbookApi) { if (relativeRoute() === 'guestbook') toast('公共留言暂未开放，欢迎先通过邮件联系。'); return; }
  guest.loading = true; guest.error = '';
  try { const data = await guestRequest('/messages?limit=40' + (more && guest.cursor ? '&cursor=' + encodeURIComponent(guest.cursor) : '')); if (!Array.isArray(data.items)) throw new Error('留言返回格式有误。'); guest.items = more ? [...guest.items, ...data.items] : data.items; guest.cursor = data.next_cursor || null; guest.loaded = true; }
  catch (e) { guest.error = e.name === 'TimeoutError' ? '留言加载超时，请稍后刷新。' : e.message; }
  finally { guest.loading = false; renderDeskNotes(); if (relativeRoute() === 'guestbook' && panel.open) { rememberScroll(); renderRoute(); } }
}
function renderDeskNotes() {
  $('.welcome-note').hidden = guest.items.length > 0;
  $('#desk-guest-notes').innerHTML = guest.items.slice(0, 8).map(n => link('guestbook/?note=' + encodeURIComponent(n.id), esc(n.body), 'desk-mini-note')).join('');
}
$('#guest-form').addEventListener('submit', async event => {
  event.preventDefault(); const f = event.target;
  if (!CONFIG.guestbookApi || $('#guest-submit').disabled) return;
  const body = f.elements.body.value.trim();
  if ([...body].length < 1 || [...body].length > 120) { $('#guest-submit-status').textContent = '正文请填写 1—120 字。'; return; }
  $('#guest-submit').disabled = true; $('#guest-submit-status').textContent = '正在把便签贴上去…';
  try {
    const data = await guestRequest('/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: f.elements.nickname.value.trim(), body, color: f.elements.color.value }) });
    if (!data.item?.id) throw new Error('服务未确认保存成功，请稍后重试。');
    guest.newest = data.item.id; guest.items = [data.item, ...guest.items.filter(n => n.id !== data.item.id)]; guest.loaded = true;
    f.reset(); updatePreview(); try { localStorage.removeItem('chen-studio-message-draft'); } catch { /* Optional storage. */ }
    $('#compose-dialog').close(); syncLock(); renderDeskNotes(); navigate('guestbook/'); toast('便签已经贴上留言板，谢谢你。');
  } catch (e) { $('#guest-submit-status').textContent = (e.name === 'TimeoutError' ? '提交超时。' : e.message) + ' 输入已保留，可以重试。'; }
  finally { $('#guest-submit').disabled = !CONFIG.guestbookApi; }
});
$('#year').textContent = new Date().getFullYear();
history.scrollRestoration = 'manual';
history.replaceState({ ...history.state, app: history.state?.app || false, scroll: history.state?.scroll || 0 }, '', location.href);
selectFeature('dayibu');
renderRoute();
if (CONFIG.guestbookApi) loadGuestbook();

// The 3D stage enhances real navigation; content remains independent of WebGL.
window.addEventListener('studio:open', event => {
  const detail = event.detail;
  if (detail.route) navigate(detail.route);
  if (detail.action === 'music') openMusic();
  if (detail.action === 'compose') openComposer();
});
