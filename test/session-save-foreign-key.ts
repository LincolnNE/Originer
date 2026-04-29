/**
 * Integration check: saveSession must succeed for default instructor/learner IDs
 * used by POST /api/v1/sessions when parent rows are not pre-created.
 *
 * Second check: updateSession + saveLearnerMemory must still work if the learner
 * row was removed (simulates legacy DB / partial migration): updateSession must
 * re-ensure FK parents before learner_memory insert.
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

  // Simulate legacy inconsistent DB: session row exists but learner row missing (FK was off or old import).
  const db = (adapter as unknown as {
    db: {
      pragma: (s: string, mode?: boolean) => unknown;
      prepare: (s: string) => { run: (...a: unknown[]) => void };
    };
  }).db;
  db.pragma('foreign_keys = OFF');
  db.prepare('DELETE FROM learners WHERE id = ?').run(session.learnerId);
  db.pragma('foreign_keys = ON');

  await adapter.updateSession(session.id, {
    lastActivityAt: new Date(),
  });
  await adapter.saveLearnerMemory({
    learnerId: session.learnerId,
    learnedConcepts: [],
    misconceptions: [],
    strengths: [],
    weaknesses: [],
    progressMarkers: [],
    sessionSummaries: [],
    lastUpdated: new Date(),
  });

  adapter.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
