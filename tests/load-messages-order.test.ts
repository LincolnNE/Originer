/**
 * Regression: loadMessages must return rows in session order (messageIds),
 * not sorted by created_at — identical timestamps would scramble history.
 */
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message } from '../backend/core/types';

async function main(): Promise<void> {
  const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const sessionId = 'sess_test';
  const instructorId = 'inst_test';
  const learnerId = 'learner_test';
  const sameTime = '2026-01-01T12:00:00.000Z';

  await adapter.createInstructor({ id: instructorId, name: 'Test Instructor' });
  await adapter.createLearner({ id: learnerId, name: 'Test Learner' });
  await adapter.saveSession({
    id: sessionId,
    instructorId,
    learnerId,
    instructorProfileId: instructorId,
    subject: 'General',
    topic: 'Test',
    learningObjective: 'Test',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(sameTime),
    lastActivityAt: new Date(sameTime),
    endedAt: null,
  });

  const m1: Message = {
    id: 'msg_first',
    sessionId,
    role: 'learner',
    content: 'first',
    messageType: 'question',
    timestamp: new Date(sameTime),
  };
  const m2: Message = {
    id: 'msg_second',
    sessionId,
    role: 'instructor',
    content: 'second',
    messageType: 'guidance',
    timestamp: new Date(sameTime),
  };

  await adapter.saveMessage(m1);
  await adapter.saveMessage(m2);

  const ordered = await adapter.loadMessages(['msg_first', 'msg_second']);
  if (ordered.length !== 2) {
    throw new Error(`expected 2 messages, got ${ordered.length}`);
  }
  if (ordered[0].id !== 'msg_first' || ordered[1].id !== 'msg_second') {
    throw new Error(
      `expected [msg_first, msg_second], got [${ordered.map(m => m.id).join(', ')}]`
    );
  }

  adapter.close();
  console.log('loadMessages order regression: ok');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
