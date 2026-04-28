/**
 * Regression check: loadMessages must return rows in session order (messageIds),
 * not sorted by created_at. SessionOrchestrator and prompts depend on turn order.
 */
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

async function main(): Promise<void> {
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const sid = 's1';
  const iid = 'inst1';
  const lid = 'learner1';

  await db.createInstructor({ id: iid, name: 'I' });
  await db.createLearner({ id: lid, name: 'L' });
  await db.saveSession({
    id: sid,
    instructorId: iid,
    learnerId: lid,
    instructorProfileId: iid,
    subject: '',
    topic: '',
    learningObjective: '',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  const t0 = new Date('2020-01-01T00:00:00.000Z');
  const t1 = new Date('2020-01-01T00:00:01.000Z');
  await db.saveMessage({
    id: 'm_second',
    sessionId: sid,
    role: 'learner',
    content: 'second',
    messageType: 'question',
    timestamp: t1,
  });
  await db.saveMessage({
    id: 'm_first',
    sessionId: sid,
    role: 'instructor',
    content: 'first',
    messageType: 'guidance',
    timestamp: t0,
  });

  const msgs = await db.loadMessages(['m_second', 'm_first']);
  const got = msgs.map((m) => m.id).join(',');
  if (got !== 'm_second,m_first') {
    throw new Error(`Expected m_second,m_first (session order), got ${got}`);
  }
  console.log('verify-load-messages-order: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
