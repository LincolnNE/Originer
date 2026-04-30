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

  adapter.close();
  console.log('verify-session-messages-transaction: ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
