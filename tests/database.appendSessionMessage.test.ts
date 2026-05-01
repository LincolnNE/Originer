import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

describe('DatabaseStorageAdapter.appendSessionMessage', () => {
  it('rolls back message insert when junction insert fails (no orphan without session link)', async () => {
    const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    const sqlite = (db as any).db as import('better-sqlite3').Database;

    const sessionId = 'sess_1';
    sqlite.prepare('INSERT INTO instructors (id, name, bio, tone) VALUES (?, ?, ?, ?)').run(
      'inst_1',
      'Instructor',
      null,
      'friendly'
    );
    sqlite.prepare('INSERT INTO learners (id, name, level) VALUES (?, ?, ?)').run(
      'learn_1',
      'Learner',
      'beginner'
    );
    sqlite
      .prepare(
        `INSERT INTO sessions (id, instructor_id, learner_id, instructor_profile_id, subject, topic, learning_objective, session_state, started_at, last_activity_at, ended_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        sessionId,
        'inst_1',
        'learn_1',
        'inst_1',
        'S',
        'T',
        'LO',
        'active',
        new Date().toISOString(),
        new Date().toISOString(),
        null
      );

    const goodMsg = {
      id: 'msg_good',
      sessionId,
      role: 'learner' as const,
      content: 'hi',
      messageType: 'question' as const,
      timestamp: new Date(),
    };

    await db.appendSessionMessage(sessionId, goodMsg, [goodMsg.id]);

    const badMsg = {
      id: 'msg_bad',
      sessionId,
      role: 'learner' as const,
      content: 'x',
      messageType: 'question' as const,
      timestamp: new Date(),
    };

    await expect(
      db.appendSessionMessage(sessionId, badMsg, [goodMsg.id, badMsg.id, goodMsg.id])
    ).rejects.toThrow();

    const row = sqlite.prepare('SELECT id FROM messages WHERE id = ?').get(badMsg.id);
    expect(row).toBeUndefined();

    const loaded = await db.loadSession(sessionId);
    expect(loaded?.messageIds).toEqual([goodMsg.id]);

    db.close();
  });
});
