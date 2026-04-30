/**
 * Regression: conversation history must follow session.messageIds order,
 * not SQL ORDER BY created_at (timestamps can be equal or not reflect turn order).
 */

import { DatabaseStorageAdapter } from '../../backend/adapters/storage/database';
import type { Session } from '../../backend/core/types';

describe('DatabaseStorageAdapter.loadMessages', () => {
  let storage: DatabaseStorageAdapter;

  beforeEach(() => {
    storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  });

  afterEach(() => {
    storage.close();
  });

  it('returns messages in the order of messageIds, not created_at', async () => {
    await storage.createInstructor({ id: 'inst_1', name: 'Instructor' });
    await storage.createLearner({ id: 'learn_1', name: 'Learner' });

    const session: Session = {
      id: 'sess_1',
      instructorId: 'inst_1',
      learnerId: 'learn_1',
      instructorProfileId: 'inst_1',
      subject: 'Math',
      topic: 'Fractions',
      learningObjective: 'Practice',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date('2026-01-15T10:00:00.000Z'),
      lastActivityAt: new Date('2026-01-15T10:00:00.000Z'),
      endedAt: null,
    };
    await storage.saveSession(session);

    const sameInstant = new Date('2026-01-15T10:00:01.000Z');

    const msgLearner = {
      id: 'msg_learner',
      sessionId: session.id,
      role: 'learner' as const,
      content: 'Learner turn',
      messageType: 'question' as const,
      timestamp: sameInstant,
    };
    const msgInstructor = {
      id: 'msg_instructor',
      sessionId: session.id,
      role: 'instructor' as const,
      content: 'Instructor reply',
      messageType: 'guidance' as const,
      timestamp: sameInstant,
    };

    await storage.saveMessage(msgInstructor);
    await storage.saveMessage(msgLearner);

    const sessionOrderIds = ['msg_instructor', 'msg_learner'];
    await storage.updateSession(session.id, { messageIds: sessionOrderIds });

    const loaded = await storage.loadMessages(sessionOrderIds);

    expect(loaded.map(m => m.id)).toEqual(['msg_instructor', 'msg_learner']);
    expect(loaded[0].content).toBe('Instructor reply');
    expect(loaded[1].content).toBe('Learner turn');
  });
});
