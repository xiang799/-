import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../backend/worker.mjs';
// Exercise the Worker handler against real SQLite, without mocking SQL results.
function setup() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../backend/schema.sql', import.meta.url), 'utf8'));
  const DB = { prepare(sql) { return { bind(...args) { return { async all() { return { results: db.prepare(sql).all(...args) }; }, async first() { return db.prepare(sql).get(...args) || null; }, async run() { db.prepare(sql).run(...args); return { success: true }; } }; } }; } };
  return { env: { DB, ADMIN_TOKEN: 'test-admin-only', RATE_LIMIT_SALT: 'test-salt-only', ALLOWED_ORIGIN: 'https://xiang799.github.io' }, cleanup: () => db.close() };
}
function request(env, path, method = 'GET', data, { ip = '192.0.2.1', admin = false, origin = 'https://xiang799.github.io' } = {}) {
  const headers = { Origin: origin, 'CF-Connecting-IP': ip };
  if (data !== undefined) headers['Content-Type'] = 'application/json';
  if (admin) headers.Authorization = 'Bearer ' + env.ADMIN_TOKEN;
  return worker.fetch(new Request('https://guestbook.example' + path, { method, headers, body: data === undefined ? undefined : JSON.stringify(data) }), env);
}
test('shared messages persist across visitors, paginate, and moderate', async () => {
  const { env, cleanup } = setup();
  try {
    const first = await request(env, '/messages', 'POST', { nickname: '<img>', body: '你好，工作台！', color: 'green' });
    assert.equal(first.status, 201); const { item } = await first.json();
    const second = await request(env, '/messages', 'POST', { nickname: '', body: '另一位访客', color: 'pink' }, { ip: '192.0.2.2' });
    assert.equal(second.status, 201);
    let list = await (await request(env, '/messages?limit=1')).json();
    assert.equal(list.items.length, 1); assert.ok(list.next_cursor);
    const older = await (await request(env, '/messages?limit=1&cursor=' + encodeURIComponent(list.next_cursor))).json();
    assert.equal(older.items.length, 1); assert.notEqual(older.items[0].id, list.items[0].id);
    assert.equal((await request(env, '/admin/messages/' + item.id, 'PATCH', { hidden: true })).status, 401);
    assert.equal((await request(env, '/admin/messages/' + item.id, 'PATCH', { hidden: true }, { admin: true })).status, 200);
    list = await (await request(env, '/messages')).json();
    assert.equal(list.items.length, 1); assert.ok(list.items.every(x => x.id !== item.id));
    const all = await (await request(env, '/admin/messages', 'GET', undefined, { admin: true })).json();
    assert.equal(all.items.length, 2);
    assert.equal((await request(env, '/admin/messages/' + item.id, 'DELETE', undefined, { admin: true })).status, 200);
    assert.equal((await request(env, '/admin/messages/' + item.id, 'DELETE', undefined, { admin: true })).status, 404);
  } finally { cleanup(); }
});
test('Unicode limits, invalid input, CORS, cooldown, and concurrent posts', async () => {
  const { env, cleanup } = setup();
  try {
    for (const body of ['', 'a'.repeat(121), '😀'.repeat(121)]) assert.equal((await request(env, '/messages', 'POST', { body, color: 'yellow' })).status, 400);
    assert.equal((await request(env, '/messages', 'POST', { body: 'hello', nickname: 'a'.repeat(25), color: 'yellow' })).status, 400);
    assert.equal((await request(env, '/messages', 'POST', { body: 'hello', color: 'evil' })).status, 400);
    assert.equal((await request(env, '/messages', 'POST', { body: 'hello', color: 'yellow' }, { origin: 'https://untrusted.example' })).status, 403);
    const accepted = await request(env, '/messages', 'POST', { body: '😀'.repeat(120), color: 'yellow' });
    assert.equal(accepted.status, 201);
    assert.equal((await request(env, '/messages', 'POST', { body: 'again', color: 'yellow' })).status, 429);
    const results = await Promise.all([1,2].map(() => request(env, '/messages', 'POST', { body: 'racing', color: 'blue' }, { ip: '192.0.2.3' })));
    assert.deepEqual(results.map(r => r.status).sort(), [201,429]);
    assert.equal((await request(env, '/messages?limit=1000')).status, 400);
    assert.equal((await request(env, '/messages?cursor=bad')).status, 400);
    const cors = await request(env, '/messages', 'OPTIONS');
    assert.equal(cors.status, 204); assert.equal(cors.headers.get('Access-Control-Allow-Origin'), 'https://xiang799.github.io');
  } finally { cleanup(); }
});
