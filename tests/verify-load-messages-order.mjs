/**
 * Verifies loadMessages returns rows in the same order as messageIds
 * (regression: ORDER BY created_at can scramble ties / miss session order).
 *
 * Run: node tests/verify-load-messages-order.mjs
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { DatabaseStorageAdapter } = require('../dist/backend/adapters/storage/database.js');

const sameTs = new Date('2020-01-01T00:00:00.000Z');
const id1 = 'msg_a';
const id2 = 'msg_b';

const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
await storage.createInstructor({ id: 'inst_1', name: 'T' });
await storage.createLearner({ id: 'learner_1', name: 'L' });
await storage.saveSession({
  id: 'sess_1',
  instructorId: 'inst_1',
  learnerId: 'learner_1',
  instructorProfileId: 'inst_1',
  subject: 'S',
  topic: 'T',
  learningObjective: 'L',
  sessionState: 'active',
  messageIds: [],
  startedAt: sameTs,
  lastActivityAt: sameTs,
  endedAt: null,
});
await storage.saveMessage({
  id: id1,
  sessionId: 'sess_1',
  role: 'learner',
  content: 'first',
  messageType: 'question',
  timestamp: sameTs,
});
await storage.saveMessage({
  id: id2,
  sessionId: 'sess_1',
  role: 'instructor',
  content: 'second',
  messageType: 'guidance',
  timestamp: sameTs,
});

const reversed = await storage.loadMessages([id2, id1]);
if (reversed.length !== 2) throw new Error('expected 2 messages');
if (reversed[0].id !== id2 || reversed[1].id !== id1) {
  throw new Error(
    `loadMessages should follow messageIds order; got ${reversed.map((m) => m.id).join(',')}`
  );
}

const forward = await storage.loadMessages([id1, id2]);
if (forward[0].id !== id1 || forward[1].id !== id2) {
  throw new Error('loadMessages order invalid for forward list');
}

storage.close();
console.log('ok: loadMessages preserves messageIds order');
