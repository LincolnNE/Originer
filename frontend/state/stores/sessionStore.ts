/**
 * Session Store
 * 
 * Manages current session state.
 * 
 * State Ownership: Frontend (optimistic), Backend (authoritative)
 */

import { create } from 'zustand';
import { SessionStore } from './types';
import { SessionState } from '../../types/state';

export const useSessionStore = create<SessionStore>((set) => ({
  // Initial state
  currentSessionId: null,
  sessionState: 'initializing' as SessionState,
  session: null,
  error: null,
  pendingSessionId: null,
  
  // Actions
  setSession: (session: any) => {
    if (!session) {
      set({ session: null, currentSessionId: null, sessionState: 'initializing', pendingSessionId: null });
      return;
    }
    const now = new Date();
    set({ 
      pendingSessionId: null,
      session: {
        id: session.id,
        learnerId: session.learnerId,
        instructorProfileId: session.instructorProfileId,
        subject: session.subject,
        topic: session.topic,
        learningObjective: session.learningObjective,
        sessionState: session.sessionState,
        startedAt: typeof session.startedAt === 'string' ? new Date(session.startedAt) : (session.startedAt || now),
        lastActivityAt: typeof session.lastActivityAt === 'string' ? new Date(session.lastActivityAt) : (session.lastActivityAt || now),
        endedAt: session.endedAt ? (typeof session.endedAt === 'string' ? new Date(session.endedAt) : session.endedAt) : null,
      }, 
      currentSessionId: session.id || null,
      sessionState: session.sessionState === 'completed' ? 'completed' : 
                    session.sessionState === 'paused' ? 'paused' : 
                    'active'
    });
  },
  
  setSessionState: (state) => set({ sessionState: state }),

  setPendingSessionId: (id) => set({ pendingSessionId: id }),
  
  clearSession: () => set({ 
    session: null, 
    currentSessionId: null,
    sessionState: 'initializing',
    error: null,
    pendingSessionId: null,
  }),
  
  updateSession: (updates) => set((state) => ({
    session: state.session ? { ...state.session, ...updates } : null,
    sessionState: updates.sessionState === 'completed' ? 'completed' :
                  updates.sessionState === 'paused' ? 'paused' :
                  state.sessionState === 'error' ? 'error' :
                  state.session ? 'active' : state.sessionState
  })),
  
  setError: (error, options) =>
    set((state) => {
      if (error === null) {
        // `loadSession` clears errors before a retry; do not leave `sessionState: 'error'` or follow-up loads never run.
        return {
          error: null,
          sessionState: state.sessionState === 'error' ? 'initializing' : state.sessionState,
        };
      }
      return {
        error,
        sessionState: 'error',
        pendingSessionId: null,
        currentSessionId:
          options?.attemptedSessionId !== undefined
            ? options.attemptedSessionId
            : state.currentSessionId,
      };
    }),
}));
