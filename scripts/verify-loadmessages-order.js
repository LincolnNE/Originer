/**
 * Regression check: loadMessages must return rows in session order (messageIds),
 * not sorted by created_at (which breaks when timestamps collide).
 */
const { DatabaseStorageAdapter } = require('../dist/backend/adapters/storage/database.js');

async function main() {
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const sameTime = new Date('2026-01-01T00:00:00.000Z').toISOString();

  await db.createInstructor({ id: 'inst_1', name: 'Test' });
  await db.createLearner({ id: 'lrn_1', name: 'Test' });
  await db.saveSession({
    id: 'sess_1',
    instructorId: 'inst_1',
    learnerId: 'lrn_1',
    instructorProfileId: 'inst_1',
    subject: 's',
    topic: 't',
    learningObjective: 'o',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  await db.saveMessage({
    id: 'msg_a',
    sessionId: 'sess_1',
    role: 'learner',
    content: 'first',
    messageType: 'question',
    timestamp: new Date(sameTime),
  });
  await db.saveMessage({
    id: 'msg_b',
    sessionId: 'sess_1',
    role: 'instructor',
    content: 'second',
    messageType: 'guidance',
    timestamp: new Date(sameTime),
  });

  const ordered = await db.loadMessages(['msg_a', 'msg_b']);
  if (ordered.length !== 2) throw new Error(`expected 2 messages, got ${ordered.length}`);
  if (ordered[0].id !== 'msg_a' || ordered[1].id !== 'msg_b') {
    throw new Error(
      `wrong order: expected msg_a, msg_b got ${ordered.map((m) => m.id).join(',')}`
    );
  }

  const reverse = await db.loadMessages(['msg_b', 'msg_a']);
  if (reverse[0].id !== 'msg_b' || reverse[1].id !== 'msg_a') {
    throw new Error(`reverse order failed: ${reverse.map((m) => m.id).join(',')}`);
  }

  db.close();
  console.log('ok: loadMessages preserves messageIds order');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
