import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message } from '../backend/core/types';

describe('DatabaseStorageAdapter.loadMessages', () => {
  it('returns messages in the same order as messageIds (not created_at)', async () => {
    const adapter = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: ':memory:',
    });

    await adapter.createInstructor({ id: 'inst_1', name: 'Test Instructor' });
    await adapter.createLearner({ id: 'learner_1', name: 'Test Learner' });

    const sessionId = 'sess_test';
    await adapter.saveSession({
      id: sessionId,
      instructorId: 'inst_1',
      learnerId: 'learner_1',
      instructorProfileId: 'inst_1',
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date('2020-01-01T00:00:00.000Z'),
      lastActivityAt: new Date('2020-01-01T00:00:00.000Z'),
      endedAt: null,
    });

    const base: Omit<Message, 'id' | 'content' | 'timestamp'> = {
      sessionId,
      role: 'learner',
      messageType: 'question',
    };

    const msgA: Message = {
      ...base,
      id: 'msg_a',
      content: 'first in thread',
      timestamp: new Date('2020-01-02T12:00:00.000Z'),
    };
    const msgB: Message = {
      ...base,
      id: 'msg_b',
      content: 'second in thread',
      timestamp: new Date('2020-01-01T12:00:00.000Z'),
    };

    await adapter.saveMessage(msgA);
    await adapter.saveMessage(msgB);

    const orderedIds = ['msg_a', 'msg_b'];
    await adapter.updateSession(sessionId, { messageIds: orderedIds });

    const loaded = await adapter.loadMessages(orderedIds);

    expect(loaded.map(m => m.id)).toEqual(orderedIds);
    expect(loaded[0].content).toBe('first in thread');
    expect(loaded[1].content).toBe('second in thread');

    adapter.close();
  });
});
