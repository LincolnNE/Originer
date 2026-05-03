/**
 * saveSession rewrites sessions + session_messages; without a single transaction,
 * a failure after updating sessions could orphan or truncate junction data.
 * Foreign keys must be on so invalid message_ids fail the whole transaction.
 */
const path = require('path');
const { DatabaseStorageAdapter } = require('../dist/backend/adapters/storage/database');

describe('DatabaseStorageAdapter.saveSession', () => {
  const dbPath = path.join(__dirname, `save-sess-${process.pid}-${Date.now()}.sqlite`);
  let adapter;

  afterEach(() => {
    if (adapter) {
      try {
        adapter.close();
      } catch {
        // ignore
      }
      adapter = undefined;
    }
    try {
      require('fs').unlinkSync(dbPath);
    } catch {
      // ignore
    }
  });

  it('rolls back the whole write when session_messages insert violates FK', async () => {
    adapter = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: dbPath,
    });

    const sessionId = 'sess_save_txn';
    const instId = 'inst_save';
    const learnerId = 'learner_save';

    await adapter.createInstructor({ id: instId, name: 'T' });
    await adapter.createLearner({ id: learnerId, name: 'L' });

    const startedAt = new Date('2026-03-01T00:00:00.000Z');
    const activity = new Date('2026-03-01T01:00:00.000Z');

    await adapter.saveSession({
      id: sessionId,
      instructorId: instId,
      learnerId: learnerId,
      instructorProfileId: instId,
      subject: 'original',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt,
      lastActivityAt: activity,
      endedAt: null,
    });

    await expect(
      adapter.saveSession({
        id: sessionId,
        instructorId: instId,
        learnerId: learnerId,
        instructorProfileId: instId,
        subject: 'should-not-persist',
        topic: 'T',
        learningObjective: 'L',
        sessionState: 'active',
        messageIds: ['no_such_message_row'],
        startedAt,
        lastActivityAt: activity,
        endedAt: null,
      })
    ).rejects.toThrow();

    const loaded = await adapter.loadSession(sessionId);
    expect(loaded.subject).toBe('original');
    expect(loaded.messageIds).toEqual([]);
  });
});
