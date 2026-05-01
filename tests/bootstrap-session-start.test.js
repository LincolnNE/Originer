/**
 * Ensures empty SQLite DBs get default instructor/learner rows so session start can succeed.
 */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Database = require('better-sqlite3');
const {
  DatabaseStorageAdapter,
} = require('../dist/backend/adapters/storage/database');

test('bootstrap creates default instructor and learner', () => {
  const tmp = path.join(os.tmpdir(), `originer-bootstrap-${Date.now()}.sqlite`);
  try {
    const adapter = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: tmp,
    });

    const raw = new Database(tmp);
    const inst = raw
      .prepare('SELECT id FROM instructors WHERE id = ?')
      .get('default_instructor');
    const learner = raw
      .prepare('SELECT id FROM learners WHERE id = ?')
      .get('default_learner');

    assert.ok(inst, 'expected default_instructor row');
    assert.ok(learner, 'expected default_learner row');

    raw.close();
    adapter.close();
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
  }
});

test('saveSession ensures instructor and learner rows for arbitrary IDs (FK-safe)', async () => {
  const tmp = path.join(os.tmpdir(), `originer-fk-${Date.now()}.sqlite`);
  const prevInst = process.env.ORIGINER_DEFAULT_INSTRUCTOR_ID;
  const prevLearn = process.env.ORIGINER_DEFAULT_LEARNER_ID;
  process.env.ORIGINER_DEFAULT_INSTRUCTOR_ID = 'only_bootstrap_instructor';
  process.env.ORIGINER_DEFAULT_LEARNER_ID = 'only_bootstrap_learner';

  try {
    const adapter = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: tmp,
    });

    await adapter.saveSession({
      id: 'sess_fk_test',
      instructorId: 'request_instructor',
      learnerId: 'request_learner',
      instructorProfileId: 'request_instructor',
      subject: 'General',
      topic: 'Introduction',
      learningObjective: 'Test',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    });

    const raw = new Database(tmp);
    const inst = raw
      .prepare('SELECT id FROM instructors WHERE id = ?')
      .get('request_instructor');
    const learner = raw
      .prepare('SELECT id FROM learners WHERE id = ?')
      .get('request_learner');
    assert.ok(inst, 'expected instructor row for session FK');
    assert.ok(learner, 'expected learner row for session FK');
    raw.close();
    adapter.close();
  } finally {
    if (prevInst === undefined) delete process.env.ORIGINER_DEFAULT_INSTRUCTOR_ID;
    else process.env.ORIGINER_DEFAULT_INSTRUCTOR_ID = prevInst;
    if (prevLearn === undefined) delete process.env.ORIGINER_DEFAULT_LEARNER_ID;
    else process.env.ORIGINER_DEFAULT_LEARNER_ID = prevLearn;
    try {
      fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
  }
});
