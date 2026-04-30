/**
 * Regression: loadMessages must follow session.messageIds order, not created_at.
 * Same-millisecond timestamps would sort arbitrarily with ORDER BY created_at.
 */
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

async function main(): Promise<void> {
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  await db.createInstructor({ id: 'inst_order', name: 'Test' });
  await db.createLearner({ id: 'learn_order', name: 'L' });
  const session = {
    id: 'sess_order',
    instructorId: 'inst_order',
    learnerId: 'learn_order',
    instructorProfileId: 'inst_order',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active' as const,
    messageIds: [] as string[],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };
  await db.saveSession(session);

  const t = new Date('2020-01-01T00:00:00.000Z');
  const m1 = {
    id: 'm_order_1',
    sessionId: session.id,
    role: 'learner' as const,
    content: 'first',
    messageType: 'question' as const,
    timestamp: t,
  };
  const m2 = {
    id: 'm_order_2',
    sessionId: session.id,
    role: 'instructor' as const,
    content: 'second',
    messageType: 'guidance' as const,
    timestamp: t,
  };
  await db.saveMessage(m1);
  await db.saveMessage(m2);

  const forward = await db.loadMessages(['m_order_1', 'm_order_2']);
  if (forward.length !== 2 || forward[0].id !== 'm_order_1' || forward[1].id !== 'm_order_2') {
    throw new Error(`Expected [m_order_1, m_order_2], got ${forward.map(m => m.id).join(',')}`);
  }

  const backward = await db.loadMessages(['m_order_2', 'm_order_1']);
  if (backward.length !== 2 || backward[0].id !== 'm_order_2' || backward[1].id !== 'm_order_1') {
    throw new Error(`Expected [m_order_2, m_order_1], got ${backward.map(m => m.id).join(',')}`);
  }

  db.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
