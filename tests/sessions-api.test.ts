/**
 * Session API client must normalize POST /sessions/start response shape for hooks/UI.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCreateSessionResponse } from '../frontend/services/api/sessionStartResponse';

test('toCreateSessionResponse extracts session from start endpoint payload', () => {
  const payload = {
    session_id: 'sess_x',
    session: {
      id: 'sess_x',
      learnerId: 'anonymous-mvp',
      instructorProfileId: 'default',
      subject: 'General',
      topic: 'Introduction',
      learningObjective: 'Learn',
      sessionState: 'active' as const,
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      endedAt: null as string | null,
    },
  };

  const out = toCreateSessionResponse(payload);
  assert.equal(out.session.id, 'sess_x');
  assert.equal(out.session.learnerId, 'anonymous-mvp');
});

test('toCreateSessionResponse rejects missing session', () => {
  assert.throws(
    () => toCreateSessionResponse({ session_id: 'only_id' } as any),
    /missing session/
  );
});
