/**
 * Regression: loadMessages must follow session message order, not created_at.
 * @see backend/adapters/storage/database.ts loadMessages
 */
import { strict as assert } from 'node:assert';
import { DatabaseStorageAdapter } from '../dist/backend/adapters/storage/database.js';

const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

await storage.createInstructor({ id: 'inst_1', name: 'Test instructor' });
await storage.createLearner({ id: 'learner_1', name: 'Test learner' });

const sessionId = 'sess_test';
const base = new Date('2026-01-15T12:00:00.000Z');

await storage.saveSession({
  id: sessionId,
  instructorId: 'inst_1',
  learnerId: 'learner_1',
  instructorProfileId: 'inst_1',
  subject: 'S',
  topic: 'T',
  learningObjective: 'L',
  sessionState: 'active',
  messageIds: [],
  startedAt: base,
  lastActivityAt: base,
  endedAt: null,
});

// First in transcript, but later created_at (would sort after with ORDER BY created_at)
const msgA = {
  id: 'msg_a',
  sessionId,
  role: 'learner',
  content: 'first',
  messageType: 'question',
  timestamp: new Date(base.getTime() + 2000),
};
// Second in transcript, earlier created_at
const msgB = {
  id: 'msg_b',
  sessionId,
  role: 'instructor',
  content: 'second',
  messageType: 'guidance',
  timestamp: new Date(base.getTime() + 1000),
};

await storage.saveMessage(msgA);
await storage.saveMessage(msgB);

await storage.updateSession(sessionId, { messageIds: ['msg_a', 'msg_b'] });

const loaded = await storage.loadMessages(['msg_a', 'msg_b']);
assert.equal(loaded.length, 2);
assert.equal(loaded[0].id, 'msg_a');
assert.equal(loaded[1].id, 'msg_b');
assert.equal(loaded[0].content, 'first');
assert.equal(loaded[1].content, 'second');

storage.close();
console.log('database-load-messages regression: ok');
