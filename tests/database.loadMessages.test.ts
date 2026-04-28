/**
 * Ensures loadMessages preserves session message order (sequence in messageIds),
 * not SQLite's created_at ordering, so prompt history matches the real thread.
 */

import assert from 'assert';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message, Session } from '../backend/core/types';

async function run() {
  const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

  await storage.createInstructor({ id: 'inst_1', name: 'Test instructor' });
  await storage.createLearner({ id: 'learner_1', name: 'Test learner' });

  const sessionId = 'sess_test_1';
  const session: Session = {
    id: sessionId,
    instructorId: 'inst_1',
    learnerId: 'learner_1',
    instructorProfileId: 'inst_1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
    lastActivityAt: new Date('2026-01-01T00:00:00.000Z'),
    endedAt: null,
  };
  await storage.saveSession(session);

  const mFirst: Message = {
    id: 'msg_first',
    sessionId,
    role: 'learner',
    content: 'first',
    messageType: 'question',
    timestamp: new Date('2026-01-01T00:00:01.000Z'),
  };
  const mSecond: Message = {
    id: 'msg_second',
    sessionId,
    role: 'instructor',
    content: 'second',
    messageType: 'guidance',
    // Deliberately earlier than first: session order is learner then instructor, but
    // ORDER BY created_at would list instructor first (wrong for prompt history).
    timestamp: new Date('2026-01-01T00:00:00.500Z'),
  };

  await storage.saveMessage(mFirst);
  await storage.saveMessage(mSecond);

  const messageIds = [mFirst.id, mSecond.id];
  await storage.updateSession(sessionId, { messageIds });

  const loaded = await storage.loadMessages(messageIds);
  assert.strictEqual(loaded.length, 2, 'expected two messages');
  assert.strictEqual(loaded[0]!.id, 'msg_first', 'first in history must match messageIds[0]');
  assert.strictEqual(loaded[1]!.id, 'msg_second', 'second in history must match messageIds[1]');

  storage.close();
  console.log('database.loadMessages.test.ts: ok');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
