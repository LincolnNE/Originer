import { DatabaseStorageAdapter } from './database';
import type { Message, Session } from '../../core/types';

describe('DatabaseStorageAdapter.saveSession', () => {
  it('does not delete message rows when re-saving with foreign_keys enabled', async () => {
    const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

    await db.createInstructor({ id: 'inst_1', name: 'Instructor' });
    await db.createLearner({ id: 'learn_1', name: 'Learner' });

    const session: Session = {
      id: 'sess_1',
      instructorId: 'inst_1',
      learnerId: 'learn_1',
      instructorProfileId: 'inst_1',
      subject: 'Math',
      topic: 'Algebra',
      learningObjective: 'Practice',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    };

    await db.saveSession(session);

    const learnerMessage: Message = {
      id: 'msg_1',
      sessionId: session.id,
      role: 'learner',
      content: 'What is 2+2?',
      messageType: 'question',
      timestamp: new Date(),
    };

    await db.saveMessage(learnerMessage);
    await db.updateSession(session.id, {
      messageIds: [learnerMessage.id],
      lastActivityAt: new Date(),
    });

    const beforeResave = await db.loadSession(session.id);
    expect(beforeResave?.messageIds).toEqual([learnerMessage.id]);

    await db.saveSession(beforeResave!);

    const reloaded = await db.loadMessage(learnerMessage.id);
    expect(reloaded?.content).toBe('What is 2+2?');

    db.close();
  });
});
