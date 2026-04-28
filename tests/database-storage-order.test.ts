/**
 * Regression: loadMessages must preserve session message order (sequence_order),
 * not reorder by created_at.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

describe('DatabaseStorageAdapter.loadMessages', () => {
  it('returns messages in the order of messageIds, not by created_at', async () => {
    const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    await db.createInstructor({ id: 'i1', name: 'Test' });
    await db.createLearner({ id: 'l1', name: 'Learner' });

    const sessionId = 's_order_test';
    await db.saveSession({
      id: sessionId,
      instructorId: 'i1',
      learnerId: 'l1',
      instructorProfileId: 'i1',
      subject: '',
      topic: '',
      learningObjective: '',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    });

    const sameTime = new Date('2024-06-01T12:00:00.000Z');
    const mFirst = {
      id: 'm_first',
      sessionId,
      role: 'learner' as const,
      content: 'first',
      messageType: 'question' as const,
      timestamp: sameTime,
    };
    const mSecond = {
      id: 'm_second',
      sessionId,
      role: 'instructor' as const,
      content: 'second',
      messageType: 'guidance' as const,
      timestamp: sameTime,
    };

    await db.saveMessage(mSecond);
    await db.saveMessage(mFirst);

    await db.updateSession(sessionId, {
      messageIds: ['m_first', 'm_second'],
    });

    const ordered = await db.loadMessages(['m_first', 'm_second']);
    assert.deepStrictEqual(
      ordered.map((m) => m.id),
      ['m_first', 'm_second'],
      'same created_at must not reorder history'
    );

    const wrongChronoOrder = await db.loadMessages(['m_second', 'm_first']);
    assert.deepStrictEqual(wrongChronoOrder.map((m) => m.id), ['m_second', 'm_first']);
  });
});
