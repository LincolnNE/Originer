/**
 * Ensures MVP seed rows exist so session persistence does not fail on FK constraints.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import type { Session } from '../backend/core/types';

test('default instructor and learner allow session save on fresh DB', async () => {
  const adapter = new DatabaseStorageAdapter({
    type: 'sqlite',
    connectionString: ':memory:',
  });

  const session: Session = {
    id: 'sess_test_1',
    instructorId: 'default',
    learnerId: 'anonymous-mvp',
    instructorProfileId: 'default',
    subject: 'General',
    topic: 'Introduction',
    learningObjective: 'Test',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };

  await assert.doesNotReject(() => adapter.saveSession(session));
  const loaded = await adapter.loadSession(session.id);
  assert.ok(loaded);
  assert.equal(loaded!.learnerId, 'anonymous-mvp');
  adapter.close();
});
