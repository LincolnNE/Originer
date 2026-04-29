/**
 * Regression check: loadMessages must return rows in messageIds order, not created_at.
 * Run: npx ts-node --project tsconfig.scripts.json scripts/verify-loadMessages-order.ts
 */

import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message } from '../backend/core/types';

async function main(): Promise<void> {
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const sessionId = 'sess_order_test';

  await db.createInstructor({ id: 'inst_test', name: 'Test Instructor' });
  await db.createLearner({ id: 'learn_test', name: 'Test Learner' });

  await db.saveSession({
    id: sessionId,
    instructorId: 'inst_test',
    learnerId: 'learn_test',
    instructorProfileId: 'inst_test',
    subject: 'x',
    topic: 'y',
    learningObjective: 'z',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  const mk = (id: string, content: string, ts: Date): Message => ({
    id,
    sessionId,
    role: 'learner',
    content,
    messageType: 'question',
    timestamp: ts,
  });

  const t0 = new Date('2026-04-29T12:00:00.000Z');
  // Insert second message with earlier timestamp so ORDER BY created_at would invert order
  await db.saveMessage(mk('m_first', 'first', new Date(t0.getTime() + 2000)));
  await db.saveMessage(mk('m_second', 'second', new Date(t0.getTime() + 1000)));

  const ordered = await db.loadMessages(['m_first', 'm_second']);
  const contents = ordered.map((m) => m.content);
  if (contents[0] !== 'first' || contents[1] !== 'second') {
    console.error('FAIL: expected [first, second], got', contents);
    process.exit(1);
  }

  console.log('OK: loadMessages preserves messageIds order');
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
