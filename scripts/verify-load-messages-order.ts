/**
 * Quick regression check: loadMessages must follow session messageIds order,
 * not SQLite row order or created_at (see database adapter).
 */
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

async function main(): Promise<void> {
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const sessionId = 'sess_test';
  const sameTs = '2020-01-01T00:00:00.000Z';

  await db.createInstructor({ id: 'i1', name: 'Test Instructor' });
  await db.createLearner({ id: 'l1', name: 'Test Learner' });

  await db.saveSession({
    id: sessionId,
    instructorId: 'i1',
    learnerId: 'l1',
    instructorProfileId: 'i1',
    subject: 's',
    topic: 't',
    learningObjective: 'o',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(sameTs),
    lastActivityAt: new Date(sameTs),
    endedAt: null,
  });

  const mFirst = {
    id: 'msg_first',
    sessionId,
    role: 'learner' as const,
    content: 'first',
    messageType: 'question' as const,
    timestamp: new Date(sameTs),
  };
  const mSecond = {
    id: 'msg_second',
    sessionId,
    role: 'instructor' as const,
    content: 'second',
    messageType: 'guidance' as const,
    timestamp: new Date(sameTs),
  };

  await db.saveMessage(mFirst);
  await db.saveMessage(mSecond);

  await db.updateSession(sessionId, {
    messageIds: ['msg_first', 'msg_second'],
    lastActivityAt: new Date(sameTs),
  });

  const loaded = await db.loadMessages(['msg_second', 'msg_first']);
  assert(loaded.length === 2, 'expected 2 messages');
  assert(loaded[0].id === 'msg_second', `order 0: got ${loaded[0].id}`);
  assert(loaded[1].id === 'msg_first', `order 1: got ${loaded[1].id}`);

  const chronological = await db.loadMessages(['msg_first', 'msg_second']);
  assert(chronological[0].id === 'msg_first', 'chronological first');
  assert(chronological[1].id === 'msg_second', 'chronological second');

  db.close();
  console.log('verify-load-messages-order: ok');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
