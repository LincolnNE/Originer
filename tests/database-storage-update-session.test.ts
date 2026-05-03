/**
 * Regression: updateSession with only messageIds must persist session row metadata
 * (last_activity_at) so loadSession reflects updated ordering state.
 */
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Session } from '../backend/core/types';

async function main(): Promise<void> {
  const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const sessionId = 'sess_test';
  const session: Session = {
    id: sessionId,
    instructorId: 'inst_1',
    learnerId: 'learn_1',
    instructorProfileId: 'inst_1',
    subject: 'General',
    topic: 'Intro',
    learningObjective: 'Learn',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date('2020-01-01T00:00:00.000Z'),
    lastActivityAt: new Date('2020-01-01T00:00:00.000Z'),
    endedAt: null,
  };

  await adapter.createInstructor({ id: 'inst_1', name: 'Test Instructor' });
  await adapter.createLearner({ id: 'learn_1', name: 'Test Learner' });
  await adapter.saveSession(session);

  await adapter.saveMessage({
    id: 'msg_1',
    sessionId,
    role: 'learner',
    content: 'hello',
    messageType: 'question',
    timestamp: new Date('2020-01-02T00:00:00.000Z'),
  });

  const beforeActivity = session.lastActivityAt.getTime();

  await adapter.updateSession(sessionId, { messageIds: ['msg_1'] });

  const loaded = await adapter.loadSession(sessionId);
  if (!loaded) {
    throw new Error('expected session after updateSession');
  }
  if (loaded.messageIds.length !== 1 || loaded.messageIds[0] !== 'msg_1') {
    throw new Error(`unexpected messageIds: ${JSON.stringify(loaded.messageIds)}`);
  }
  if (loaded.lastActivityAt.getTime() <= beforeActivity) {
    throw new Error(
      'last_activity_at should advance when messageIds are updated without other session fields'
    );
  }

  adapter.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
