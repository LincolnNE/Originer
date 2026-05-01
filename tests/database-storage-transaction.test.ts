/**
 * Regression: updateSession must not commit DELETE from session_messages
 * if the subsequent inserts fail (e.g. duplicate message_id in one batch).
 */

import assert from 'node:assert/strict';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Session } from '../backend/core/types';

function baseSession(id: string, messageIds: string[]): Session {
  return {
    id,
    instructorId: 'inst_test',
    learnerId: 'learner_test',
    instructorProfileId: 'inst_test',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds,
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };
}

async function run() {
  const storage = new DatabaseStorageAdapter({
    type: 'sqlite',
    connectionString: ':memory:',
  });

  await storage.createInstructor({ id: 'inst_test', name: 'Test Instructor' });
  await storage.createLearner({ id: 'learner_test', name: 'Test Learner' });

  await storage.saveSession(baseSession('sess_test', []));

  await storage.saveMessage({
    id: 'msg_keep',
    sessionId: 'sess_test',
    role: 'learner',
    content: 'hello',
    messageType: 'question',
    timestamp: new Date(),
  });

  await storage.updateSession('sess_test', { messageIds: ['msg_keep'] });

  await storage.saveMessage({
    id: 'msg_dup',
    sessionId: 'sess_test',
    role: 'learner',
    content: 'x',
    messageType: 'question',
    timestamp: new Date(),
  });

  let threw = false;
  try {
    await storage.updateSession('sess_test', {
      messageIds: ['msg_dup', 'msg_dup'],
    });
  } catch {
    threw = true;
  }
  assert.equal(threw, true, 'duplicate messageIds should violate PRIMARY KEY and throw');

  const reloaded = await storage.loadSession('sess_test');
  assert.ok(reloaded, 'session should still exist');
  assert.deepEqual(
    reloaded!.messageIds,
    ['msg_keep'],
    'failed updateSession must not wipe prior session_messages linkage'
  );

  storage.close();
  console.log('database-storage-transaction.test.ts: OK');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
