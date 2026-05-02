import { DatabaseStorageAdapter } from '../../../../backend/adapters/storage/database';
import type { Session } from '../../../../backend/core/types';

function baseSession(overrides: Partial<Session> = {}): Session {
  const id = `sess_test_${Date.now()}`;
  return {
    id,
    instructorId: 'inst_test',
    learnerId: 'learner_test',
    instructorProfileId: 'inst_test',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
    ...overrides,
  };
}

describe('DatabaseStorageAdapter session_messages integrity', () => {
  let adapter: DatabaseStorageAdapter;

  beforeEach(() => {
    adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  });

  afterEach(() => {
    adapter.close();
  });

  it('does not clear session_messages when saveSession validation fails', async () => {
    const session = baseSession();
    await adapter.saveSession(session);

    const msgId = 'msg_existing';
    await adapter.saveMessage({
      id: msgId,
      sessionId: session.id,
      role: 'learner',
      content: 'hello',
      messageType: 'question',
      timestamp: new Date(),
    });

    await adapter.updateSession(session.id, { messageIds: [msgId] });

    const badSession = { ...session, messageIds: ['msg_missing'] };
    await expect(adapter.saveSession(badSession)).rejects.toThrow(/message row missing/);

    const reloaded = await adapter.loadSession(session.id);
    expect(reloaded?.messageIds).toEqual([msgId]);
  });

  it('rolls back session_messages on updateSession when insert fails (duplicate message id)', async () => {
    const session = baseSession();
    await adapter.saveSession(session);

    const m1 = 'msg_1';
    const m2 = 'msg_2';
    for (const id of [m1, m2]) {
      await adapter.saveMessage({
        id,
        sessionId: session.id,
        role: 'learner',
        content: id,
        messageType: 'question',
        timestamp: new Date(),
      });
    }
    await adapter.updateSession(session.id, { messageIds: [m1, m2] });

    await expect(adapter.updateSession(session.id, { messageIds: [m1, m1] })).rejects.toThrow();

    const reloaded = await adapter.loadSession(session.id);
    expect(reloaded?.messageIds).toEqual([m1, m2]);
  });

  it('rolls back session_messages on saveSession when insert fails (duplicate message id)', async () => {
    const session = baseSession();
    await adapter.saveSession(session);

    const m1 = 'msg_1';
    await adapter.saveMessage({
      id: m1,
      sessionId: session.id,
      role: 'learner',
      content: 'x',
      messageType: 'question',
      timestamp: new Date(),
    });
    await adapter.updateSession(session.id, { messageIds: [m1] });

    await expect(
      adapter.saveSession({ ...session, messageIds: [m1, m1] })
    ).rejects.toThrow();

    const reloaded = await adapter.loadSession(session.id);
    expect(reloaded?.messageIds).toEqual([m1]);
  });
});
