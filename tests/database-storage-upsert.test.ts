/**
 * Smoke test: saveSession inserts FK placeholder rows; createInstructor/createLearner
 * must upsert so registration can replace stubs (SQLite ON CONFLICT).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type Database from 'better-sqlite3';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

function sqliteHandle(adapter: DatabaseStorageAdapter): Database.Database {
  return (adapter as unknown as { db: Database.Database }).db;
}

test('createInstructor upserts over placeholder row from saveSession', async () => {
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

  await db.saveSession({
    id: 'sess_test',
    instructorId: 'inst_real',
    learnerId: 'learn_real',
    instructorProfileId: 'inst_real',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  await db.createInstructor({
    id: 'inst_real',
    name: 'Professor Chen',
    bio: 'Bio',
    tone: 'calm',
  });

  const profile = await db.loadInstructorProfile('inst_real');
  assert.ok(profile);
  assert.equal(profile!.name, 'Professor Chen');
});

test('createLearner upserts over placeholder row from saveSession', async () => {
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

  await db.saveSession({
    id: 'sess_test2',
    instructorId: 'inst_x',
    learnerId: 'learn_real',
    instructorProfileId: 'inst_x',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  await db.createLearner({
    id: 'learn_real',
    name: 'Sam Student',
    level: 'intermediate',
  });

  const row = sqliteHandle(db)
    .prepare('SELECT name, level FROM learners WHERE id = ?')
    .get('learn_real') as { name: string; level: string };

  assert.equal(row.name, 'Sam Student');
  assert.equal(row.level, 'intermediate');
});

test('saveSession succeeds when session_messages already reference the session (no REPLACE delete)', async () => {
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const sqlite = sqliteHandle(db);

  await db.saveSession({
    id: 'sess_with_msgs',
    instructorId: 'inst_y',
    learnerId: 'learn_y',
    instructorProfileId: 'inst_y',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  // Simulate message exchange: rows exist that FK-reference this session.
  sqlite
    .prepare(
      `INSERT INTO messages (id, session_id, sender, role, content, message_type, teaching_metadata, created_at)
       VALUES (?, ?, 'ai', 'instructor', 'hello', 'question', NULL, ?)`
    )
    .run('msg_one', 'sess_with_msgs', new Date().toISOString());
  sqlite
    .prepare(
      'INSERT INTO session_messages (session_id, message_id, sequence_order) VALUES (?, ?, ?)'
    )
    .run('sess_with_msgs', 'msg_one', 0);

  const later = new Date();
  await db.saveSession({
    id: 'sess_with_msgs',
    instructorId: 'inst_y',
    learnerId: 'learn_y',
    instructorProfileId: 'inst_y',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: ['msg_one'],
    startedAt: new Date(),
    lastActivityAt: later,
    endedAt: null,
  });

  const loaded = await db.loadSession('sess_with_msgs');
  assert.ok(loaded);
  assert.deepEqual(loaded!.messageIds, ['msg_one']);
});
