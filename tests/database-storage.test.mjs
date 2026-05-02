/**
 * Integration tests for DatabaseStorageAdapter (SQLite).
 * Run: node --test tests/database-storage.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { DatabaseStorageAdapter } from '../dist/backend/adapters/storage/database.js';

test('loadMessages preserves messageIds order (not created_at)', async () => {
  const adapter = new DatabaseStorageAdapter({
    type: 'sqlite',
    connectionString: ':memory:',
  });

  await adapter.createInstructor({ id: 'inst1', name: 'Test Instructor' });
  await adapter.createLearner({ id: 'learn1', name: 'Test Learner' });

  const sessionId = 'sess_order_test';
  const sameTime = new Date('2026-01-01T12:00:00.000Z');

  await adapter.saveSession({
    id: sessionId,
    instructorId: 'inst1',
    learnerId: 'learn1',
    instructorProfileId: 'inst1',
    subject: 's',
    topic: 't',
    learningObjective: 'l',
    sessionState: 'active',
    messageIds: [],
    startedAt: sameTime,
    lastActivityAt: sameTime,
    endedAt: null,
  });

  const m1 = {
    id: 'msg_first',
    sessionId,
    role: 'learner',
    content: 'first',
    messageType: 'question',
    timestamp: sameTime,
  };
  const m2 = {
    id: 'msg_second',
    sessionId,
    role: 'instructor',
    content: 'second',
    messageType: 'guidance',
    timestamp: sameTime,
  };

  await adapter.saveMessage(m1);
  await adapter.saveMessage(m2);

  const outOfOrderIds = [m2.id, m1.id];
  const loaded = await adapter.loadMessages(outOfOrderIds);

  assert.strictEqual(loaded.length, 2);
  assert.strictEqual(loaded[0].id, m2.id);
  assert.strictEqual(loaded[1].id, m1.id);

  adapter.close();
});

test('updateSession with only messageIds touches sessions row last_activity_at', async () => {
  const adapter = new DatabaseStorageAdapter({
    type: 'sqlite',
    connectionString: ':memory:',
  });

  await adapter.createInstructor({ id: 'inst1', name: 'Test Instructor' });
  await adapter.createLearner({ id: 'learn1', name: 'Test Learner' });

  const sessionId = 'sess_touch_test';
  const started = new Date('2026-02-01T10:00:00.000Z');

  await adapter.saveSession({
    id: sessionId,
    instructorId: 'inst1',
    learnerId: 'learn1',
    instructorProfileId: 'inst1',
    subject: 's',
    topic: 't',
    learningObjective: 'l',
    sessionState: 'active',
    messageIds: [],
    startedAt: started,
    lastActivityAt: started,
    endedAt: null,
  });

  const msg = {
    id: 'msg_a',
    sessionId,
    role: 'learner',
    content: 'hi',
    messageType: 'question',
    timestamp: started,
  };
  await adapter.saveMessage(msg);

  await adapter.updateSession(sessionId, { messageIds: [msg.id] });

  const session = await adapter.loadSession(sessionId);
  assert.ok(session);
  assert.ok(session.lastActivityAt.getTime() > started.getTime());

  adapter.close();
});
