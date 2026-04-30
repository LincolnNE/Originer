/**
 * Regression check: saveSession with stale empty messageIds must not wipe
 * session_messages rows that were populated via updateSession.
 */
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message, Session } from '../backend/core/types';

async function main(): Promise<void> {
  const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

  await adapter.createInstructor({ id: 'inst_1', name: 'Test Instructor' });
  await adapter.createLearner({ id: 'learner_1', name: 'Test Learner' });

  const sessionId = 'sess_verify';
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
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };

  await adapter.saveSession(session);

  const msgA: Message = {
    id: 'msg_a',
    sessionId,
    role: 'learner',
    content: 'hi',
    messageType: 'question',
    timestamp: new Date(),
  };
  const msgB: Message = {
    id: 'msg_b',
    sessionId,
    role: 'instructor',
    content: 'hello',
    messageType: 'guidance',
    timestamp: new Date(),
  };
  await adapter.saveMessage(msgA);
  await adapter.saveMessage(msgB);

  await adapter.updateSession(sessionId, {
    messageIds: ['msg_a', 'msg_b'],
  });

  const loaded = await adapter.loadSession(sessionId);
  if (!loaded || loaded.messageIds.length !== 2) {
    throw new Error('Expected 2 message ids after updateSession');
  }

  await adapter.saveSession({ ...loaded, messageIds: [] });

  const afterStaleSave = await adapter.loadSession(sessionId);
  if (!afterStaleSave || afterStaleSave.messageIds.join(',') !== 'msg_a,msg_b') {
    throw new Error(
      `Stale saveSession wiped messages: got ${JSON.stringify(afterStaleSave?.messageIds)}`
    );
  }

  adapter.close();
  console.log('verify-saveSession-preserves-messages: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
