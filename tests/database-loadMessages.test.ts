import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message } from '../backend/core/types';

describe('DatabaseStorageAdapter.loadMessages', () => {
  it('returns messages in the order of the requested id array, not by created_at', async () => {
    const db = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: ':memory:',
    });

    await db.createInstructor({ id: 'inst_order_test', name: 'T' });
    await db.createLearner({ id: 'learn_order_test', name: 'L' });

    const sessionId = 'sess_order_test';
    await db.saveSession({
      id: sessionId,
      instructorId: 'inst_order_test',
      learnerId: 'learn_order_test',
      instructorProfileId: 'inst_order_test',
      subject: 'S',
      topic: 'T',
      learningObjective: 'O',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    });

    const sameTimestamp = new Date('2026-05-01T12:00:00.000Z');

    const msgFirst: Message = {
      id: 'msg_order_a',
      sessionId,
      role: 'learner',
      content: 'first in conversation',
      messageType: 'question',
      timestamp: sameTimestamp,
    };

    const msgSecond: Message = {
      id: 'msg_order_b',
      sessionId,
      role: 'instructor',
      content: 'second in conversation',
      messageType: 'guidance',
      timestamp: sameTimestamp,
    };

    await db.saveMessage(msgFirst);
    await db.saveMessage(msgSecond);
    await db.updateSession(sessionId, {
      messageIds: ['msg_order_a', 'msg_order_b'],
    });

    const forward = await db.loadMessages(['msg_order_a', 'msg_order_b']);
    expect(forward.map((m) => m.id)).toEqual(['msg_order_a', 'msg_order_b']);
    expect(forward.map((m) => m.content)).toEqual([
      'first in conversation',
      'second in conversation',
    ]);

    const reversed = await db.loadMessages(['msg_order_b', 'msg_order_a']);
    expect(reversed.map((m) => m.id)).toEqual(['msg_order_b', 'msg_order_a']);

    db.close();
  });
});
