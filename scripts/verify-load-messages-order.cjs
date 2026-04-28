/**
 * Verifies loadMessages() returns rows in the order of the messageIds argument,
 * not sorted by created_at (critical when two messages share a timestamp).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { DatabaseStorageAdapter } = require('../dist/backend/adapters/storage/database.js');

const sameTime = new Date('2020-01-01T00:00:00.000Z');
const sessionId = 's_verify_order';
const instructorId = 'i_verify';
const learnerId = 'l_verify';

async function main() {
  const dbFile = path.join(os.tmpdir(), `originer-load-messages-order-${Date.now()}.db`);
  const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: dbFile });

  try {
    await storage.createInstructor({ id: instructorId, name: 'T' });
    await storage.createLearner({ id: learnerId, name: 'L' });
    await storage.saveSession({
      id: sessionId,
      instructorId,
      learnerId,
      instructorProfileId: instructorId,
      subject: 'x',
      topic: 't',
      learningObjective: 'o',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(1),
      lastActivityAt: new Date(1),
      endedAt: null,
    });

    const msgA = {
      id: 'm_a',
      sessionId,
      role: 'learner',
      content: 'A',
      messageType: 'question',
      timestamp: sameTime,
    };
    const msgB = {
      id: 'm_b',
      sessionId,
      role: 'instructor',
      content: 'B',
      messageType: 'guidance',
      timestamp: sameTime,
    };

    await storage.saveMessage(msgA);
    await storage.saveMessage(msgB);
    await storage.updateSession(sessionId, { messageIds: [msgA.id, msgB.id] });

    const inTurnOrder = await storage.loadMessages([msgA.id, msgB.id]);
    if (inTurnOrder[0].id !== msgA.id || inTurnOrder[1].id !== msgB.id) {
      throw new Error(
        `Expected A then B, got: ${inTurnOrder.map(m => m.id).join(',')}`
      );
    }

    const reversed = await storage.loadMessages([msgB.id, msgA.id]);
    if (reversed[0].id !== msgB.id || reversed[1].id !== msgA.id) {
      throw new Error(
        `Expected B then A, got: ${reversed.map(m => m.id).join(',')}`
      );
    }

    console.log('ok: loadMessages order matches messageIds (same created_at case)');
  } finally {
    storage.close();
    try {
      fs.unlinkSync(dbFile);
    } catch {
      // ignore
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
