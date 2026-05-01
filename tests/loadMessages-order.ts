/**
 * Regression: loadMessages must return rows in session messageIds order,
 * not ORDER BY created_at (same-ms timestamps reorder learner/instructor turns).
 */
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message } from '../backend/core/types';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

async function main(): Promise<void> {
  const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

  const sessionId = 'sess_test';
  const t = new Date('2026-01-01T00:00:00.000Z').toISOString();

  await adapter.createInstructor({ id: 'inst_1', name: 'Test Instructor' });
  await adapter.createLearner({ id: 'learn_1', name: 'Test Learner' });

  await adapter.saveSession({
    id: sessionId,
    instructorId: 'inst_1',
    learnerId: 'learn_1',
    instructorProfileId: 'inst_1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  const learnerMsg: Message = {
    id: 'msg_learner',
    sessionId,
    role: 'learner',
    content: 'Why?',
    messageType: 'question',
    timestamp: new Date(t),
  };
  const instructorMsg: Message = {
    id: 'msg_instructor',
    sessionId,
    role: 'instructor',
    content: 'What do you think?',
    messageType: 'guidance',
    timestamp: new Date(t),
  };

  await adapter.saveMessage(learnerMsg);
  await adapter.saveMessage(instructorMsg);

  const orderedIds = ['msg_learner', 'msg_instructor'];
  await adapter.updateSession(sessionId, { messageIds: orderedIds });

  const loaded = await adapter.loadMessages(orderedIds);
  assert(loaded.length === 2, `expected 2 messages, got ${loaded.length}`);
  assert(loaded[0].id === 'msg_learner', `first should be learner, got ${loaded[0].id}`);
  assert(loaded[1].id === 'msg_instructor', `second should be instructor, got ${loaded[1].id}`);

  adapter.close();
  console.log('loadMessages-order: ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
