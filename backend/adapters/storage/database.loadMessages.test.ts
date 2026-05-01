import { DatabaseStorageAdapter } from './database';
import type { Session } from '../../core/types';

describe('DatabaseStorageAdapter.loadMessages', () => {
  it('returns messages in session messageIds order, not created_at order', async () => {
    const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    try {
      await db.createInstructor({ id: 'inst_loadmsg', name: 'Instructor' });
      await db.createLearner({ id: 'learner_loadmsg', name: 'Learner' });

      const sessionId = 'sess_loadmsg_order';
      const session: Session = {
        id: sessionId,
        instructorId: 'inst_loadmsg',
        learnerId: 'learner_loadmsg',
        instructorProfileId: 'inst_loadmsg',
        subject: 's',
        topic: 't',
        learningObjective: 'lo',
        sessionState: 'active',
        messageIds: [],
        startedAt: new Date('2020-01-01T00:00:00.000Z'),
        lastActivityAt: new Date('2020-01-01T00:00:00.000Z'),
        endedAt: null,
      };
      await db.saveSession(session);

      const sameInstant = new Date('2026-05-01T12:00:00.000Z');
      await db.saveMessage({
        id: 'msg_first',
        sessionId,
        role: 'learner',
        content: 'first-turn',
        messageType: 'question',
        timestamp: sameInstant,
      });
      await db.saveMessage({
        id: 'msg_second',
        sessionId,
        role: 'instructor',
        content: 'second-turn',
        messageType: 'guidance',
        timestamp: sameInstant,
      });

      await db.updateSession(sessionId, { messageIds: ['msg_first', 'msg_second'] });

      const loaded = await db.loadMessages(['msg_first', 'msg_second']);
      expect(loaded.map((m) => m.content)).toEqual(['first-turn', 'second-turn']);
    } finally {
      db.close();
    }
  });
});
