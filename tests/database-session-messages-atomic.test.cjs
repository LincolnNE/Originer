/**
 * session_messages replacement must be atomic: a failed re-order must not commit
 * DELETE without INSERTs (would wipe message index — data loss).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseStorageAdapter } = require('../dist/backend/adapters/storage/database');

test('updateSession messageIds rolls back when insert fails (FK)', async () => {
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const sessionId = 'sess_atomic';
  const instructorId = 'inst_atomic';
  const learnerId = 'learn_atomic';

  await db.ensureInstructorExists(instructorId);
  await db.ensureLearnerExists(learnerId);

  await db.saveSession({
    id: sessionId,
    instructorId,
    learnerId,
    instructorProfileId: instructorId,
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  const m1 = {
    id: 'msg_1',
    sessionId,
    role: 'learner',
    content: 'hello',
    messageType: 'question',
    timestamp: new Date(),
  };
  await db.saveMessage(m1);
  await db.updateSession(sessionId, { messageIds: [m1.id] });

  let before = await db.loadSession(sessionId);
  assert.deepEqual(before.messageIds, [m1.id]);

  await assert.rejects(
    () => db.updateSession(sessionId, { messageIds: [m1.id, 'msg_missing_row'] }),
    /FOREIGN KEY constraint failed/i
  );

  const after = await db.loadSession(sessionId);
  assert.deepEqual(
    after.messageIds,
    [m1.id],
    'previous message order must survive failed update'
  );

  db.close();
});
