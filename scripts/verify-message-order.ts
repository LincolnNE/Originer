/**
 * Regression: loadMessages must follow session messageIds order, not created_at.
 * Equal timestamps on learner + instructor rows in the same second would reorder
 * conversation history and corrupt LLM context.
 */
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

async function main(): Promise<void> {
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  await db.createInstructor({ id: 'i1', name: 'T' });
  await db.createLearner({ id: 'l1', name: 'L' });
  const t = new Date('2026-01-01T00:00:00.000Z');
  await db.saveSession({
    id: 's1',
    instructorId: 'i1',
    learnerId: 'l1',
    instructorProfileId: 'i1',
    subject: '',
    topic: '',
    learningObjective: '',
    sessionState: 'active',
    messageIds: [],
    startedAt: t,
    lastActivityAt: t,
    endedAt: null,
  });
  await db.saveMessage({
    id: 'm_learner',
    sessionId: 's1',
    role: 'learner',
    content: 'first',
    messageType: 'question',
    timestamp: t,
  });
  await db.saveMessage({
    id: 'm_instructor',
    sessionId: 's1',
    role: 'instructor',
    content: 'second',
    messageType: 'guidance',
    timestamp: t,
  });
  await db.updateSession('s1', { messageIds: ['m_learner', 'm_instructor'] });
  const loaded = await db.loadMessages(['m_learner', 'm_instructor']);
  if (loaded.length !== 2 || loaded[0].content !== 'first' || loaded[1].content !== 'second') {
    console.error('Expected learner then instructor; got:', loaded.map((m) => `${m.role}:${m.content}`));
    process.exit(1);
  }
  db.close();
  console.log('verify-message-order: OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
