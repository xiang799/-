# 公共留言服务

前端可在 GitHub Pages 独立运行；跨访客共享的留言使用 Cloudflare Worker + D1。没有后端时只编辑本机草稿，不展示伪造访客留言，也不把本机草稿算作已公开提交。

## 已具备

- `GET /messages?limit=40&cursor=…`：按时间倒序的公开留言，返回 `items` 与 `next_cursor`。
- `POST /messages`：昵称最多 24 字（选填）、正文 1–120 个 Unicode 字符、四种便签色。
- 同一来源 IP 每 60 秒最多提交一次，数据库原子抢占冷却位；只存盐化哈希，不存 IP 原文。
- `GET /admin/messages`：站主查看包含隐藏项的留言。
- `PATCH /admin/messages/:id`，JSON `{"hidden":true}`：隐藏／取消隐藏。
- `DELETE /admin/messages/:id`：删除。
- 管理请求要求 `Authorization: Bearer <ADMIN_TOKEN>`。该凭据只放服务端，不能写入网站配置或 Git。
- 留言作为文本显示；前端统一转义，不能注入 HTML。

## 部署准备

需要站主的 Cloudflare 账号。当前未配置账号或服务，未进行公网后端部署。

在有 Cloudflare 授权的终端中，从本目录操作（Node.js 22+）：

```sh
npx wrangler@4 login
npx wrangler@4 d1 create chen-xiang-guestbook
```

把创建结果中的 database ID 填入 `wrangler.jsonc` 的 `database_id`。此 ID 是资源选择信息，不是凭据。保留 `binding` 为 `DB`。

```sh
npx wrangler@4 d1 execute chen-xiang-guestbook --remote --file=schema.sql
npx wrangler@4 secret put ADMIN_TOKEN
npx wrangler@4 secret put RATE_LIMIT_SALT
npx wrangler@4 deploy
```

两个 secret 使用自行生成的随机值，通过命令的安全输入保存。不要把值粘贴到聊天、仓库、日志或前端。`RATE_LIMIT_SALT` 部署后保持稳定。`ALLOWED_ORIGIN` 默认为 `https://xiang799.github.io`；换域名时同步修改。

部署后将 Worker 的真实 HTTPS 根地址填入 `content/site-config.js` 的 `guestbookApi`。例如配置结构为：

```js
window.SITE_CONFIG = { guestbookApi: "<实际部署的 Worker HTTPS 地址>", music: [] };
```

用两个独立浏览器提交和查看同一条留言；确认隐藏／删除立即从公开列表消失，并验证冷却错误会保留前端输入。不要只验证开端口或本机 localStorage。

## 测试

从仓库根目录执行：

```sh
node tests/guestbook.test.mjs
```

使用 Node.js 24 的真实 SQLite 测试持久共享数据、翻页、管理权限、隐藏、删除、Unicode 长度、跨域限制、频率限制和并发提交。

## 管理

站主可在受信任的 API 客户端中使用上述管理接口，或在 Cloudflare D1 控制台管理数据。当前没有把管理员登录或管理密钥暴露给访客。公共留言服务尚未部署时，前端提交按钮保持不可用，并明确提示草稿未公开。
