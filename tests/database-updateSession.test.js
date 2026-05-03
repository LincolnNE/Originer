/**
 * Ensures session + session_messages stay consistent when updateSession
 * applies message ID changes together with session row updates (atomic transaction).
 */
const path = require('path');
const { DatabaseStorageAdapter } = require('../dist/backend/adapters/storage/database');

describe('DatabaseStorageAdapter.updateSession', () => {
  const dbPath = path.join(__dirname, `test-${process.pid}-${Date.now()}.sqlite`);
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

  it('persists messageIds and session fields together without losing junction rows', async () => {
    adapter = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: dbPath,
    });

    const sessionId = 'sess_test_1';
    const instId = 'inst_1';
    const learnerId = 'learner_1';

    await adapter.createInstructor({ id: instId, name: 'T' });
    await adapter.createLearner({ id: learnerId, name: 'L' });

    const startedAt = new Date('2026-01-01T00:00:00.000Z');
    const lastBefore = new Date('2026-01-01T01:00:00.000Z');
    const ts = new Date('2026-01-01T02:00:00.000Z');

    await adapter.saveSession({
      id: sessionId,
      instructorId: instId,
      learnerId: learnerId,
      instructorProfileId: instId,
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt,
      lastActivityAt: lastBefore,
      endedAt: null,
    });

    await adapter.saveMessage({
      id: 'm1',
      sessionId,
      role: 'learner',
      content: 'a',
      messageType: 'question',
      timestamp: ts,
    });
    await adapter.saveMessage({
      id: 'm2',
      sessionId,
      role: 'learner',
      content: 'b',
      messageType: 'question',
      timestamp: ts,
    });

    await adapter.updateSession(sessionId, {
      messageIds: ['m1', 'm2'],
    });

    await adapter.saveMessage({
      id: 'm3',
      sessionId,
      role: 'instructor',
      content: 'c',
      messageType: 'guidance',
      timestamp: ts,
    });

    const newActivity = new Date('2026-01-02T12:00:00.000Z');
    await adapter.updateSession(sessionId, {
      messageIds: ['m1', 'm2', 'm3'],
      lastActivityAt: newActivity,
      sessionState: 'active',
    });

    const loaded = await adapter.loadSession(sessionId);
    expect(loaded.messageIds).toEqual(['m1', 'm2', 'm3']);
    expect(loaded.lastActivityAt.toISOString()).toBe(newActivity.toISOString());
  });
});
