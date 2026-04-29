import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import { Message } from '../backend/core/types';

describe('DatabaseStorageAdapter', () => {
  it('loadMessages returns rows in the order of the input id list, not by created_at', async () => {
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    const instructorId = 'inst_a';
    const learnerId = 'learner_b';
    await storage.ensureInstructorForMvp(instructorId);
    await storage.ensureLearnerForMvp(learnerId);

    const sessionId = 'sess_test';
    await storage.saveSession({
      id: sessionId,
      instructorId,
      learnerId,
      instructorProfileId: instructorId,
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    });

    const older = new Date('2020-01-01T00:00:00.000Z');
    const newer = new Date('2024-01-01T00:00:00.000Z');

    const firstInConversation: Message = {
      id: 'msg_first',
      sessionId,
      role: 'learner',
      content: 'first',
      messageType: 'question',
      timestamp: newer,
    };
    const secondInConversation: Message = {
      id: 'msg_second',
      sessionId,
      role: 'instructor',
      content: 'second',
      messageType: 'guidance',
      timestamp: older,
    };

    await storage.saveMessage(firstInConversation);
    await storage.saveMessage(secondInConversation);

    const ordered = await storage.loadMessages(['msg_first', 'msg_second']);
    expect(ordered.map(m => m.id)).toEqual(['msg_first', 'msg_second']);

    const wrongIfByCreated = await storage.loadMessages(['msg_second', 'msg_first']);
    expect(wrongIfByCreated.map(m => m.id)).toEqual(['msg_second', 'msg_first']);

    storage.close();
  });
});
