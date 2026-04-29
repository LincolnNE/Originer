/**
 * Verifies default SQLite path persists data across adapter instances (process restart simulation).
 * Run: npx ts-node tests/database-path.persistence.ts
 */

import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Session } from '../backend/core/types';
import { resolveDatabasePath } from '../src/services/index';

async function main(): Promise<void> {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'originer-db-persist-'));
  const prevCwd = process.cwd();
  const prevDb = process.env.DATABASE_PATH;

  process.chdir(tmpRoot);
  delete process.env.DATABASE_PATH;

  try {
    const expectedDb = path.join(tmpRoot, 'data', 'originer.db');
    assert.strictEqual(resolveDatabasePath(), expectedDb, 'default path should be ./data/originer.db under cwd');

    fs.mkdirSync(path.dirname(expectedDb), { recursive: true });

    const sessionId = 'sess_persist_test';
    const instructorId = 'inst_persist_1';
    const learnerId = 'learner_persist_1';

    const session: Session = {
      id: sessionId,
      instructorId,
      learnerId,
      instructorProfileId: instructorId,
      subject: 'Test',
      topic: 'Persistence',
      learningObjective: 'Verify DB file',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    };

    const a1 = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: expectedDb });
    await a1.createInstructor({ id: instructorId, name: 'Test Instructor' });
    await a1.createLearner({ id: learnerId, name: 'Test Learner' });
    await a1.saveSession(session);
    a1.close();

    assert.ok(fs.existsSync(expectedDb), 'SQLite file should exist after first adapter closes');

    const a2 = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: expectedDb });
    const loaded = await a2.loadSession(sessionId);
    a2.close();

    assert.ok(loaded, 'session should load from same file path after reopen');
    assert.strictEqual(loaded!.id, sessionId);
  } finally {
    process.chdir(prevCwd);
    if (prevDb !== undefined) {
      process.env.DATABASE_PATH = prevDb;
    } else {
      delete process.env.DATABASE_PATH;
    }
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }

  console.log('database-path.persistence: ok');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
