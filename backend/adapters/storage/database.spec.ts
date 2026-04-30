import { DatabaseStorageAdapter } from './database';
import type { Session } from '../../core/types';

describe('DatabaseStorageAdapter session/message persistence', () => {
  let adapter: DatabaseStorageAdapter;

  beforeEach(() => {
    adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  });

  afterEach(() => {
    adapter.close();
  });

  it('saveSession persists message link order atomically', async () => {
    await adapter.createInstructor({ id: 'inst_1', name: 'Test' });
    await adapter.createLearner({ id: 'lrn_1', name: 'Learner' });

    const session: Session = {
      id: 'sess_1',
      instructorId: 'inst_1',
      learnerId: 'lrn_1',
      instructorProfileId: 'inst_1',
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date('2024-01-01T00:00:00.000Z'),
      lastActivityAt: new Date('2024-01-01T00:00:00.000Z'),
      endedAt: null,
    };

    await adapter.saveSession(session);

    await adapter.saveMessage({
      id: 'msg_a',
      sessionId: 'sess_1',
      role: 'learner',
      content: 'first',
      messageType: 'question',
      timestamp: new Date('2024-01-01T00:01:00.000Z'),
    });
    await adapter.saveMessage({
      id: 'msg_b',
      sessionId: 'sess_1',
      role: 'instructor',
      content: 'second',
      messageType: 'guidance',
      timestamp: new Date('2024-01-01T00:02:00.000Z'),
    });

    await adapter.saveSession({ ...session, messageIds: ['msg_a', 'msg_b'] });

    const loaded = await adapter.loadSession('sess_1');
    expect(loaded?.messageIds).toEqual(['msg_a', 'msg_b']);
  });

  it('updateSession replaces messageIds in one transaction', async () => {
    await adapter.createInstructor({ id: 'inst_1', name: 'Test' });
    await adapter.createLearner({ id: 'lrn_1', name: 'Learner' });

    const session: Session = {
      id: 'sess_2',
      instructorId: 'inst_1',
      learnerId: 'lrn_1',
      instructorProfileId: 'inst_1',
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date('2024-01-01T00:00:00.000Z'),
      lastActivityAt: new Date('2024-01-01T00:00:00.000Z'),
      endedAt: null,
    };

    await adapter.saveSession(session);

    await adapter.saveMessage({
      id: 'm1',
      sessionId: 'sess_2',
      role: 'learner',
      content: 'a',
      messageType: 'question',
      timestamp: new Date(),
    });

    await adapter.updateSession('sess_2', { messageIds: ['m1'], lastActivityAt: new Date('2024-01-02T00:00:00.000Z') });

    const loaded = await adapter.loadSession('sess_2');
    expect(loaded?.messageIds).toEqual(['m1']);
    expect(loaded?.lastActivityAt.toISOString()).toBe('2024-01-02T00:00:00.000Z');
  });
});
