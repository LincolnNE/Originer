/**
 * Smoke check: session creation must satisfy SQLite FKs when foreign_keys=ON.
 * Run: npx ts-node scripts/verify-session-start.ts
 */
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

async function main() {
  const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const instructorId = 'inst_verify';
  const learnerId = 'learner_verify';

  await adapter.ensureInstructorAndLearnerExist!(instructorId, learnerId);

  await adapter.saveSession({
    id: 'sess_verify',
    instructorId,
    learnerId,
    instructorProfileId: instructorId,
    subject: 'General',
    topic: 'Introduction',
    learningObjective: 'Verify',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  const loaded = await adapter.loadSession('sess_verify');
  if (!loaded || loaded.id !== 'sess_verify') {
    throw new Error('Session round-trip failed');
  }

  adapter.close();
  console.log('verify-session-start: ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
