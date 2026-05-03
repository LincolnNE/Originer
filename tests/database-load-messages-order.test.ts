/**
 * Regression: loadMessages must follow messageIds order, not created_at.
 * Same-timestamp messages (or reorder semantics from session_messages) must not
 * shuffle conversation history for prompts.
 */
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Session } from '../backend/core/types';

async function main(): Promise<void> {
  const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const sessionId = 'sess_order';
  const sameTime = new Date('2020-01-01T12:00:00.000Z');

  const session: Session = {
    id: sessionId,
    instructorId: 'inst_1',
    learnerId: 'learn_1',
    instructorProfileId: 'inst_1',
    subject: 'General',
    topic: 'Intro',
    learningObjective: 'Learn',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date('2020-01-01T00:00:00.000Z'),
    lastActivityAt: new Date('2020-01-01T00:00:00.000Z'),
    endedAt: null,
  };

  await adapter.createInstructor({ id: 'inst_1', name: 'Test Instructor' });
  await adapter.createLearner({ id: 'learn_1', name: 'Test Learner' });
  await adapter.saveSession(session);

  await adapter.saveMessage({
    id: 'm_first',
    sessionId,
    role: 'learner',
    content: 'question',
    messageType: 'question',
    timestamp: sameTime,
  });
  await adapter.saveMessage({
    id: 'm_second',
    sessionId,
    role: 'instructor',
    content: 'answer',
    messageType: 'explanation',
    timestamp: sameTime,
  });

  const ordered = await adapter.loadMessages(['m_first', 'm_second']);
  if (ordered.length !== 2) {
    throw new Error(`expected 2 messages, got ${ordered.length}`);
  }
  if (ordered[0].id !== 'm_first' || ordered[0].role !== 'learner') {
    throw new Error(`first message should be learner in messageIds order, got ${ordered[0].id}`);
  }
  if (ordered[1].id !== 'm_second' || ordered[1].role !== 'instructor') {
    throw new Error(`second message should be instructor in messageIds order, got ${ordered[1].id}`);
  }

  const reverseStillHonorsIds = await adapter.loadMessages(['m_second', 'm_first']);
  if (reverseStillHonorsIds[0].id !== 'm_second' || reverseStillHonorsIds[1].id !== 'm_first') {
    throw new Error('loadMessages must mirror messageIds array order');
  }

  adapter.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
