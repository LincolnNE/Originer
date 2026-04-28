/**
 * Regression: loadMessages must preserve session order, not created_at order.
 * Run: node tests/loadMessages.order.test.mjs
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { existsSync, unlinkSync } from 'fs';

const require = createRequire(import.meta.url);
const { DatabaseStorageAdapter } = require('../dist/backend/adapters/storage/database.js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
process.chdir(root);

const dbFile = join(tmpdir(), `originer-msg-order-${Date.now()}.db`);
if (existsSync(dbFile)) unlinkSync(dbFile);

const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: dbFile });
const sessionId = 's_test';
const t0 = new Date('2026-01-01T00:00:00.000Z');

await db.createInstructor({ id: 'i1', name: 'Instructor' });
await db.createLearner({ id: 'l1', name: 'Learner' });

await db.saveSession({
  id: sessionId,
  instructorId: 'i1',
  learnerId: 'l1',
  instructorProfileId: 'i1',
  subject: 'S',
  topic: 'T',
  learningObjective: 'L',
  sessionState: 'active',
  messageIds: [],
  startedAt: t0,
  lastActivityAt: t0,
  endedAt: null,
});

const m1 = {
  id: 'msg_a',
  sessionId,
  role: 'learner',
  content: 'first',
  messageType: 'question',
  timestamp: t0,
};
const m2 = {
  id: 'msg_b',
  sessionId,
  role: 'instructor',
  content: 'second',
  messageType: 'guidance',
  timestamp: t0,
};

await db.saveMessage(m1);
await db.saveMessage(m2);

// Force same created_at so ORDER BY created_at is non-deterministic vs session order
const stmt = db['db'].prepare('UPDATE messages SET created_at = ? WHERE id = ?');
stmt.run('2026-01-01T00:00:00.000Z', 'msg_a');
stmt.run('2026-01-01T00:00:00.000Z', 'msg_b');

await db.updateSession(sessionId, { messageIds: ['msg_a', 'msg_b'] });

const out = await db.loadMessages(['msg_a', 'msg_b']);
if (out[0].content !== 'first' || out[1].content !== 'second') {
  console.error('FAIL: got', out.map((m) => m.content));
  process.exit(1);
}

db.close();
unlinkSync(dbFile);
console.log('loadMessages order: ok');
