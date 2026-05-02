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

  it('saveSession upsert does not drop session_messages when re-saving an existing session', async () => {
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

    const sessionId = 'sess_resave';
    const instructorId = 'inst_r';
    const learnerId = 'learner_r';

    await storage.saveSession({
      id: sessionId,
      instructorId,
      learnerId,
      instructorProfileId: instructorId,
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date('2020-01-01T00:00:00.000Z'),
      lastActivityAt: new Date('2020-01-01T00:00:00.000Z'),
      endedAt: null,
    });

    const db = (storage as unknown as { db: import('better-sqlite3').Database }).db;
    db.prepare(
      `INSERT INTO messages (id, session_id, sender, role, content, message_type, created_at)
       VALUES (?, ?, 'learner', 'learner', 'hi', 'question', ?)`
    ).run('m_a', sessionId, new Date().toISOString());

    await storage.saveSession({
      id: sessionId,
      instructorId,
      learnerId,
      instructorProfileId: instructorId,
      subject: 'S2',
      topic: 'T2',
      learningObjective: 'L2',
      sessionState: 'active',
      messageIds: ['m_a'],
      startedAt: new Date('2020-01-01T00:00:00.000Z'),
      lastActivityAt: new Date('2020-01-02T00:00:00.000Z'),
      endedAt: null,
    });

    const cnt = db
      .prepare(
        `SELECT COUNT(*) as n FROM session_messages sm
         JOIN messages m ON m.id = sm.message_id
         WHERE sm.session_id = ? AND m.session_id = ?`
      )
      .get(sessionId, sessionId) as { n: number };

    expect(cnt.n).toBe(1);

    storage.close();
  });

  it('updateSession keeps prior session_messages when junction insert fails (atomic replace)', async () => {
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

    const sessionId = 'sess_tx_rollback';
    const instructorId = 'inst_tx';
    const learnerId = 'learner_tx';

    await storage.saveSession({
      id: sessionId,
      instructorId,
      learnerId,
      instructorProfileId: instructorId,
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date('2020-01-01T00:00:00.000Z'),
      lastActivityAt: new Date('2020-01-01T00:00:00.000Z'),
      endedAt: null,
    });

    const db = (storage as unknown as { db: import('better-sqlite3').Database }).db;
    db.prepare(
      `INSERT INTO messages (id, session_id, sender, role, content, message_type, created_at)
       VALUES (?, ?, 'learner', 'learner', 'x', 'question', ?)`
    ).run('m_only', sessionId, new Date().toISOString());

    await storage.updateSession(sessionId, { messageIds: ['m_only'] });

    const before = db
      .prepare('SELECT COUNT(*) as n FROM session_messages WHERE session_id = ?')
      .get(sessionId) as { n: number };
    expect(before.n).toBe(1);

    await expect(
      storage.updateSession(sessionId, { messageIds: ['m_only', 'm_only'] })
    ).rejects.toThrow();

    const after = db
      .prepare('SELECT COUNT(*) as n FROM session_messages WHERE session_id = ?')
      .get(sessionId) as { n: number };
    expect(after.n).toBe(1);

    storage.close();
  });

  it('saveSession keeps prior session_messages when junction insert fails (atomic replace)', async () => {
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

    const sessionId = 'sess_save_tx';
    const instructorId = 'inst_s';
    const learnerId = 'learner_s';

    await storage.saveSession({
      id: sessionId,
      instructorId,
      learnerId,
      instructorProfileId: instructorId,
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date('2020-01-01T00:00:00.000Z'),
      lastActivityAt: new Date('2020-01-01T00:00:00.000Z'),
      endedAt: null,
    });

    const db = (storage as unknown as { db: import('better-sqlite3').Database }).db;
    db.prepare(
      `INSERT INTO messages (id, session_id, sender, role, content, message_type, created_at)
       VALUES (?, ?, 'learner', 'learner', 'x', 'question', ?)`
    ).run('a', sessionId, new Date().toISOString());

    await storage.updateSession(sessionId, { messageIds: ['a'] });

    expect(
      (db
        .prepare('SELECT COUNT(*) as n FROM session_messages WHERE session_id = ?')
        .get(sessionId) as { n: number }).n
    ).toBe(1);

    await expect(
      storage.saveSession({
        id: sessionId,
        instructorId,
        learnerId,
        instructorProfileId: instructorId,
        subject: 'S2',
        topic: 'T2',
        learningObjective: 'L2',
        sessionState: 'active',
        messageIds: ['a', 'a'],
        startedAt: new Date('2020-01-01T00:00:00.000Z'),
        lastActivityAt: new Date('2020-01-02T00:00:00.000Z'),
        endedAt: null,
      })
    ).rejects.toThrow();

    expect(
      (db
        .prepare('SELECT COUNT(*) as n FROM session_messages WHERE session_id = ?')
        .get(sessionId) as { n: number }).n
    ).toBe(1);

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
