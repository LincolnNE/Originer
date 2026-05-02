import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

describe('DatabaseStorageAdapter foreign keys', () => {
  it('persists sessions when instructor and learner rows were not created first', async () => {
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

    const sessionId = 'sess_test_1';
    const instructorId = 'inst_unknown';
    const learnerId = 'learner_unknown';

    await storage.saveSession({
      id: sessionId,
      instructorId,
      learnerId,
      instructorProfileId: instructorId,
      subject: 'Math',
      topic: 'Algebra',
      learningObjective: 'Practice',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    });

    const loaded = await storage.loadSession(sessionId);
    expect(loaded).not.toBeNull();
    expect(loaded!.instructorId).toBe(instructorId);
    expect(loaded!.learnerId).toBe(learnerId);

    storage.close();
  });

  it('persists instructor materials when the instructor row was not created first', async () => {
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

    const instructorId = 'inst_only_material';
    await storage.saveInstructorMaterial({
      id: 'mat_1',
      instructorId,
      type: 'text',
      contentText: 'hello',
    });

    const db = (storage as unknown as { db: import('better-sqlite3').Database }).db;
    const row = db
      .prepare('SELECT instructor_id FROM instructor_materials WHERE id = ?')
      .get('mat_1') as { instructor_id: string };

    expect(row.instructor_id).toBe(instructorId);

    storage.close();
  });
});
