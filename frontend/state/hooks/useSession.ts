/**
 * useSession Hook
 * 
 * Custom hook for session management.
 * Wraps sessionStore with React-specific logic.
 */

import { useEffect } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { sessionsApi } from '../../services/api/sessions';

/** Bumps on each loadSession start; drop stale async results when the user switches sessions. */
let sessionLoadSequence = 0;

export function useSession() {
  const {
    currentSessionId,
    sessionState,
    session,
    error,
    setSession,
    setSessionState,
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
    setError(null);
    try {
      const response = await sessionsApi.getSession(sessionId);
      if (loadToken !== sessionLoadSequence) return;
      setSession(response.session);
    } catch (err: any) {
      if (loadToken !== sessionLoadSequence) return;
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
