import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message } from '../backend/core/types';

describe('DatabaseStorageAdapter.loadMessages', () => {
  it('returns messages in the order of the requested ids, not by created_at', async () => {
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    const sameTime = new Date('2020-01-01T00:00:00.000Z');
    const sessionId = 'sess_test';
    const instructorId = 'inst_test';
    const learnerId = 'learner_test';

    await storage.createInstructor({ id: instructorId, name: 'Test' });
    await storage.createLearner({ id: learnerId, name: 'Test Learner' });
    await storage.saveSession({
      id: sessionId,
      instructorId,
      learnerId,
      instructorProfileId: instructorId,
      subject: 's',
      topic: 't',
      learningObjective: 'l',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    });

    const a: Message = {
      id: 'msg_a',
      sessionId,
      role: 'learner',
      content: 'first in session list',
      messageType: 'question',
      timestamp: sameTime,
    };
    const b: Message = {
      id: 'msg_b',
      sessionId,
      role: 'instructor',
      content: 'second in session list',
      messageType: 'guidance',
      timestamp: sameTime,
    };

    await storage.saveMessage(a);
    await storage.saveMessage(b);

    const forward = await storage.loadMessages(['msg_a', 'msg_b']);
    expect(forward.map((m) => m.id)).toEqual(['msg_a', 'msg_b']);
    expect(forward[0]!.content).toBe('first in session list');

    const reverse = await storage.loadMessages(['msg_b', 'msg_a']);
    expect(reverse.map((m) => m.id)).toEqual(['msg_b', 'msg_a']);
    expect(reverse[0]!.content).toBe('second in session list');

    storage.close();
  });
});
