# 陈湘的设计师工作台

以可探索的木质工作台呈现个人作品集。保留顶部作品、个人介绍、简历与联系入口。原生 HTML / CSS / JavaScript，无前端包管理器或构建依赖。

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
