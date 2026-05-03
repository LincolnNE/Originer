/**
 * Regression: session_messages updates must be atomic when FK enforcement is on.
 * If DELETE runs and INSERT fails (e.g. unknown message_id), the session loses all
 * junction rows unless the DELETE rolls back with the failed INSERT.
 */
const Database = require('better-sqlite3');
const assert = require('assert');

function setupDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE sessions (id VARCHAR PRIMARY KEY);
    CREATE TABLE messages (
      id VARCHAR PRIMARY KEY,
      session_id VARCHAR NOT NULL,
      sender VARCHAR NOT NULL,
      role VARCHAR NOT NULL,
      content TEXT NOT NULL,
      message_type VARCHAR,
      teaching_metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
    CREATE TABLE session_messages (
      session_id VARCHAR NOT NULL,
      message_id VARCHAR NOT NULL,
      sequence_order INTEGER NOT NULL,
      PRIMARY KEY (session_id, message_id),
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (message_id) REFERENCES messages(id)
    );
    INSERT INTO sessions (id) VALUES ('sess1');
    INSERT INTO messages (id, session_id, sender, role, content)
      VALUES ('msg_ok', 'sess1', 'x', 'learner', 'hi');
    INSERT INTO session_messages (session_id, message_id, sequence_order)
      VALUES ('sess1', 'msg_ok', 0);
  `);
  return db;
}

// Bug pattern: DELETE then INSERT without wrapping both in one transaction
{
  const db = setupDb();
  const deleteStmt = db.prepare('DELETE FROM session_messages WHERE session_id = ?');
  const insertStmt = db.prepare(
    'INSERT INTO session_messages (session_id, message_id, sequence_order) VALUES (?, ?, ?)'
  );
  deleteStmt.run('sess1');
  assert.throws(
    () => insertStmt.run('sess1', 'msg_missing', 0),
    /FOREIGN KEY/i
  );
  const left = db.prepare('SELECT COUNT(*) AS c FROM session_messages WHERE session_id = ?').get('sess1');
  assert.strictEqual(left.c, 0, 'non-atomic path leaves session_messages empty after failed insert');
  db.close();
}

// Fixed pattern: single transaction rolls back DELETE when INSERT fails
{
  const db = setupDb();
  const deleteStmt = db.prepare('DELETE FROM session_messages WHERE session_id = ?');
  const insertStmt = db.prepare(
    'INSERT INTO session_messages (session_id, message_id, sequence_order) VALUES (?, ?, ?)'
  );
  const sync = db.transaction((sid, ids) => {
    deleteStmt.run(sid);
    ids.forEach((id, idx) => insertStmt.run(sid, id, idx));
  });
  assert.throws(() => sync('sess1', ['msg_missing']), /FOREIGN KEY/i);
  const left = db.prepare('SELECT COUNT(*) AS c FROM session_messages WHERE session_id = ?').get('sess1');
  assert.strictEqual(left.c, 1, 'atomic path preserves rows when insert fails');
  db.close();
}

console.log('session_messages_atomic.test.js: ok');
