/**
 * Verifies loadMessages returns rows in session message order (messageIds),
 * not sorted by created_at. Misordered timestamps must not reorder dialogue.
 *
 * Run: npx ts-node src/__tests__/verify-loadMessages-order.ts
 */
import { DatabaseStorageAdapter } from '../../backend/adapters/storage/database';

async function main(): Promise<void> {
  const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });

  await storage.createInstructor({ id: 'inv_order', name: 'Instructor' });
  await storage.createLearner({ id: 'lrn_order', name: 'Learner' });

  await storage.saveSession({
    id: 'sess_order',
    instructorId: 'inv_order',
    learnerId: 'lrn_order',
    instructorProfileId: 'inv_order',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date('2020-01-01T00:00:00.000Z'),
    lastActivityAt: new Date('2020-01-01T00:00:00.000Z'),
    endedAt: null,
  });

  const firstInThread = {
    id: 'msg_first_thread',
    sessionId: 'sess_order',
    role: 'learner' as const,
    content: 'First turn in conversation',
    messageType: 'question' as const,
    timestamp: new Date('2020-01-03T00:00:00.000Z'),
  };

  const secondInThread = {
    id: 'msg_second_thread',
    sessionId: 'sess_order',
    role: 'instructor' as const,
    content: 'Second turn in conversation',
    messageType: 'guidance' as const,
    timestamp: new Date('2020-01-02T00:00:00.000Z'),
  };

  await storage.saveMessage(firstInThread);
  await storage.saveMessage(secondInThread);

  await storage.saveSession({
    id: 'sess_order',
    instructorId: 'inv_order',
    learnerId: 'lrn_order',
    instructorProfileId: 'inv_order',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [firstInThread.id, secondInThread.id],
    startedAt: new Date('2020-01-01T00:00:00.000Z'),
    lastActivityAt: new Date('2020-01-01T00:00:00.000Z'),
    endedAt: null,
  });

  const loaded = await storage.loadMessages([firstInThread.id, secondInThread.id]);

  if (loaded.length !== 2) {
    throw new Error(`expected 2 messages, got ${loaded.length}`);
  }
  if (loaded[0].id !== firstInThread.id || loaded[1].id !== secondInThread.id) {
    throw new Error(
      `loadMessages must follow messageIds order; got ${loaded.map(m => m.id).join(', ')}`
    );
  }

  storage.close();
  console.log('verify-loadMessages-order: OK');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
