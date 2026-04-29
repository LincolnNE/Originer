/**
 * Regression: junction updates must be atomic:
 * - updateSession: DELETE + INSERT (+ optional sessions UPDATE) in one transaction.
 * - saveSession: sessions row + DELETE + INSERT in one transaction (nested txn used to
 *   roll back inserts but not the outer DELETE on insert failure).
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { DatabaseStorageAdapter } = require('../dist/backend/adapters/storage/database');

async function main() {
  const dbFile = path.join(os.tmpdir(), `originer-updateSession-${Date.now()}.db`);
  const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: dbFile });

  await adapter.createInstructor({ id: 'inst_1', name: 'Test Instructor' });
  await adapter.createLearner({ id: 'learner_1', name: 'Test Learner' });

  const sessionId = 'sess_test_1';
  const baseSession = {
    id: sessionId,
    instructorId: 'inst_1',
    learnerId: 'learner_1',
    instructorProfileId: 'inst_1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };

  await adapter.saveSession(baseSession);

  const m1 = {
    id: 'msg_1',
    sessionId,
    role: 'learner',
    content: 'hello',
    messageType: 'question',
    timestamp: new Date(),
  };
  const m2 = {
    id: 'msg_2',
    sessionId,
    role: 'instructor',
    content: 'hi',
    messageType: 'guidance',
    timestamp: new Date(),
  };
  await adapter.saveMessage(m1);
  await adapter.saveMessage(m2);

  await adapter.updateSession(sessionId, {
    messageIds: ['msg_1', 'msg_2'],
    lastActivityAt: new Date(),
  });

  const loaded = await adapter.loadSession(sessionId);
  assert.deepStrictEqual(loaded.messageIds, ['msg_1', 'msg_2']);

  await adapter.updateSession(sessionId, { sessionState: 'completed' });
  const afterStateOnly = await adapter.loadSession(sessionId);
  assert.deepStrictEqual(
    afterStateOnly.messageIds,
    ['msg_1', 'msg_2'],
    'session_state-only update must not wipe session_messages'
  );

  // saveSession: failed junction insert must not wipe existing links (full txn rollback).
  let threw = false;
  try {
    await adapter.saveSession({
      ...afterStateOnly,
      messageIds: ['msg_1', 'msg_1'],
    });
  } catch (e) {
    threw = true;
  }
  assert.strictEqual(threw, true, 'duplicate messageIds should fail insert');
  const afterBadSave = await adapter.loadSession(sessionId);
  assert.deepStrictEqual(
    afterBadSave.messageIds,
    ['msg_1', 'msg_2'],
    'failed saveSession must not clear session_messages'
  );

  adapter.close();
  fs.unlinkSync(dbFile);
  console.log('database updateSession tests passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
