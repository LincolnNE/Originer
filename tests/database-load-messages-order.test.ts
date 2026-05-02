/**
 * Regression: loadMessages must return rows in session message order (messageIds),
 * not sorted by created_at. Wrong order breaks LLM prompt context.
 */

import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

describe('DatabaseStorageAdapter.loadMessages', () => {
  it('preserves messageIds order even when created_at differs', async () => {
    const adapter = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: ':memory:',
    });

    await adapter.createInstructor({ id: 'inst_1', name: 'Test Instructor' });
    await adapter.createLearner({ id: 'learn_1', name: 'Test Learner' });

    const sessionId = 'sess_test';
    await adapter.saveSession({
      id: sessionId,
      instructorId: 'inst_1',
      learnerId: 'learn_1',
      instructorProfileId: 'inst_1',
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date('2026-01-01T00:00:00Z'),
      lastActivityAt: new Date('2026-01-01T00:00:00Z'),
      endedAt: null,
    });

    const older = new Date('2026-01-01T10:00:00Z');
    const newer = new Date('2026-01-01T12:00:00Z');

    await adapter.saveMessage({
      id: 'msg_second',
      sessionId,
      role: 'learner',
      content: 'second in conversation',
      messageType: 'question',
      timestamp: newer,
    });

    await adapter.saveMessage({
      id: 'msg_first',
      sessionId,
      role: 'instructor',
      content: 'first in conversation',
      messageType: 'guidance',
      timestamp: older,
    });

    const orderedIds = ['msg_second', 'msg_first'];
    await adapter.updateSession(sessionId, { messageIds: orderedIds });

    const messages = await adapter.loadMessages(orderedIds);

    expect(messages.map(m => m.id)).toEqual(orderedIds);
    expect(messages[0].content).toBe('second in conversation');
    expect(messages[1].content).toBe('first in conversation');

    adapter.close();
  });
});
