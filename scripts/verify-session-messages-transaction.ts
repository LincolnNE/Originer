/**
 * Verifies session_messages junction updates are atomic: a failed insert
 * must not leave the table empty after replacing links.
 */
import assert from 'assert';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

async function main() {
  const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const db = (adapter as unknown as { db: import('better-sqlite3').Database }).db;

  await adapter.createInstructor({ id: 'inst_1', name: 'T' });
  await adapter.createLearner({ id: 'learn_1', name: 'L' });

  const session = {
    id: 'sess_1',
    instructorId: 'inst_1',
    learnerId: 'learn_1',
    instructorProfileId: 'inst_1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active' as const,
    messageIds: [] as string[],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };

  await adapter.saveSession(session);

  db.prepare(
    `INSERT INTO messages (id, session_id, sender, role, content, message_type, teaching_metadata, created_at)
     VALUES (?, ?, 'learner', 'learner', 'x', 'question', NULL, ?)`
  ).run('msg_ok', 'sess_1', new Date().toISOString());

  await adapter.updateSession('sess_1', { messageIds: ['msg_ok'] });

  const countLinks = () =>
    (db.prepare('SELECT COUNT(*) AS c FROM session_messages WHERE session_id = ?').get('sess_1') as { c: number }).c;

  assert.strictEqual(countLinks(), 1, 'initial link count');

  let threw = false;
  try {
    await adapter.updateSession('sess_1', { messageIds: ['msg_ok', 'msg_missing_fk'] });
  } catch {
    threw = true;
  }

  assert.strictEqual(threw, true, 'update with bad FK should throw');
  assert.strictEqual(
    countLinks(),
    1,
    'after failed update, session_messages must still list prior messages (atomic replace)'
  );

  const loaded = await adapter.loadSession('sess_1');
  assert.ok(loaded);
  let saveThrew = false;
  try {
    await adapter.saveSession({
      ...loaded,
      messageIds: ['msg_ok', 'msg_missing_fk'],
    });
  } catch {
    saveThrew = true;
  }
  assert.strictEqual(saveThrew, true, 'saveSession with bad FK should throw');
  assert.strictEqual(
    countLinks(),
    1,
    'after failed saveSession, session_messages must still list prior messages'
  );

  // If messageIds replace commits before sessions UPDATE, a failed UPDATE leaves
  // stale last_activity_at but new junction rows (SessionOrchestrator always sends both).
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS verify_abort_session_update
    BEFORE UPDATE ON sessions
    WHEN OLD.id = 'sess_atomic_update'
    BEGIN
      SELECT RAISE(ABORT, 'simulated sessions row update failure');
    END;
  `);

  const atomicSession = {
    id: 'sess_atomic_update',
    instructorId: 'inst_1',
    learnerId: 'learn_1',
    instructorProfileId: 'inst_1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active' as const,
    messageIds: [] as string[],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };
  await adapter.saveSession(atomicSession);

  db.prepare(
    `INSERT INTO messages (id, session_id, sender, role, content, message_type, teaching_metadata, created_at)
     VALUES (?, ?, 'learner', 'learner', 'a', 'question', NULL, ?)`
  ).run('msg_atomic_a', 'sess_atomic_update', new Date().toISOString());
  db.prepare(
    `INSERT INTO messages (id, session_id, sender, role, content, message_type, teaching_metadata, created_at)
     VALUES (?, ?, 'learner', 'learner', 'b', 'question', NULL, ?)`
  ).run('msg_atomic_b', 'sess_atomic_update', new Date().toISOString());

  await adapter.updateSession('sess_atomic_update', { messageIds: ['msg_atomic_a'] });

  let atomicThrew = false;
  try {
    await adapter.updateSession('sess_atomic_update', {
      messageIds: ['msg_atomic_b'],
      lastActivityAt: new Date(),
    });
  } catch {
    atomicThrew = true;
  }
  assert.strictEqual(atomicThrew, true, 'updateSession should throw when sessions UPDATE fails');
  const atomicLinks = db
    .prepare(
      'SELECT message_id FROM session_messages WHERE session_id = ? ORDER BY sequence_order'
    )
    .all('sess_atomic_update') as Array<{ message_id: string }>;
  assert.deepStrictEqual(
    atomicLinks.map(r => r.message_id),
    ['msg_atomic_a'],
    'junction must roll back with failed sessions UPDATE (same transaction as replace)'
  );

  adapter.close();
  console.log('verify-session-messages-transaction: ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
