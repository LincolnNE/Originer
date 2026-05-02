import { DatabaseStorageAdapter } from './database';

describe('DatabaseStorageAdapter.loadMessages', () => {
  it('returns messages in the order of messageIds, not by created_at', async () => {
    const adapter = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: ':memory:',
    });

    await adapter.createInstructor({ id: 'inst_order_test', name: 'T' });
    await adapter.createLearner({ id: 'learn_order_test', name: 'L' });

    const sessionId = 'sess_order_test';
    await adapter.saveSession({
      id: sessionId,
      instructorId: 'inst_order_test',
      learnerId: 'learn_order_test',
      instructorProfileId: 'inst_order_test',
      subject: 'S',
      topic: 'T',
      learningObjective: 'O',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    });

    const firstInConversation = 'msg_first';
    const secondInConversation = 'msg_second';

    await adapter.saveMessage({
      id: firstInConversation,
      sessionId,
      role: 'learner',
      content: 'first turn',
      messageType: 'question',
      timestamp: new Date('2026-02-04T12:00:02.000Z'),
    });

    await adapter.saveMessage({
      id: secondInConversation,
      sessionId,
      role: 'instructor',
      content: 'second turn',
      messageType: 'guidance',
      timestamp: new Date('2026-02-04T12:00:01.000Z'),
    });

    const ordered = await adapter.loadMessages([firstInConversation, secondInConversation]);

    expect(ordered.map(m => m.id)).toEqual([firstInConversation, secondInConversation]);
    expect(ordered.map(m => m.content)).toEqual(['first turn', 'second turn']);

    adapter.close();
  });
});
