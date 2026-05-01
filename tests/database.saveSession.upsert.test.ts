import Database from 'better-sqlite3';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Session } from '../backend/core/types';

function baseSession(overrides: Partial<Session> = {}): Session {
  const now = new Date();
  return {
    id: 'sess_test_1',
    instructorId: 'inst_1',
    learnerId: 'learner_1',
    instructorProfileId: 'inst_1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: now,
    lastActivityAt: now,
    endedAt: null,
    ...overrides,
  };
}

describe('DatabaseStorageAdapter.saveSession with foreign_keys=ON', () => {
  it('does not delete child messages when saving the same session twice', async () => {
    const raw = new Database(':memory:');
    raw.pragma('foreign_keys = ON');
    raw.exec(`
      CREATE TABLE instructors (id VARCHAR PRIMARY KEY, name VARCHAR NOT NULL, bio TEXT, tone VARCHAR);
      CREATE TABLE learners (id VARCHAR PRIMARY KEY, name VARCHAR NOT NULL, level VARCHAR);
      CREATE TABLE sessions (
        id VARCHAR PRIMARY KEY,
        instructor_id VARCHAR NOT NULL,
        learner_id VARCHAR NOT NULL,
        instructor_profile_id VARCHAR,
        subject VARCHAR,
        topic VARCHAR,
        learning_objective TEXT,
        session_state VARCHAR DEFAULT 'active',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        FOREIGN KEY (instructor_id) REFERENCES instructors(id),
        FOREIGN KEY (learner_id) REFERENCES learners(id)
      );
      CREATE TABLE messages (
        id VARCHAR PRIMARY KEY,
        session_id VARCHAR NOT NULL,
        sender VARCHAR NOT NULL,
        role VARCHAR NOT NULL,
        content VARCHAR NOT NULL,
        message_type VARCHAR,
        teaching_metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );
      CREATE TABLE session_messages (
        session_id VARCHAR NOT NULL,
        message_id VARCHAR NOT NULL,
        sequence_order INTEGER NOT NULL,
        PRIMARY KEY (session_id, message_id),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (message_id) REFERENCES messages(id)
      );
    `);
    raw.prepare('INSERT INTO instructors (id, name, tone) VALUES (?,?,?)').run('inst_1', 'I', 'friendly');
    raw.prepare('INSERT INTO learners (id, name, level) VALUES (?,?,?)').run('learner_1', 'L', 'beginner');

    const adapter = Object.create(DatabaseStorageAdapter.prototype) as DatabaseStorageAdapter;
    (adapter as any).db = raw;

    const session = baseSession();
    await adapter.saveSession(session);

    const msgId = 'msg_1';
    raw
      .prepare(
        `INSERT INTO messages (id, session_id, sender, role, content, message_type, created_at)
         VALUES (?,?,?,?,?,?,?)`
      )
      .run(msgId, session.id, 'learner', 'learner', 'hello', 'question', new Date().toISOString());
    raw
      .prepare('INSERT INTO session_messages (session_id, message_id, sequence_order) VALUES (?,?,?)')
      .run(session.id, msgId, 0);

    await adapter.saveSession({
      ...session,
      messageIds: [msgId],
      lastActivityAt: new Date(),
    });

    const count = raw.prepare('SELECT COUNT(*) as c FROM messages WHERE session_id = ?').get(session.id) as {
      c: number;
    };
    expect(count.c).toBe(1);

    raw.close();
  });
});
