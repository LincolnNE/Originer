import { describe, it, expect, beforeEach } from '@jest/globals';
import { DatabaseStorageAdapter } from './database';

describe('DatabaseStorageAdapter.loadMessages', () => {
  let adapter: DatabaseStorageAdapter;

  beforeEach(() => {
    adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  });

  it('returns messages in the order of messageIds, not substring order', async () => {
    const sessionId = 'sess_order_test';
    await adapter.ensureParticipantRowsForSession('default', 'learner_order');
    await adapter.saveSession({
      id: sessionId,
      instructorId: 'default',
      learnerId: 'learner_order',
      instructorProfileId: 'default',
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    });

    const base = new Date('2020-01-01T00:00:00.000Z');
    const mk = (id: string, offsetMs: number) => ({
      id,
      sessionId,
      role: 'learner' as const,
      content: id,
      messageType: 'question' as const,
      timestamp: new Date(base.getTime() + offsetMs),
    });

    // Deliberately save "longer" id first so created_at order differs from id order.
    await adapter.saveMessage(mk('msg_10', 0));
    await adapter.saveMessage(mk('msg_1', 1000));

    const loaded = await adapter.loadMessages(['msg_1', 'msg_10']);
    expect(loaded.map(m => m.id)).toEqual(['msg_1', 'msg_10']);
  });
});
