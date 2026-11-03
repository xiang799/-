CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 120),
  color TEXT NOT NULL CHECK(color IN ('yellow','pink','green','blue')),
  created_at TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0 CHECK(hidden IN (0,1))
);
CREATE INDEX IF NOT EXISTS messages_public_time ON messages(hidden,created_at DESC,id DESC);
CREATE TABLE IF NOT EXISTS rate_limits (
  client_hash TEXT PRIMARY KEY,
  next_allowed INTEGER NOT NULL
);
