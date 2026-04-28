import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import { Message } from '../backend/core/types';

describe('DatabaseStorageAdapter.loadMessages', () => {
  it('returns messages in session order, not created_at order', async () => {
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    const sessionId = 'sess_order_test';
    const sameTime = new Date('2026-01-01T12:00:00.000Z');

    await storage.createInstructor({ id: 'inst_1', name: 'Test Instructor' });
    await storage.createLearner({ id: 'learner_1', name: 'Test Learner' });

    await storage.saveSession({
      id: sessionId,
      instructorId: 'inst_1',
      learnerId: 'learner_1',
      instructorProfileId: 'inst_1',
      subject: 'Test',
      topic: 'Test',
      learningObjective: 'Test',
      sessionState: 'active',
      messageIds: [],
      startedAt: sameTime,
      lastActivityAt: sameTime,
      endedAt: null,
    });

    const m1: Message = {
      id: 'msg_a',
      sessionId,
      role: 'learner',
      content: 'first',
      messageType: 'question',
      timestamp: sameTime,
    };
    const m2: Message = {
      id: 'msg_b',
      sessionId,
      role: 'instructor',
      content: 'second',
      messageType: 'guidance',
      timestamp: sameTime,
    };

    await storage.saveMessage(m1);
    await storage.saveMessage(m2);

    // Session order is A then B; created_at ties would make ORDER BY created_at non-deterministic
    const messageIds = ['msg_a', 'msg_b'];
    const loaded = await storage.loadMessages(messageIds);

    expect(loaded.map((m) => m.content)).toEqual(['first', 'second']);
    storage.close();
  });
});
