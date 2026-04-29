/**
 * Regression: loadMessages must follow session.messageIds order, not created_at.
 * Run: npm run build && node tests/loadMessages-order.cjs
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { DatabaseStorageAdapter } = require('../dist/backend/adapters/storage/database');

async function main() {
  const tmp = path.join(os.tmpdir(), `originer-order-${process.pid}-${Date.now()}.sqlite`);
  const adapter = new DatabaseStorageAdapter({
    type: 'sqlite',
    connectionString: tmp,
  });

  await adapter.createInstructor({
    id: 'inst_test',
    name: 'Test Instructor',
    tone: 'friendly',
  });
  await adapter.createLearner({
    id: 'learner_test',
    name: 'Test Learner',
    level: 'beginner',
  });

  const sessionId = 'sess_order_test';
  const sameTime = new Date('2020-01-01T12:00:00.000Z');

  await adapter.saveSession({
    id: sessionId,
    instructorId: 'inst_test',
    learnerId: 'learner_test',
    instructorProfileId: 'inst_test',
    subject: 's',
    topic: 't',
    learningObjective: 'l',
    sessionState: 'active',
    messageIds: [],
    startedAt: sameTime,
    lastActivityAt: sameTime,
    endedAt: null,
  });

  // Same timestamp; IDs chosen so lexicographic sort differs from conversation order
  await adapter.saveMessage({
    id: 'msg_learner',
    sessionId,
    role: 'learner',
    content: 'first turn',
    messageType: 'question',
    timestamp: sameTime,
  });
  await adapter.saveMessage({
    id: 'msg_instructor',
    sessionId,
    role: 'instructor',
    content: 'second turn',
    messageType: 'guidance',
    timestamp: sameTime,
  });

  const orderedIds = ['msg_learner', 'msg_instructor'];
  await adapter.updateSession(sessionId, { messageIds: orderedIds });

  const messages = await adapter.loadMessages(orderedIds);
  const roles = messages.map((m) => m.role).join(',');
  if (roles !== 'learner,instructor') {
    console.error('FAIL: expected learner,instructor got', roles);
    process.exit(1);
  }

  adapter.close();
  try {
    fs.unlinkSync(tmp);
  } catch {
    // ignore
  }
  console.log('OK loadMessages preserves session message order');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
