/**
 * Integration check: session_messages DELETE+INSERT must be one transaction.
 * Run: npm run test:storage-txn
 */
const path = require('path');
const { DatabaseStorageAdapter } = require(path.join(
  __dirname,
  '..',
  'dist',
  'backend',
  'adapters',
  'storage',
  'database.js'
));

async function main() {
  const adapter = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const db = adapter.db;

  await adapter.createInstructor({ id: 'i1', name: 'T' });
  await adapter.createLearner({ id: 'l1', name: 'L' });
  const sid = 's1';
  await adapter.saveSession({
    id: sid,
    instructorId: 'i1',
    learnerId: 'l1',
    instructorProfileId: 'i1',
    subject: '',
    topic: '',
    learningObjective: '',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });
  await adapter.saveMessage({
    id: 'm1',
    sessionId: sid,
    role: 'learner',
    content: 'x',
    messageType: 'question',
    timestamp: new Date(),
  });
  await adapter.updateSession(sid, { messageIds: ['m1'] });

  let rows = db.prepare('SELECT COUNT(*) AS c FROM session_messages WHERE session_id = ?').get(sid).c;
  if (rows !== 1) throw new Error(`expected 1 junction row, got ${rows}`);

  db.prepare('CREATE TABLE IF NOT EXISTS boom (x INTEGER)').run();
  const origTransaction = db.transaction.bind(db);
  db.transaction = function (fn) {
    const t = origTransaction(fn);
    return (...args) => {
      const r = t(...args);
      db.prepare('SELECT * FROM boom').get();
      return r;
    };
  };

  let threw = false;
  try {
    await adapter.updateSession(sid, { messageIds: ['m1', 'm2'] });
  } catch (_e) {
    threw = true;
  }
  if (!threw) throw new Error('expected second update to throw');

  rows = db.prepare('SELECT COUNT(*) AS c FROM session_messages WHERE session_id = ?').get(sid).c;
  if (rows !== 1) {
    throw new Error(
      `junction corruption: after failed txn expected 1 row, got ${rows} (DELETE committed without INSERT)`
    );
  }

  const loaded = await adapter.loadSession(sid);
  if (!loaded || loaded.messageIds.length !== 1 || loaded.messageIds[0] !== 'm1') {
    throw new Error(`bad messageIds after failed txn: ${JSON.stringify(loaded?.messageIds)}`);
  }

  adapter.close();
  console.log('verify-session-messages-txn: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
