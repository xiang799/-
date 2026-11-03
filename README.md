# 陈湘的设计师工作台

以 Three.js 三维小房间和可探索的木质工作台呈现个人作品集。保留顶部作品、个人介绍、简历与联系入口。原生 HTML / CSS / JavaScript，无前端包管理器或构建依赖。

## 运行与维护

```sh
cd /workspace/-
python3 -m http.server 8000 --bind 127.0.0.1
```

首次运行无需安装或构建。修改模板或项目数据后执行：

```sh
python3 tools/build_site.py
node --check script.js
node tests/guestbook.test.mjs
```

- `templates/workbench.html`：首页物件与通用面板骨架。
- `styles.css`：桌面物件、纸张与响应式排布。
- `script.js`：路由、内容面板、图片历史、音乐和留言界面。
- `studio.js`：Three.js 建模、实际作品纹理、射线点击、物件动作、视差、昼夜与渲染生命周期。
- `vendor/three/`：官方 Three.js 0.180.0 ES 模块，校验 SHA-512 后自托管，保留 MIT 许可证。
- `content/projects.json`：15 个项目的唯一资料来源。生成器同步 `projects.js`。
- `content/site-config.js`：公开的音乐及留言 API 地址；禁止写管理密钥。
- `assets/`：用户 PDF 中提取的真实作品、原稿、证件照及简历。
- `backend/`：可独立部署的共享留言 Worker + D1、schema 和本机 SQLite 适配器。
- `docs/CONTENT_STATUS.md`：现有材料、待补充项目、音乐与留言部署状态。

## 页面与交互

工作台 `/`、作品目录 `/work/`、项目 `/work/:slug/`、过程 `/process/`、CMF `/cmf/`、个人介绍 `/about/`、联系 `/contact/`、留言墙 `/guestbook/`。

GitHub Pages 部署在仓库子路径 `/-/`，因此正式地址为 `https://xiang799.github.io/-/work/` 等。每个地址都生成真实 `index.html`，硬刷新、收藏和分享不依赖服务端路由回退。所有入口自动使用站点 base。旧的 `projects/*.html` 链接跳转至同一份新项目详情。

内容一次打开一个原生 dialog 面板。分类、项目和图片预览都有浏览器历史记录；返回时恢复原分类和滚动位置。图片在第二层 dialog 阅读，关闭返回案例。对减少动态效果的系统设置关闭非必要动画。

作品共 15 个项目条目：6 个完整案例，5 个图集，4 个研究条目。新增项目中 3 个尚无图文材料，明确标注待补充。没有把概念设计描述为实物验证，也没有虚构本人职责或项目年份。见 [作品目录](WORKS.md)。

## 音乐

默认歌单为空；音乐角显示待配置。将已确认的公开可播放音源及可用封面加入配置：

```js
window.SITE_CONFIG = {
  guestbookApi: "",
  music: [{ title: "已确认曲名", artist: "音乐人", src: "assets/music/已提供音频.mp3", cover: "assets/music/已提供封面.jpg" }]
};
```

只在访客操作后播放。面板切换不会重新创建 audio；播放、暂停与音量独立于阅读内容，项目视频播放会暂停背景音乐。刷新后不自动恢复。音源失败显示重试提示，不影响作品。

## 公共留言

公共留言需独立服务，不能由 GitHub Pages 或 localStorage 提供。默认 API 为空，允许写草稿和预览，但公开提交不可用，明确提示尚未公开。欢迎便签来自站主，不冒充访客留言。

[后端接入说明](backend/README.md) 包含数据库、IP 哈希限流、隐藏和删除管理接口。本地 SQLite 与两浏览器共享数据测试不等于线上后端已部署。启用正式服务需要站主的服务配置。

## 部署

当前仓库 `main` 由 GitHub Pages 从根目录直接发布，`.nojekyll` 保留静态路径。维护时保留所有路由目录、`assets/`、`content/`、CSS 和 JS。不要把管理密钥或本机数据库提交到 Git。

## 三维工作台

桌面、窗框、书架、电脑、唱片机、速写本、色卡、信封、打字机与植物均使用真实网格建模。13 件交互物体通过射线命中进入同一套内容路由；HTML 物件标签为键盘和触屏提供等价入口。电脑纹理来自实际项目封面，速写本使用用户 PDF 中的草图页。

鼠标只产生轻微视差，不提供自由旋转。点击时播放约 320ms 的物件动作和短距离聚焦；阅读期间镜头停止。关闭后回到工作台。支持减少动态效果、昼夜切换、离屏及后台停止连续渲染。WebGL 不可用或上下文丢失时恢复可操作的二维工作台，作品目录与联系入口始终可用。

生成器对前端资源计算内容版本，避免部署后浏览器把旧的二维脚本或样式与新场景混用。三维引擎及素材均同站托管，不需要外部 CDN。

有 Playwright 与 Chromium 的环境可执行 `python3 tests/three_studio_browser.py`。测试使用本机网站服务器，检查 13 个真实模型点击、视差、阅读镜头冻结、键盘、触屏、昼夜、四个作品纹理、减少动态效果与 WebGL 丢失回退。
