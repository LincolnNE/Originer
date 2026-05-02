import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';

describe('DatabaseStorageAdapter.loadMessages', () => {
  it('returns messages in the same order as messageIds (junction order), not created_at', async () => {
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

    await storage.createInstructor({ id: 'inst_1', name: 'Instructor' });
    await storage.createLearner({ id: 'learn_1', name: 'Learner' });

    await storage.saveSession({
      id: 'sess_1',
      instructorId: 'inst_1',
      learnerId: 'learn_1',
      instructorProfileId: 'inst_1',
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    });

    const learnerMsg = {
      id: 'msg_learner',
      sessionId: 'sess_1',
      role: 'learner' as const,
      content: 'Question',
      messageType: 'question' as const,
      timestamp: new Date('2024-06-02T12:00:00.000Z'),
    };
    const instructorMsg = {
      id: 'msg_instructor',
      sessionId: 'sess_1',
      role: 'instructor' as const,
      content: 'Reply',
      messageType: 'guidance' as const,
      timestamp: new Date('2024-06-01T12:00:00.000Z'),
    };

    await storage.saveMessage(learnerMsg);
    await storage.saveMessage(instructorMsg);

    await storage.updateSession('sess_1', {
      messageIds: ['msg_learner', 'msg_instructor'],
    });

    const messages = await storage.loadMessages(['msg_learner', 'msg_instructor']);

    expect(messages.map(m => m.id)).toEqual(['msg_learner', 'msg_instructor']);

    storage.close();
  });
});
