import Database from 'better-sqlite3';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message, Session } from '../backend/core/types';

function baseSession(overrides: Partial<Session> = {}): Session {
  const now = new Date();
  return {
    id: 'sess_test',
    instructorId: 'inst_a',
    learnerId: 'learn_a',
    instructorProfileId: 'inst_a',
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

function insertMessageRow(db: Database.Database, row: Message): void {
  db.prepare(
    `INSERT INTO messages (id, session_id, sender, role, content, message_type, teaching_metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    row.id,
    row.sessionId,
    row.role === 'instructor' ? 'ai' : 'learner',
    row.role,
    row.content,
    row.messageType,
    row.teachingMetadata ? JSON.stringify(row.teachingMetadata) : null,
    row.timestamp.toISOString()
  );
}

describe('DatabaseStorageAdapter session_messages integrity', () => {
  test('updateSession rolls back DELETE when INSERT violates FK (no silent truncation)', async () => {
    const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    const db = (adapter as unknown as { db: Database.Database }).db;

    const session = baseSession({ id: 'sess_1' });
    await adapter.saveSession(session);

    const m1: Message = {
      id: 'msg_1',
      sessionId: 'sess_1',
      role: 'learner',
      content: 'hi',
      messageType: 'question',
      timestamp: new Date(),
    };
    const m2: Message = {
      id: 'msg_2',
      sessionId: 'sess_1',
      role: 'instructor',
      content: 'hello',
      messageType: 'response',
      timestamp: new Date(),
    };
    insertMessageRow(db, m1);
    insertMessageRow(db, m2);

    await adapter.updateSession('sess_1', { messageIds: ['msg_1', 'msg_2'] });

    const rowsBefore = db
      .prepare('SELECT message_id FROM session_messages WHERE session_id = ? ORDER BY sequence_order')
      .all('sess_1') as Array<{ message_id: string }>;
    expect(rowsBefore.map(r => r.message_id)).toEqual(['msg_1', 'msg_2']);

    await expect(adapter.updateSession('sess_1', { messageIds: ['msg_1', 'msg_orphan'] })).rejects.toThrow();

    const rowsAfter = db
      .prepare('SELECT message_id FROM session_messages WHERE session_id = ? ORDER BY sequence_order')
      .all('sess_1') as Array<{ message_id: string }>;
    expect(rowsAfter.map(r => r.message_id)).toEqual(['msg_1', 'msg_2']);
  });
});
