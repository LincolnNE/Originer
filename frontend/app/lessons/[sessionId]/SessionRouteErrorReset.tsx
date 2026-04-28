'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useSessionStore } from '@/state/stores/sessionStore';

/**
 * Clears a prior route's load error when the [sessionId] segment changes, so returning to
 * a session (or another session) is not stuck behind `sessionState === 'error'` and the
 * load effect's early return.
 */
export function SessionRouteErrorReset() {
  const params = useParams();
  const sessionId = params?.sessionId;
  const sessionIdStr = typeof sessionId === 'string' ? sessionId : undefined;

  useEffect(() => {
    if (!sessionIdStr) return;
    useSessionStore.getState().setError(null);
  }, [sessionIdStr]);

  return null;
}
