/**
 * Integration check: saveSession must succeed for default instructor/learner IDs
 * used by POST /api/v1/sessions when parent rows are not pre-created.
 */
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

async function main(): Promise<void> {
  const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const session = {
    id: 'sess_test_fk',
    instructorId: 'default',
    learnerId: 'learner_default',
    instructorProfileId: 'default',
    subject: 'General',
    topic: 'Introduction',
    learningObjective: 'Learn',
    sessionState: 'active' as const,
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };

  await adapter.saveSession(session);
  const loaded = await adapter.loadSession(session.id);
  if (!loaded || loaded.id !== session.id) {
    throw new Error('Session was not persisted or load failed');
  }
  adapter.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
