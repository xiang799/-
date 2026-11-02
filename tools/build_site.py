"""Regenerate static HTML and the work inventory with Python's standard library."""
from pathlib import Path
import json
from html import escape as e

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = json.loads((ROOT / 'content/projects.json').read_text())

def header(prefix=''):
    home = prefix + 'index.html' if prefix else ''
    return f'''<a class="skip-link" href="#main">跳至正文</a><header class="site-header">
<a class="site-name" href="{home}#home">CHEN XIANG <span>陈湘</span></a>
<button class="menu-toggle" aria-controls="navigation" aria-expanded="false">菜单 <span>＋</span></button>
<nav id="navigation" aria-label="主导航"><a class="nav-link" href="{home}#home" data-view="home">主页 <span>| Home</span></a><a class="nav-link" href="{home}#work" data-view="work">作品 <span>| Works</span></a><a class="nav-link" href="{home}#about" data-view="about">简历 <span>| Resume</span></a></nav></header>'''

def footer(prefix=''):
    return f'''<footer><a class="footer-logo" href="{prefix + 'index.html' if prefix else '#'}">CX.</a><span>© <span id="year">2026</span> CHEN XIANG · 陈湘</span><a href="#">回到顶部 ↑</a></footer>'''

def document(title, description, content, prefix=''):
    return f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="{e(description,quote=True)}"><meta name="theme-color" content="#111110"><title>{e(title)}</title><link rel="stylesheet" href="{prefix}styles.css"><script src="{prefix}script.js" defer></script></head><body>{header(prefix)}{content}{footer(prefix)}</body></html>\n'''

def card(p, i):
    featured = ' project-featured' if i == 0 else ''
    cover = 'yaozhi-preview.webp' if p['id'] == 'yaozhi' else p['cover']
    return f'''<article class="project{featured}" data-category="{p['category']}"><a class="project-open" href="projects/{p['id']}.html" aria-label="查看{e(p['title'])}项目详情">
<div class="project-art cover-{p['id']}"><img src="assets/{cover}" alt="{e(p['title'])}设计预览" loading="lazy" decoding="async"><span class="project-arrow" aria-hidden="true">↗</span></div>
<div class="project-info"><p class="project-kicker">{e(p['type'])} · {e(p['en'])}</p><h3>{e(p['title'])}</h3><p class="project-description">{e(p['subtitle'])}</p><span class="work-more">查看项目详情 →</span></div></a></article>'''

home = '''<main id="main"><section id="home" class="hero home-section" aria-labelledby="hero-title">
<img class="hero-background" src="assets/hero-interior.webp" alt="" fetchpriority="high" decoding="async"><div class="hero-shade"></div>
<div class="hero-content"><p class="hero-overline">DESIGN PORTFOLIO</p><h1 id="hero-title">陈湘 <span>| Chen Xiang</span></h1><p class="hero-disciplines">产品设计 · 交互体验 · AIGC 探索</p><p class="hero-english" lang="en">Product Design · User Experience · Creative Exploration</p><a class="scroll-down" href="#about">↓ <span>Scroll Down</span></a></div>
<a class="hero-credit" href="projects/city-voyager.html">CITY VOYAGER / 个人作品 · 车厢内部设计 ↗</a></section>
<section id="about" class="content-section about-section" aria-labelledby="about-title"><h2 class="content-title" id="about-title">个人介绍 <span>| About</span></h2>
<div class="about-layout"><aside class="about-sidebar"><img class="about-avatar" src="assets/chen-xiang.jpg" alt="陈湘的个人证件照" width="1275" height="1693" loading="lazy"><h3>陈湘 <span>| Chen Xiang</span></h3><p class="about-role">中南大学 · 设计学硕士在读<br>产品设计本科 · 2028 届</p><a class="contact-email" href="mailto:3273802897@qq.com">3273802897@qq.com</a><a class="resume-download" href="assets/chen-xiang-resume.pdf" download="陈湘_产品实习简历.pdf">↓ 下载简历 <span>PDF</span></a></aside>
<div class="about-main"><p class="about-bio">我是陈湘，现为中南大学设计学硕士研究生，本科就读产品设计。关注用户研究、产品体验与设计落地，也在探索 AIGC 如何支持创作和产品设计。</p><p class="about-bio about-secondary">从用户访谈、需求拆解到原型设计、三维建模与生产资料交付，我希望把对人的观察，转化为清晰、可沟通的方案。在产品研发与 AIGC 相关实习中，我也积累了跨部门沟通与方案推进的经验。</p>
<div class="about-block"><h3>关注方向 <span>| Interests</span></h3><div class="about-tags"><span>用户研究</span><span>产品设计</span><span>交互体验</span><span>AIGC</span></div></div>
<div class="about-block"><h3>学习经历 <span>| Education</span></h3><ul class="education-list"><li><span>2025 — 预计 2028</span><p><strong>中南大学</strong> · 设计学硕士在读</p></li><li><span>2021 — 2025</span><p><strong>中南大学</strong> · 产品设计本科</p></li></ul></div>
<details class="resume-details"><summary>实习、项目经历与专业技能 <span>＋</span></summary>'''
home += '<div class="background-grid"><section class="background-block"><h3>教育背景 <span>EDUCATION</span></h3><div class="timeline-item"><time>2025.09 — 预计 2028</time><h4>中南大学 · 设计学硕士</h4><p>985 / 211 · 在读</p></div><div class="timeline-item"><time>2021.09 — 2025.06</time><h4>中南大学 · 产品设计本科</h4></div></section>\n<section class="background-block"><h3>实习经历 <span>EXPERIENCE</span></h3><div class="timeline-item"><time>2026.06 — 2026.10</time><h4>上海亦玩游乐设备有限公司</h4><p class="role-label">产品研发</p><p>梳理儿童红绿灯的按钮、灯光与语音规则；完成建模渲染和生产资料交付，对接厂家及跨部门协作，项目进入外包生产阶段。</p></div><div class="timeline-item"><time>2024.09 — 2024.12</time><h4>湖南极友科技有限公司</h4><p class="role-label">AIGC 岗产品助理</p><p>制作官网高保真原型与交互说明，对接软件部完成改版上线；参与 AIGC 脚本、分镜、视频与海报创作。</p></div></section>\n<section class="background-block"><h3>研究与实践 <span>RESEARCH & PRACTICE</span></h3><div class="timeline-item"><time>2025.09 — 2025.11</time><h4>苏泊尔校企合作 · 吸尘器前期研究</h4><p>主要承担行业背景与品牌竞品研究，参与报告和设计策略讨论，为后续设计提供参考。</p></div><div class="timeline-item"><time>2025</time><h4>孟极 AIGC 产品设计工作流 · 项目组长</h4><p>整理约 200 张 CT 设备图片，设置参数并训练 LoRA 模型；经项目负责人审核后，由公司发布至 Liblib 平台。</p></div></section>\n<section class="background-block"><h3>工具与荣誉 <span>TOOLS & RECOGNITION</span></h3><p>Figma / Axure / 墨刀<br>Rhino / KeyShot / Photoshop / Illustrator<br>Office / LoRA 训练</p><ul class="honor-list"><li>第 19 届“好创意”生成式人工智能计时赛 · 国家二等奖</li><li>湖南省大学生工业设计竞赛 · 省级一等奖、二等奖</li><li>BICC 中英国际设计大赛 · 银奖、铜奖</li><li>研究生学业奖学金一等奖 · 中南大学优秀学生</li></ul></section></div>'
home += '''</details></div></div></section>
<section id="work" class="content-section work-section" aria-labelledby="work-title"><div class="works-heading"><h2 class="content-title" id="work-title">作品 <span>| Works</span></h2><span class="works-count">11 SELECTED PROJECTS</span></div>
<div class="filters" role="group" aria-label="按作品类别筛选"><button class="filter active" data-filter="all" aria-pressed="true">全部 <sup>11</sup></button><button class="filter" data-filter="experience" aria-pressed="false">交互与服务 <sup>03</sup></button><button class="filter" data-filter="product" aria-pressed="false">工业设计 <sup>06</sup></button><button class="filter" data-filter="visual" aria-pressed="false">视觉与展陈 <sup>02</sup></button></div><p id="filter-status" class="sr-only" aria-live="polite">显示全部 11 个项目</p><div class="project-grid">'''
home += '\n'.join(card(p,i) for i,p in enumerate(PROJECTS))
home += '''</div><div class="work-footnote"><span>产品 · 体验 · 生活中的设计探索</span><a href="WORKS.md">完整作品目录 ↗</a></div></section>
<section id="contact" class="contact-section"><p>LET’S GET IN TOUCH</p><h2>期待下一次交流。</h2><a href="mailto:3273802897@qq.com">3273802897@qq.com ↗</a></section></main>
<dialog id="project-dialog" aria-labelledby="project-modal-title"><div class="modal-toolbar"><p id="project-modal-title">项目详情</p><div><a class="modal-page-link" target="_blank" rel="noopener">独立页面 ↗</a><button class="dialog-close" aria-label="关闭项目详情">关闭 <span aria-hidden="true">×</span></button></div></div><div id="project-dialog-body"></div></dialog>'''

(ROOT/'index.html').write_text(document('陈湘 CHEN XIANG — 设计作品集','陈湘的个人设计作品集：产品设计、交互体验、服务设计与 AIGC 探索。中南大学设计学硕士在读。',home))

out=ROOT/'projects';out.mkdir(exist_ok=True)
for i,p in enumerate(PROJECTS):
    prev=PROJECTS[(i-1)%len(PROJECTS)]; nex=PROJECTS[(i+1)%len(PROJECTS)]
    sections=''.join(f'<section><span class="tiny-label">0{j+1}</span><h2>{e(title)}</h2><p>{e(text)}</p></section>' for j,(title,text) in enumerate(p['sections']))
    gallery=''.join(f'''<figure id="board-{j+1}"><a href="../assets/{filename}" target="_blank" rel="noopener" aria-label="新标签页查看原尺寸：{e(caption)}"><img src="../assets/{filename}" alt="{e(p['title'])} — {e(caption)}" loading="lazy" decoding="async"></a><figcaption><span>{j+1:02} / {e(caption)}</span><a href="../assets/{filename}" target="_blank" rel="noopener">查看大图 ↗<span class="sr-only">（新标签页）</span></a></figcaption></figure>''' for j,(filename,caption) in enumerate(p['gallery']))
    role=f'<div class="case-role"><span class="tiny-label">MY CONTRIBUTION / 个人参与</span><p>{e(p["role"])}</p></div>' if p['id']=='yaozhi' else ''
    credit = '本页展示团队概念方案；个人参与部分见上方说明。' if p['id']=='yaozhi' else '以下为作品集中记录的设计方案与过程。'
    content=f'''<main id="main" class="case-main"><a class="case-back" href="../index.html#work">← 返回全部作品</a><section class="case-hero"><div class="eyebrow">PROJECT {i+1:02} / {e(p['en'])}</div><h1>{e(p['title'])}</h1><p class="case-subtitle">{e(p['subtitle'])}</p><div class="case-meta"><span>{e(p['type'])}</span><span>{e(p['stage'])}</span><a href="#gallery">浏览项目展板 ↓</a></div><img class="case-cover cover-{p['id']}" src="../assets/{p['cover']}" alt="{e(p['title'])}项目主视觉" style="object-position:{p.get('coverPosition','center')}">{role}</section><div class="case-story">{sections}</div><section id="gallery" class="case-gallery" aria-labelledby="gallery-title"><div class="section-heading"><h2 id="gallery-title"><span class="section-index">PROCESS /</span> 设计过程与展板</h2><span class="section-note">CLICK TO VIEW FULL SIZE</span></div><p class="gallery-note">{credit}图片可点击放大查看，保留原稿内容与水印。</p>{gallery}</section><p class="source-note">内容来源：{e(p['source'])}。未明确的项目时间、个人分工及落地结果未作推断。</p><nav class="project-pagination" aria-label="作品翻页"><a href="{prev['id']}.html"><span>← PREVIOUS PROJECT</span>{e(prev['title'])}</a><a href="{nex['id']}.html"><span>NEXT PROJECT →</span>{e(nex['title'])}</a></nav></main>'''
    (out/f"{p['id']}.html").write_text(document(p['title']+' — 陈湘作品集',p['subtitle'],content,'../'))

inventory=['# 陈湘 · 作品目录\n','共 11 件独立作品。按项目整理；同一项目的多页材料合并，包含多个项目的展板拆分。概念方案与已落地经历分开描述。\n','| 序号 | 作品 | 类别 | 原始来源 |\n| --- | --- | --- | --- |']
for i,p in enumerate(PROJECTS):inventory.append(f'| {i+1:02} | [{p["title"]}](projects/{p["id"]}.html) | {p["type"]} | {p["source"]} |')
for i,p in enumerate(PROJECTS):
    inventory += [f'\n## {i+1:02} · {p["title"]}\n',p['subtitle']+'\n',f'- 项目性质：{p["stage"]}',f'- 参与说明：{p["role"]}',f'- 材料来源：{p["source"]}']
    inventory += [f'\n**{title}**\n\n{text}' for title,text in p['sections']]
inventory += ['\n## 简历中的其他实践\n','以下经历由简历提供，未附独立视觉材料，整理在首页个人介绍中，未生成虚构作品图或项目成果：\n','- 上海亦玩游乐设备有限公司：产品研发（2026.06—2026.10）。','- 湖南极友科技有限公司：AIGC 岗产品助理（2024.09—2024.12）。','- 苏泊尔校企合作：吸尘器前期研究（2025.09—2025.11）。','- 孟极：AIGC 产品设计工作流训练项目，项目组长（2025）。','\n## 提取与核对说明\n','- 30 页作品集以图片为主，作品信息通过逐页视觉核对整理；项目页使用 PDF 实际页码（从 1 开始），不是版面印刷页码。','- 7 页展板的可提取文字主要是重复水印，正文通过视觉核对整理。','- Dayibu 第 1—2 页为同一项目，合并展示两组应用界面；左侧产品内容未重复陈列。','- 展板第 5 页拆成灯具、座椅、护理床三个独立项目；第 6 页三栏属于同一季载项目。','- 药止的团队项目属性与个人参与部分以最新简历为准。未将全部团队设计归为个人独立完成。','- 简历与旧作品集的个人信息存在时间差异，个人介绍采用最新简历；未给单件作品添加未经材料确认的年份或奖项。','- 证件照直接提取自提供的简历（与聊天所附照片一致），未生成或重绘。','- 联系区展示简历邮箱；完整简历提供下载，内含原始联系方式。']
(ROOT/'WORKS.md').write_text('\n'.join(inventory)+'\n')
print(f'Generated homepage, {len(PROJECTS)} case pages, and WORKS.md')
