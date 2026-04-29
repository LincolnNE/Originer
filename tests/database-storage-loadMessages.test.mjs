/**
 * Regression: loadMessages must follow session message order, not created_at.
 * Same created_at (or out-of-order timestamps) must not reorder learner/instructor turns.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseStorageAdapter } from '../dist/backend/adapters/storage/database.js';

test('loadMessages preserves session order when created_at is identical', async () => {
  const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const sessionId = 'sess_order_test';
  const sameTime = '2026-01-01T12:00:00.000Z';

  await storage.createInstructor({ id: 'inst_1', name: 'Test Instructor' });
  await storage.createLearner({ id: 'learn_1', name: 'Test Learner' });

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

  const msgLearner = {
    id: 'msg_learner',
    sessionId,
    role: 'learner',
    content: 'Question?',
    messageType: 'question',
    timestamp: new Date(sameTime),
  };
  const msgInstructor = {
    id: 'msg_instructor',
    sessionId,
    role: 'instructor',
    content: 'Answer.',
    messageType: 'guidance',
    timestamp: new Date(sameTime),
  };

  await storage.saveMessage(msgLearner);
  await storage.saveMessage(msgInstructor);
  await storage.updateSession(sessionId, {
    messageIds: ['msg_learner', 'msg_instructor'],
  });

  const ordered = await storage.loadMessages(['msg_learner', 'msg_instructor']);
  assert.equal(ordered.length, 2);
  assert.equal(ordered[0].id, 'msg_learner');
  assert.equal(ordered[0].role, 'learner');
  assert.equal(ordered[1].id, 'msg_instructor');
  assert.equal(ordered[1].role, 'instructor');

  storage.close();
});
