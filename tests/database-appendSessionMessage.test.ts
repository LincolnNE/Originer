import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

describe('DatabaseStorageAdapter.appendSessionMessage', () => {
  let db: DatabaseStorageAdapter;
  const sessionId = 'sess_test_atomic';

  beforeEach(async () => {
    db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    await db.saveSession({
      id: sessionId,
      instructorId: 'default',
      learnerId: 'default',
      instructorProfileId: 'default',
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date('2024-01-01T00:00:00Z'),
      lastActivityAt: new Date('2024-01-01T00:00:00Z'),
      endedAt: null,
    });
  });

  afterEach(() => {
    db.close();
  });

  it('persists message and session_messages row in one transaction', async () => {
    const t0 = new Date('2024-01-02T12:00:00Z');
    await db.appendSessionMessage(
      {
        id: 'msg_1',
        sessionId,
        role: 'learner',
        content: 'hello',
        messageType: 'question',
        timestamp: t0,
      },
      { lastActivityAt: new Date('2024-01-02T12:01:00Z') }
    );

    const session = await db.loadSession(sessionId);
    expect(session?.messageIds).toEqual(['msg_1']);
    expect(session?.lastActivityAt.toISOString()).toBe('2024-01-02T12:01:00.000Z');

    const rows = await db.loadMessages(['msg_1']);
    expect(rows).toHaveLength(1);
    expect(rows[0].content).toBe('hello');
  });

  it('appends multiple messages in order without full junction replace', async () => {
    await db.appendSessionMessage({
      id: 'msg_a',
      sessionId,
      role: 'learner',
      content: 'a',
      messageType: 'question',
      timestamp: new Date(),
    });
    await db.appendSessionMessage({
      id: 'msg_b',
      sessionId,
      role: 'instructor',
      content: 'b',
      messageType: 'guidance',
      timestamp: new Date(),
    });

    const session = await db.loadSession(sessionId);
    expect(session?.messageIds).toEqual(['msg_a', 'msg_b']);
  });
});
