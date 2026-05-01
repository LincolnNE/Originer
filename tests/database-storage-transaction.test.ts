import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Session } from '../backend/core/types';

function mkSession(overrides: Partial<Session> = {}): Session {
  const now = new Date();
  return {
    id: 'sess_test_1',
    instructorId: 'inst_1',
    learnerId: 'learner_1',
    instructorProfileId: 'inst_1',
    subject: 'General',
    topic: 'Intro',
    learningObjective: 'Learn',
    sessionState: 'active',
    messageIds: [],
    startedAt: now,
    lastActivityAt: now,
    endedAt: null,
    ...overrides,
  };
}

describe('DatabaseStorageAdapter transactions', () => {
  let dbFile: string;
  let adapter: DatabaseStorageAdapter;

  beforeEach(() => {
    dbFile = path.join(os.tmpdir(), `originer-test-${Date.now()}.sqlite`);
    adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: dbFile });
    void adapter.createInstructor({ id: 'inst_1', name: 'Test Instructor' });
    void adapter.createLearner({ id: 'learner_1', name: 'Test Learner' });
  });

  afterEach(() => {
    adapter.close();
    try {
      fs.unlinkSync(dbFile);
    } catch {
      // ignore
    }
  });

  it('rolls back junction + session row updates when messageIds insert fails', async () => {
    const session = mkSession();
    await adapter.saveSession(session);

    await adapter.saveMessage({
      id: 'msg_a',
      sessionId: session.id,
      role: 'learner',
      content: 'hello',
      messageType: 'question',
      timestamp: new Date(),
    });

    await adapter.updateSession(session.id, {
      messageIds: ['msg_a'],
      lastActivityAt: new Date('2020-01-02T00:00:00.000Z'),
    });

    const before = await adapter.loadSession(session.id);
    expect(before?.messageIds).toEqual(['msg_a']);
    expect(before?.lastActivityAt.toISOString()).toBe('2020-01-02T00:00:00.000Z');

    await expect(
      adapter.updateSession(session.id, {
        messageIds: ['msg_a', 'msg_a'],
        lastActivityAt: new Date('2030-06-15T12:00:00.000Z'),
      })
    ).rejects.toThrow();

    const after = await adapter.loadSession(session.id);
    expect(after?.messageIds).toEqual(['msg_a']);
    expect(after?.lastActivityAt.toISOString()).toBe('2020-01-02T00:00:00.000Z');
  });

  it('rolls back full saveSession when junction insert fails', async () => {
    const session = mkSession({ messageIds: [] });
    await adapter.saveSession(session);

    await adapter.saveMessage({
      id: 'msg_x',
      sessionId: session.id,
      role: 'learner',
      content: 'x',
      messageType: 'question',
      timestamp: new Date(),
    });

    await expect(
      adapter.saveSession({
        ...session,
        messageIds: ['msg_x', 'msg_x'],
      })
    ).rejects.toThrow();

    const loaded = await adapter.loadSession(session.id);
    expect(loaded?.messageIds).toEqual([]);
  });

  it('loadMessages returns rows in session messageIds order, not created_at', async () => {
    const session = mkSession();
    await adapter.saveSession(session);

    const t = new Date('2024-01-01T12:00:00.000Z');
    await adapter.saveMessage({
      id: 'msg_first',
      sessionId: session.id,
      role: 'learner',
      content: 'first',
      messageType: 'question',
      timestamp: t,
    });
    await adapter.saveMessage({
      id: 'msg_second',
      sessionId: session.id,
      role: 'instructor',
      content: 'second',
      messageType: 'guidance',
      timestamp: new Date(t.getTime() - 60_000),
    });

    await adapter.updateSession(session.id, {
      messageIds: ['msg_second', 'msg_first'],
    });

    const messages = await adapter.loadMessages(['msg_second', 'msg_first']);
    expect(messages.map(m => m.id)).toEqual(['msg_second', 'msg_first']);
  });
});
