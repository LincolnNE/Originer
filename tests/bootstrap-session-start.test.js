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
