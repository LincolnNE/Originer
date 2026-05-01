import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

describe('DatabaseStorageAdapter.loadMessages', () => {
  it('returns messages in the order of the requested id list, not created_at', async () => {
    const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    const sqlite = (db as any).db as import('better-sqlite3').Database;

    const sessionId = 'sess_order';
    const sameTime = new Date('2026-01-01T12:00:00.000Z').toISOString();

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
        sameTime,
        sameTime,
        null
      );

    const insertMsg = sqlite.prepare(`
      INSERT INTO messages (id, session_id, sender, role, content, message_type, teaching_metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertMsg.run('msg_first', sessionId, 'learner', 'learner', 'first', 'question', null, sameTime);
    insertMsg.run('msg_second', sessionId, 'ai', 'instructor', 'second', 'guidance', null, sameTime);

    const ordered = await db.loadMessages(['msg_second', 'msg_first']);
    expect(ordered.map(m => m.id)).toEqual(['msg_second', 'msg_first']);

    const reverse = await db.loadMessages(['msg_first', 'msg_second']);
    expect(reverse.map(m => m.id)).toEqual(['msg_first', 'msg_second']);

    db.close();
  });
});
