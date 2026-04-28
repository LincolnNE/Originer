/**
 * Ensures saveSession() does not break SQLite FKs when a session already has
 * message rows (INSERT OR REPLACE on sessions can orphan messages when CASCADE
 * is enabled, then session_messages insert fails).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseStorageAdapter } from '../../backend/adapters/storage/database';
import { Session } from '../../backend/core/types';

test('saveSession can run twice on a session with messages (FK-safe)', async () => {
  const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const base: Session = {
    id: 'sess_fk_1',
    instructorId: 'inst_fk_1',
    learnerId: 'learner_fk_1',
    instructorProfileId: 'inst_fk_1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
    lastActivityAt: new Date('2026-01-01T00:00:00.000Z'),
    endedAt: null,
  };

  await storage.saveSession(base);

  await storage.saveMessage({
    id: 'msg_fk_1',
    sessionId: base.id,
    role: 'learner',
    content: 'hello',
    messageType: 'question',
    timestamp: new Date('2026-01-01T00:01:00.000Z'),
  });
  await storage.updateSession(base.id, { messageIds: ['msg_fk_1'] });

  await assert.doesNotReject(() =>
    storage.saveSession({
      ...base,
      messageIds: ['msg_fk_1'],
      lastActivityAt: new Date('2026-01-01T00:02:00.000Z'),
    })
  );

  const row = (storage as any).db
    .prepare('SELECT COUNT(*) as c FROM messages WHERE session_id = ?')
    .get(base.id) as { c: number };
  assert.equal(row.c, 1, 'message row must remain linked to the session');
});
