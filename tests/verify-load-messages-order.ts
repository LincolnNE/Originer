/**
 * Verifies loadMessages returns rows in session message order, not by created_at.
 * Run: npx ts-node --transpileOnly tests/verify-load-messages-order.ts
 */
import assert from 'node:assert';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

async function main() {
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  await db.createInstructor({ id: 'i', name: 'Test' });
  await db.createLearner({ id: 'l', name: 'L' });
  const session = {
    id: 's1',
    instructorId: 'i',
    learnerId: 'l',
    instructorProfileId: 'i',
    subject: '',
    topic: '',
    learningObjective: '',
    sessionState: 'active' as const,
    messageIds: [] as string[],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };
  await db.saveSession(session);

  const sameTime = new Date('2020-01-01T00:00:00.000Z');
  const mLearner = {
    id: 'learner_msg',
    sessionId: 's1',
    role: 'learner' as const,
    content: 'Q',
    messageType: 'question' as const,
    timestamp: sameTime,
  };
  const mInstructor = {
    id: 'instructor_msg',
    sessionId: 's1',
    role: 'instructor' as const,
    content: 'A',
    messageType: 'guidance' as const,
    timestamp: sameTime,
  };
  await db.saveMessage(mLearner);
  await db.saveMessage(mInstructor);

  const forward = await db.loadMessages(['learner_msg', 'instructor_msg']);
  assert.deepStrictEqual(
    forward.map(m => m.id),
    ['learner_msg', 'instructor_msg'],
    'order must match messageIds (chronological turn order)'
  );

  const reverse = await db.loadMessages(['instructor_msg', 'learner_msg']);
  assert.deepStrictEqual(
    reverse.map(m => m.id),
    ['instructor_msg', 'learner_msg'],
    'order must follow messageIds, not created_at'
  );

  db.close();
  console.log('verify-load-messages-order: ok');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
