/**
 * Regression: conversation history for prompts must follow session messageIds order,
 * not SQL ORDER BY created_at (timestamps can disagree with sequence).
 */
'use strict';

const assert = require('assert');
const {
  DatabaseStorageAdapter,
} = require('../dist/backend/adapters/storage/database');

function run() {
  const adapter = new DatabaseStorageAdapter({
    type: 'sqlite',
    connectionString: ':memory:',
  });

  const instructorId = 'inst_order_test';
  const learnerId = 'lear_order_test';
  const sessionId = 'sess_order_test';
  const msgA = 'msg_a';
  const msgB = 'msg_b';

  const tLater = new Date('2026-01-02T12:00:00.000Z');
  const tEarlier = new Date('2026-01-01T12:00:00.000Z');

  const baseMessage = {
    sessionId,
    role: 'learner',
    content: 'x',
    messageType: 'question',
  };

  adapter
    .createInstructor({ id: instructorId, name: 'T' })
    .then(() => adapter.createLearner({ id: learnerId, name: 'L' }))
    .then(() =>
      adapter.saveSession({
        id: sessionId,
        instructorId,
        learnerId,
        instructorProfileId: instructorId,
        subject: 's',
        topic: 't',
        learningObjective: 'l',
        sessionState: 'active',
        messageIds: [],
        startedAt: new Date(),
        lastActivityAt: new Date(),
        endedAt: null,
      })
    )
    .then(() =>
      adapter.saveMessage({
        id: msgA,
        ...baseMessage,
        timestamp: tLater,
      })
    )
    .then(() =>
      adapter.saveMessage({
        id: msgB,
        ...baseMessage,
        timestamp: tEarlier,
      })
    )
    .then(() =>
      adapter.updateSession(sessionId, {
        messageIds: [msgA, msgB],
      })
    )
    .then(() => adapter.loadMessages([msgA, msgB]))
    .then((messages) => {
      assert.strictEqual(messages.length, 2);
      assert.strictEqual(messages[0].id, msgA);
      assert.strictEqual(messages[1].id, msgB);
      console.log('load-messages-order: ok');
    })
    .then(() => adapter.close())
    .catch((err) => {
      try {
        adapter.close();
      } catch (_) {
        /* ignore */
      }
      throw err;
    });
}

run();
