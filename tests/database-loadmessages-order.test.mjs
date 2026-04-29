/**
 * Ensures conversation history follows session message order, not created_at.
 * Run after build: npm run build && node --test tests/database-loadmessages-order.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const { DatabaseStorageAdapter } = await import(
  pathToFileURL(join(process.cwd(), 'dist/backend/adapters/storage/database.js')).href
);

test('loadMessages preserves session order when created_at is identical', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'originer-db-'));
  const dbPath = join(dir, 'test.sqlite');
  try {
    const storage = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: dbPath,
    });

    await storage.createInstructor({ id: 'inst_1', name: 'T' });
    await storage.createLearner({ id: 'lrn_1', name: 'L' });

    const session = {
      id: 'sess_1',
      instructorId: 'inst_1',
      learnerId: 'lrn_1',
      instructorProfileId: 'inst_1',
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date('2020-01-01T00:00:00.000Z'),
      lastActivityAt: new Date('2020-01-01T00:00:00.000Z'),
      endedAt: null,
    };
    await storage.saveSession(session);

    const sameTs = new Date('2020-01-02T12:00:00.000Z');
    const m1 = {
      id: 'msg_a',
      sessionId: 'sess_1',
      role: 'learner',
      content: 'first',
      messageType: 'question',
      timestamp: sameTs,
    };
    const m2 = {
      id: 'msg_b',
      sessionId: 'sess_1',
      role: 'instructor',
      content: 'second',
      messageType: 'guidance',
      timestamp: sameTs,
    };
    const m3 = {
      id: 'msg_c',
      sessionId: 'sess_1',
      role: 'learner',
      content: 'third',
      messageType: 'question',
      timestamp: sameTs,
    };

    await storage.saveMessage(m1);
    await storage.saveMessage(m2);
    await storage.saveMessage(m3);

    await storage.updateSession('sess_1', {
      messageIds: ['msg_a', 'msg_b', 'msg_c'],
      lastActivityAt: sameTs,
    });

    const loaded = await storage.loadMessages(['msg_a', 'msg_b', 'msg_c']);
    assert.deepEqual(
      loaded.map(m => m.id),
      ['msg_a', 'msg_b', 'msg_c'],
      'order must match session messageIds, not created_at sort'
    );
    assert.deepEqual(
      loaded.map(m => m.content),
      ['first', 'second', 'third']
    );

    storage.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
