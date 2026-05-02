/**
 * Regression tests for storage correctness (run with: npx ts-node src/__tests__/storage-regression.test.ts)
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DatabaseStorageAdapter } from '../../backend/adapters/storage/database';
import type { Message } from '../../backend/core/types';

function tmpDbPath(): string {
  return path.join(os.tmpdir(), `originer-storage-test-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
}

async function run(): Promise<void> {
  // saveSession with empty messageIds must not wipe session_messages (PR #193 scenario)
  const dbPath = tmpDbPath();
  const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: dbPath });
  const sessionId = 'sess_regression_1';

  await adapter.ensureInstructorExists('inst_r1');
  await adapter.ensureLearnerExists('learner_r1');

  await adapter.saveSession({
    id: sessionId,
    instructorId: 'inst_r1',
    learnerId: 'learner_r1',
    instructorProfileId: 'inst_r1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  const m1: Message = {
    id: 'msg_a',
    sessionId,
    role: 'learner',
    content: 'hi',
    messageType: 'question',
    timestamp: new Date('2020-01-01T00:00:00Z'),
  };
  const m2: Message = {
    id: 'msg_b',
    sessionId,
    role: 'instructor',
    content: 'hello',
    messageType: 'guidance',
    timestamp: new Date('2019-01-01T00:00:00Z'),
  };

  await adapter.saveMessage(m1);
  await adapter.saveMessage(m2);

  await adapter.updateSession(sessionId, {
    messageIds: [m1.id, m2.id],
    lastActivityAt: new Date(),
  });

  // Simulate session create/save with placeholder empty ids (common after POST /sessions)
  await adapter.saveSession({
    id: sessionId,
    instructorId: 'inst_r1',
    learnerId: 'learner_r1',
    instructorProfileId: 'inst_r1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  const loaded = await adapter.loadSession(sessionId);
  assert.ok(loaded);
  assert.deepStrictEqual(loaded!.messageIds, [m1.id, m2.id], 'junction rows must survive saveSession([])');

  // loadMessages must follow messageIds order, not created_at
  const history = await adapter.loadMessages([m2.id, m1.id]);
  assert.strictEqual(history[0]!.id, m2.id);
  assert.strictEqual(history[1]!.id, m1.id);

  adapter.close();
  try {
    fs.unlinkSync(dbPath);
  } catch {
    // ignore
  }

  console.log('storage-regression: ok');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
