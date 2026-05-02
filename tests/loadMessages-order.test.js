/**
 * Ensures loadMessages follows session messageIds order, not created_at.
 * Run: npm run build && node tests/loadMessages-order.test.js
 */

const assert = require('assert');
const path = require('path');

const { DatabaseStorageAdapter } = require(path.join(
  __dirname,
  '..',
  'dist',
  'backend',
  'adapters',
  'storage',
  'database.js'
));

async function main() {
  const adapter = new DatabaseStorageAdapter({
    type: 'sqlite',
    connectionString: ':memory:',
  });

  const sessionId = 'sess_test_order';
  const instId = 'inst_test_order';
  const learnId = 'learn_test_order';
  const learnerId = 'msg_learner';
  const instructorId = 'msg_instructor';

  await adapter.createInstructor({ id: instId, name: 'Test' });
  await adapter.createLearner({ id: learnId, name: 'Learner' });

  await adapter.saveSession({
    id: sessionId,
    instructorId: instId,
    learnerId: learnId,
    instructorProfileId: instId,
    subject: 's',
    topic: 't',
    learningObjective: 'lo',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  // Learner turn first in conversation order; instructor row has an *earlier* created_at
  // (clock skew / backfill) so ORDER BY created_at would invert the dialogue.
  await adapter.saveMessage({
    id: learnerId,
    sessionId,
    role: 'learner',
    content: 'Learner asks first',
    messageType: 'question',
    timestamp: new Date('2025-06-02T12:00:02.000Z'),
  });
  await adapter.saveMessage({
    id: instructorId,
    sessionId,
    role: 'instructor',
    content: 'Instructor replies second',
    messageType: 'guidance',
    timestamp: new Date('2025-06-02T12:00:01.000Z'),
  });

  const orderedIds = [learnerId, instructorId];
  await adapter.updateSession(sessionId, { messageIds: orderedIds });

  const loaded = await adapter.loadMessages(orderedIds);
  assert.strictEqual(loaded.length, 2);
  assert.strictEqual(loaded[0].id, learnerId);
  assert.strictEqual(loaded[1].id, instructorId);
  assert.strictEqual(loaded[0].content, 'Learner asks first');

  adapter.close();
  console.log('loadMessages-order: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
