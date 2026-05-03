/**
 * Regression: session persistence must satisfy FKs and messaging must resolve instructorProfileId.
 * Run: node tests/ensure-session-participants.test.js
 */
const assert = require('assert');
const { DatabaseStorageAdapter } = require('../dist/backend/adapters/storage/database');

async function assertRejects(promise, messageSubstr) {
  try {
    await promise;
  } catch (e) {
    if (messageSubstr && !String(e.message).includes(messageSubstr)) {
      throw new Error(`Expected error containing "${messageSubstr}", got: ${e.message}`);
    }
    return;
  }
  throw new Error('Expected promise to reject');
}

async function main() {
  // FK enforcement: raw save without participants must fail
  const dbNoBootstrap = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  await assertRejects(
    dbNoBootstrap.saveSession({
      id: 'sess_x',
      instructorId: 'missing_inst',
      learnerId: 'missing_learner',
      instructorProfileId: 'missing_inst',
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    }),
    'FOREIGN KEY'
  );
  dbNoBootstrap.close();

  // Profile id differs from instructor id: both instructor rows must exist
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
  const instructorId = 'inst_teacher_1';
  const profileId = 'prof_separate_1';
  const learnerId = 'learner_1';

  await db.ensureSessionParticipants(instructorId, learnerId, {
    instructorProfileId: profileId,
  });

  const instRows = db.db
    .prepare('SELECT id FROM instructors WHERE id IN (?, ?) ORDER BY id')
    .all(instructorId, profileId);
  assert.strictEqual(instRows.length, 2, 'both instructor PKs must exist');

  await db.saveSession({
    id: 'sess_ok',
    instructorId,
    learnerId,
    instructorProfileId: profileId,
    subject: 'Math',
    topic: 'Algebra',
    learningObjective: 'Practice',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });

  const prof = await db.loadInstructorProfile(profileId);
  assert.ok(prof, 'loadInstructorProfile must resolve after bootstrap');
  assert.strictEqual(prof.id, profileId);

  // session_messages FK to messages: saveSession with non-empty messageIds must succeed
  const msgSessionId = 'sess_with_msgs';
  await db.ensureSessionParticipants(instructorId, learnerId, {
    instructorProfileId: profileId,
  });
  await db.saveSession({
    id: msgSessionId,
    instructorId,
    learnerId,
    instructorProfileId: profileId,
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: ['msg_a', 'msg_b'],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });
  const junction = db.db
    .prepare('SELECT message_id FROM session_messages WHERE session_id = ? ORDER BY sequence_order')
    .all(msgSessionId);
  assert.strictEqual(junction.length, 2);
  assert.strictEqual(junction[0].message_id, 'msg_a');

  db.close();
  console.log('ensure-session-participants: ok');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
