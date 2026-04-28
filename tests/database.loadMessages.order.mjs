/**
 * Ensures message history order follows session order, not created_at.
 * When two messages share the same timestamp, ORDER BY created_at is undefined.
 */
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';

const db = new Database(':memory:');
db.exec(`
  CREATE TABLE messages (id TEXT PRIMARY KEY, session_id TEXT, sender TEXT, role TEXT,
    content TEXT NOT NULL, message_type TEXT, teaching_metadata TEXT, created_at TEXT);
`);
// Same timestamp — would make ORDER BY created_at non-deterministic
const t = '2020-01-01T00:00:00.000Z';
db.prepare(
  'INSERT INTO messages (id, session_id, sender, role, content, message_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
).run('m1', 's1', 'learner', 'learner', 'first', 'question', t);
db.prepare(
  'INSERT INTO messages (id, session_id, sender, role, content, message_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
).run('m2', 's1', 'instructor', 'instructor', 'second', 'guidance', t);

const messageIds = ['m2', 'm1'];
const placeholders = messageIds.map(() => '?').join(',');
const orderByCase = messageIds.map((_, i) => `WHEN ? THEN ${i}`).join(' ');
const sql = `SELECT id, content FROM messages WHERE id IN (${placeholders}) ORDER BY CASE id ${orderByCase} END`;
const rows = db.prepare(sql).all(...messageIds, ...messageIds);

assert.deepEqual(
  rows.map((r) => r.id),
  ['m2', 'm1'],
  'rows must follow messageIds[] order'
);
console.log('database loadMessages order: ok');
db.close();
