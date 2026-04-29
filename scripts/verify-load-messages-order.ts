/**
 * Verifies loadMessages returns rows in session messageIds order (not created_at).
 * Run: npx ts-node scripts/verify-load-messages-order.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message } from '../backend/core/types';

async function main(): Promise<void> {
  const tmp = path.join(
    fs.mkdtempSync(path.join(require('os').tmpdir(), 'originer-db-')),
    'test.sqlite'
  );

  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: tmp });

  await db.createInstructor({ id: 'inst_1', name: 'Test Instructor' });
  await db.createLearner({ id: 'learn_1', name: 'Test Learner' });

  const sessionId = 'sess_test';
  const base = new Date('2020-01-01T00:00:00.000Z');
  const later = new Date('2020-01-01T01:00:00.000Z');

  await db.saveSession({
    id: sessionId,
    instructorId: 'inst_1',
    learnerId: 'learn_1',
    instructorProfileId: 'inst_1',
    subject: 's',
    topic: 't',
    learningObjective: 'l',
    sessionState: 'active',
    messageIds: [],
    startedAt: base,
    lastActivityAt: base,
    endedAt: null,
  });

  const msgA: Message = {
    id: 'msg_a',
    sessionId,
    role: 'learner',
    content: 'first',
    messageType: 'question',
    timestamp: base,
  };
  const msgB: Message = {
    id: 'msg_b',
    sessionId,
    role: 'instructor',
    content: 'second',
    messageType: 'guidance',
    timestamp: later,
  };

  await db.saveMessage(msgB);
  await db.saveMessage(msgA);

  await db.updateSession(sessionId, { messageIds: ['msg_a', 'msg_b'] });

  const loaded = await db.loadMessages(['msg_a', 'msg_b']);
  const ids = loaded.map((m) => m.id);

  if (ids[0] !== 'msg_a' || ids[1] !== 'msg_b') {
    console.error('FAIL: expected [msg_a, msg_b], got', ids);
    process.exit(1);
  }

  db.close();
  fs.unlinkSync(tmp);
  console.log('OK: loadMessages preserves messageIds order');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
