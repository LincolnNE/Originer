import { DatabaseStorageAdapter } from './database';
import { Session } from '../../core/types';

describe('DatabaseStorageAdapter session_messages atomicity', () => {
  test('failed updateSession messageIds does not wipe prior junction rows (FK + transaction)', async () => {
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    await storage.createInstructor({ id: 'inst_fk', name: 'I' });
    await storage.createLearner({ id: 'learn_fk', name: 'L' });

    const sessionId = 'sess_fk_tx';
    const sess: Session = {
      id: sessionId,
      instructorId: 'inst_fk',
      learnerId: 'learn_fk',
      instructorProfileId: 'inst_fk',
      subject: 's',
      topic: 't',
      learningObjective: 'l',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    };
    await storage.saveSession(sess);

    await storage.saveMessage({
      id: 'msg_ok',
      sessionId,
      role: 'learner',
      content: 'hi',
      messageType: 'question',
      timestamp: new Date(),
    });

    await storage.updateSession(sessionId, { messageIds: ['msg_ok'] });
    let loaded = await storage.loadSession(sessionId);
    expect(loaded?.messageIds).toEqual(['msg_ok']);

    await expect(
      storage.updateSession(sessionId, {
        messageIds: ['msg_ok', 'msg_does_not_exist'],
      })
    ).rejects.toThrow();

    loaded = await storage.loadSession(sessionId);
    expect(loaded?.messageIds).toEqual(['msg_ok']);

    storage.close();
  });
});
