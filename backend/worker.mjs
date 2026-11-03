const COLORS = new Set(['yellow', 'pink', 'green', 'blue']);
const UUID = /^[a-f0-9-]{36}$/;
const DEFAULT_ORIGIN = 'https://xiang799.github.io';
async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function isAdmin(request, env) {
  if (!env.ADMIN_TOKEN || !request.headers.get('Authorization')?.startsWith('Bearer ')) return false;
  const supplied = request.headers.get('Authorization').slice(7);
  const a = await hash(supplied), b = await hash(env.ADMIN_TOKEN);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = env.ALLOWED_ORIGIN || DEFAULT_ORIGIN;
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin' };
    if (origin === allowed) headers['Access-Control-Allow-Origin'] = allowed;
    const reply = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), { status, headers: { ...headers, ...extra } });
    if (origin && origin !== allowed) return reply({ error: '此来源不可提交留言。' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '3600' } });
    if (!env.DB) return reply({ error: '留言数据库尚未就绪。' }, 503);
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, '');
    const admin = pathname.startsWith('/admin/');
    if (admin && !await isAdmin(request, env)) return reply({ error: '需要站主管理权限。' }, 401);
    try {
      if (request.method === 'GET' && (pathname === '/messages' || pathname === '/admin/messages')) {
        const requested = Number(url.searchParams.get('limit') || 40);
        if (!Number.isInteger(requested) || requested < 1 || requested > 100) return reply({ error: '留言数量参数无效。' }, 400);
        const cursor = url.searchParams.get('cursor');
        let cursorWhere = '', bindings = [];
        if (cursor) {
          const [date, id] = cursor.split('|');
          if (!/^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(date) || !UUID.test(id || '')) return reply({ error: '留言游标无效。' }, 400);
          cursorWhere = ' AND (created_at < ? OR (created_at = ? AND id < ?))'; bindings = [date, date, id];
        }
        const { results } = await env.DB.prepare(`SELECT id,nickname,body,color,created_at${admin ? ',hidden' : ''} FROM messages WHERE ${admin ? '1=1' : 'hidden=0'}${cursorWhere} ORDER BY created_at DESC,id DESC LIMIT ?`).bind(...bindings, requested + 1).all();
        const items = results.slice(0, requested);
        return reply({ items, next_cursor: results.length > requested ? items.at(-1).created_at + '|' + items.at(-1).id : null });
      }
      if (request.method === 'POST' && pathname === '/messages') {
        if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ error: '请使用 JSON 提交。' }, 415);
        const raw = await request.text();
        if (new TextEncoder().encode(raw).length > 4096) return reply({ error: '留言内容过长。' }, 413);
        let data;
        try { data = JSON.parse(raw); } catch { return reply({ error: '留言格式无效。' }, 400); }
        if (!data || typeof data !== 'object' || Array.isArray(data)) return reply({ error: '留言格式无效。' }, 400);
        const body = typeof data.body === 'string' ? data.body.trim() : '';
        const nickname = typeof data.nickname === 'string' ? data.nickname.trim() : '';
        if ([...body].length < 1 || [...body].length > 120 || [...nickname].length > 24 || !COLORS.has(data.color)) return reply({ error: '正文须为 1—120 字，昵称最多 24 字，请选择有效便签颜色。' }, 400);
        const ip = request.headers.get('CF-Connecting-IP');
        if (!ip || !env.RATE_LIMIT_SALT) return reply({ error: '留言限流服务尚未就绪。' }, 503);
        const clientHash = await hash(ip + ':' + env.RATE_LIMIT_SALT);
        const now = Date.now();
        // A single atomic write reserves the cooldown, including concurrent requests.
        const reserved = await env.DB.prepare('INSERT INTO rate_limits(client_hash,next_allowed) VALUES(?,?) ON CONFLICT(client_hash) DO UPDATE SET next_allowed=excluded.next_allowed WHERE rate_limits.next_allowed<=? RETURNING client_hash').bind(clientHash, now + 60000, now).first();
        if (!reserved) return reply({ error: '写得有点快，请稍等 60 秒再贴下一张便签。' }, 429, { 'Retry-After': '60' });
        const item = { id: crypto.randomUUID(), nickname, body, color: data.color, created_at: new Date(now).toISOString() };
        await env.DB.prepare('INSERT INTO messages(id,nickname,body,color,created_at) VALUES(?,?,?,?,?)').bind(item.id, item.nickname, item.body, item.color, item.created_at).run();
        await env.DB.prepare('DELETE FROM rate_limits WHERE next_allowed < ?').bind(now - 86400000).run();
        return reply({ item }, 201);
      }
      const match = /^\/admin\/messages\/([a-f0-9-]{36})$/.exec(pathname);
      if (admin && match && request.method === 'PATCH') {
        let data;
        try { data = await request.json(); } catch { return reply({ error: '管理操作格式无效。' }, 400); }
        if (typeof data?.hidden !== 'boolean') return reply({ error: '请指定 hidden 布尔值。' }, 400);
        const row = await env.DB.prepare('UPDATE messages SET hidden=? WHERE id=? RETURNING id,hidden').bind(data.hidden ? 1 : 0, match[1]).first();
        return row ? reply({ item: row }) : reply({ error: '便签不存在。' }, 404);
      }
      if (admin && match && request.method === 'DELETE') {
        const row = await env.DB.prepare('DELETE FROM messages WHERE id=? RETURNING id').bind(match[1]).first();
        return row ? reply({ deleted: row.id }) : reply({ error: '便签不存在。' }, 404);
      }
      return reply({ error: '找不到该留言操作。' }, 404);
    } catch {
      // Do not expose database errors, request details or secrets to public clients.
      return reply({ error: '留言暂时没有保存成功，请稍后重试。' }, 503);
    }
  }
};
