/**
 * useSession Hook
 * 
 * Custom hook for session management.
 * Wraps sessionStore with React-specific logic.
 */

import { useSessionStore } from '../stores/sessionStore';
import { sessionsApi } from '../../services/api/sessions';

/** Bumps on each loadSession start; drop stale async results when the user switches sessions. */
let sessionLoadSequence = 0;

export function useSession() {
  const {
    currentSessionId,
    pendingSessionId,
    sessionState,
    session,
    error,
    setSession,
    setSessionState,
    setPendingSessionId,
    clearSession,
    updateSession,
    setError,
  } = useSessionStore();

  /**
   * Load session from API
   */
  const loadSession = async (sessionId: string) => {
    const loadToken = ++sessionLoadSequence;
    setSessionState('loading');
    setPendingSessionId(sessionId);
    setError(null);
    const reconcileStateIfStale = () => {
      if (loadToken === sessionLoadSequence) return;
      const { session: s, currentSessionId: cid, pendingSessionId: pend, sessionState: st } =
        useSessionStore.getState();
      // A newer in-flight `loadSession` already updated `loading` / `pendingSessionId`; do not clobber it.
      if (pend) return;
      if (cid && s && cid === sessionId) {
        setSessionState(s.sessionState === 'completed' ? 'completed' : 'active');
      } else if (st === 'loading') {
        setSessionState('initializing');
      }
    };
    try {
      const response = await sessionsApi.getSession(sessionId);
      if (loadToken !== sessionLoadSequence) {
        reconcileStateIfStale();
        return;
      }
      setSession(response.session);
    } catch (err: any) {
      if (loadToken !== sessionLoadSequence) {
        reconcileStateIfStale();
        return;
      }
      setError(err.message || 'Failed to load session', {
        attemptedSessionId: sessionId,
      });
    }
  };

  /**
   * Create new session
   */
  const createSession = async (params: {
    subject: string;
    topic: string;
    learningObjective: string;
    instructorProfileId?: string;
  }) => {
    setSessionState('loading');
    setError(null);
    try {
      const response = await sessionsApi.createSession({
        instructorProfileId: params.instructorProfileId || 'default',
        subject: params.subject,
        topic: params.topic,
        learningObjective: params.learningObjective,
      });
      setSession(response.session);
      return response.session.id;
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
      throw err;
    }
  };

  return {
    currentSessionId,
    pendingSessionId,
    sessionState,
    session,
    error,
    loadSession,
    createSession,
    clearSession,
    updateSession,
    setSessionState,
  };
}
