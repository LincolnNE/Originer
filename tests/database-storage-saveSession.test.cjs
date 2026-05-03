/**
 * Regression: saveSession must not wipe session_messages when messageIds is [] but
 * rows already exist (e.g. preview flow re-saves session metadata after messages).
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseStorageAdapter } = require('../dist/backend/adapters/storage/database');

test('saveSession with empty messageIds preserves existing transcript order', async () => {
  const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  await adapter.createInstructor({ id: 'inst_1', name: 'Test' });
  await adapter.createLearner({ id: 'learner_1', name: 'L' });

  const session = {
    id: 'sess_1',
    instructorId: 'inst_1',
    learnerId: 'learner_1',
    instructorProfileId: 'inst_1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
    lastActivityAt: new Date('2026-01-01T00:00:00.000Z'),
    endedAt: null,
  };

  await adapter.saveSession(session);

  await adapter.saveMessage({
    id: 'msg_1',
    sessionId: 'sess_1',
    role: 'learner',
    content: 'hello',
    messageType: 'question',
    timestamp: new Date('2026-01-01T00:00:01.000Z'),
  });

  await adapter.updateSession('sess_1', {
    messageIds: ['msg_1'],
    lastActivityAt: new Date('2026-01-01T00:00:02.000Z'),
  });

  // Simulates POST /instructors/:id/preview cleanup: saveSession(tempSession) with messageIds: []
  await adapter.saveSession({ ...session, messageIds: [] });

  const loaded = await adapter.loadSession('sess_1');
  assert.deepEqual(loaded.messageIds, ['msg_1']);

  const messages = await adapter.loadMessages(loaded.messageIds);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].content, 'hello');

  adapter.close();
});
