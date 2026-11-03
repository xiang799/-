// Local-only adapter for testing the same Worker against a persistent SQLite DB.
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from './worker.mjs';
const db = new DatabaseSync(process.env.GUESTBOOK_DB_PATH || '/tmp/chen-xiang-guestbook.sqlite');
db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
const DB = { prepare(sql) { return { bind(...args) { return { async all() { return { results: db.prepare(sql).all(...args) }; }, async first() { return db.prepare(sql).get(...args) || null; }, async run() { db.prepare(sql).run(...args); return { success: true }; } }; } }; } };
const env = { DB, ADMIN_TOKEN: process.env.GUESTBOOK_ADMIN_TOKEN || crypto.randomUUID(), RATE_LIMIT_SALT: 'local-development-only', ALLOWED_ORIGIN: process.env.GUESTBOOK_ALLOWED_ORIGIN || 'http://127.0.0.1:8000' };
const server = http.createServer(async (req, res) => {
  try {
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 16384) { res.writeHead(413); res.end(); return; } chunks.push(chunk); }
    const headers = new Headers(req.headers);
    headers.set('CF-Connecting-IP', req.socket.remoteAddress);
    const request = new Request('http://127.0.0.1:8787' + req.url, { method: req.method, headers, body: ['GET','HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const response = await worker.fetch(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end('{"error":"Local test server error"}'); }
});
server.listen(8787, '127.0.0.1', () => console.log('Local guestbook test adapter listening on 127.0.0.1:8787'));
