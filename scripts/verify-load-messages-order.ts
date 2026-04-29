/**
 * Regression check: loadMessages must follow session message order, not created_at.
 * Run: npx ts-node --transpile-only scripts/verify-load-messages-order.ts
 */
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message } from '../backend/core/types';

async function main(): Promise<void> {
  const storage = new DatabaseStorageAdapter({
    type: 'sqlite',
    connectionString: ':memory:',
  });

  await storage.createInstructor({ id: 'inst_1', name: 'Test Instructor' });
  await storage.createLearner({ id: 'learn_1', name: 'Test Learner' });

  const sessionId = 'sess_test';
  const sameTime = '2020-01-01T00:00:00.000Z';

  await storage.saveSession({
    id: sessionId,
    instructorId: 'inst_1',
    learnerId: 'learn_1',
    instructorProfileId: 'inst_1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(sameTime),
    lastActivityAt: new Date(sameTime),
    endedAt: null,
  });

  const mk = (id: string, role: Message['role'], content: string): Message => ({
    id,
    sessionId,
    role,
    content,
    messageType: 'question',
    timestamp: new Date(sameTime),
  });

  const m1 = mk('msg_a', 'learner', 'first');
  const m2 = mk('msg_b', 'instructor', 'second');
  const m3 = mk('msg_c', 'learner', 'third');

  await storage.saveMessage(m1);
  await storage.saveMessage(m2);
  await storage.saveMessage(m3);

  await storage.updateSession(sessionId, {
    messageIds: ['msg_a', 'msg_b', 'msg_c'],
    lastActivityAt: new Date(sameTime),
  });

  const loaded = await storage.loadMessages(['msg_a', 'msg_b', 'msg_c']);
  const contents = loaded.map(m => m.content).join('|');

  if (contents !== 'first|second|third') {
    console.error('FAIL: expected first|second|third, got', contents);
    process.exit(1);
  }

  storage.close();
  console.log('OK loadMessages preserves session order');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
