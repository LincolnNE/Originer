import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message } from '../backend/core/types';

describe('DatabaseStorageAdapter.loadMessages', () => {
  it('preserves messageIds order instead of sorting by created_at', async () => {
    const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    const sessionId = 'sess_test';
    const instructorId = 'inst_test';
    const learnerId = 'learner_test';
    const sameInstant = new Date('2026-01-01T00:00:00.000Z');

    await db.createInstructor({ id: instructorId, name: 'Test Instructor' });
    await db.createLearner({ id: learnerId, name: 'Test Learner' });

    await db.saveSession({
      id: sessionId,
      instructorId,
      learnerId,
      instructorProfileId: instructorId,
      subject: 'Test',
      topic: 'Test',
      learningObjective: 'Test',
      sessionState: 'active',
      messageIds: [],
      startedAt: sameInstant,
      lastActivityAt: sameInstant,
      endedAt: null,
    });

    const learnerMsg: Message = {
      id: 'msg_learner',
      sessionId,
      role: 'learner',
      content: 'Question from learner',
      messageType: 'question',
      timestamp: sameInstant,
    };
    const instructorMsg: Message = {
      id: 'msg_instructor',
      sessionId,
      role: 'instructor',
      content: 'Reply from instructor',
      messageType: 'guidance',
      timestamp: sameInstant,
    };

    await db.saveMessage(learnerMsg);
    await db.saveMessage(instructorMsg);

    const reversed = await db.loadMessages(['msg_instructor', 'msg_learner']);
    expect(reversed.map((m) => m.id)).toEqual(['msg_instructor', 'msg_learner']);
    expect(reversed.map((m) => m.content)).toEqual([
      'Reply from instructor',
      'Question from learner',
    ]);

    const chronological = await db.loadMessages(['msg_learner', 'msg_instructor']);
    expect(chronological.map((m) => m.id)).toEqual(['msg_learner', 'msg_instructor']);

    db.close();
  });
});
