import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Session } from '../backend/core/types';

describe('DatabaseStorageAdapter.loadMessages', () => {
  it('returns messages in messageIds order, not created_at order', async () => {
    const adapter = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: ':memory:',
    });

    await adapter.createInstructor({ id: 'inst_order', name: 'Instructor' });
    await adapter.createLearner({ id: 'learner_order', name: 'Learner' });

    const session: Session = {
      id: 'sess_order',
      instructorId: 'inst_order',
      learnerId: 'learner_order',
      instructorProfileId: 'inst_order',
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    };
    await adapter.saveSession(session);

    // m1 is stored with a later wall time; m2 is chronologically earlier.
    // ORDER BY created_at would yield [m2, m1]; transcript order must be [m1, m2].
    await adapter.saveMessage({
      id: 'm1',
      sessionId: session.id,
      role: 'learner',
      content: 'first-turn',
      messageType: 'question',
      timestamp: new Date('2025-06-02T12:00:00.000Z'),
    });
    await adapter.saveMessage({
      id: 'm2',
      sessionId: session.id,
      role: 'instructor',
      content: 'second-turn',
      messageType: 'guidance',
      timestamp: new Date('2025-06-01T12:00:00.000Z'),
    });

    const ordered = await adapter.loadMessages(['m1', 'm2']);
    expect(ordered.map(m => m.content)).toEqual(['first-turn', 'second-turn']);

    adapter.close();
  });

  it('omits unknown ids and preserves order for the rest', async () => {
    const adapter = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: ':memory:',
    });

    await adapter.createInstructor({ id: 'inst2', name: 'I' });
    await adapter.createLearner({ id: 'learner2', name: 'L' });

    const session: Session = {
      id: 'sess2',
      instructorId: 'inst2',
      learnerId: 'learner2',
      instructorProfileId: 'inst2',
      subject: '',
      topic: '',
      learningObjective: '',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    };
    await adapter.saveSession(session);

    await adapter.saveMessage({
      id: 'a',
      sessionId: session.id,
      role: 'learner',
      content: 'A',
      messageType: 'question',
      timestamp: new Date(),
    });

    const out = await adapter.loadMessages(['missing', 'a', 'also-missing']);
    expect(out.map(m => m.id)).toEqual(['a']);

    adapter.close();
  });
});
