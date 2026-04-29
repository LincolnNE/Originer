/**
 * Ensures conversation history matches session message order (session_messages.sequence_order),
 * not SQLite row retrieval order.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Message } from '../backend/core/types';

describe('DatabaseStorageAdapter.loadMessages', () => {
  let dir: string;
  let adapter: DatabaseStorageAdapter;

  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'originer-db-'));
    adapter = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: join(dir, 'test.sqlite'),
    });
  });

  after(() => {
    adapter.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns messages in the same order as messageIds (chronological conversation order)', async () => {
    const sessionId = 'sess_order_test';
    const instructorId = 'inst_test';
    const learnerId = 'learner_test';

    await (adapter as any).createInstructor({
      id: instructorId,
      name: 'Test Instructor',
    });
    await (adapter as any).createLearner({ id: learnerId, name: 'Test Learner' });
    await adapter.saveSession({
      id: sessionId,
      instructorId,
      learnerId,
      instructorProfileId: instructorId,
      subject: 'Test',
      topic: 'Test',
      learningObjective: 'Test',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    });

    const baseTime = Date.now();

    const mkMsg = (id: string, offsetMs: number, content: string): Message => ({
      id,
      sessionId,
      role: 'learner',
      content,
      messageType: 'question',
      timestamp: new Date(baseTime + offsetMs),
    });

    const m1 = mkMsg('msg_a', 0, 'first');
    const m2 = mkMsg('msg_b', 10_000, 'second');

    await adapter.saveMessage(m1);
    await adapter.saveMessage(m2);

    const chronological = await adapter.loadMessages(['msg_a', 'msg_b']);
    assert.deepStrictEqual(
      chronological.map(m => m.content),
      ['first', 'second']
    );

    const reversedIds = await adapter.loadMessages(['msg_b', 'msg_a']);
    assert.deepStrictEqual(
      reversedIds.map(m => m.content),
      ['second', 'first']
    );
  });

  it('throws if a message id is missing (corrupt session index)', async () => {
    await assert.rejects(
      async () => {
        await adapter.loadMessages(['nonexistent_msg_id']);
      },
      /Message not found for id: nonexistent_msg_id/
    );
  });
});
