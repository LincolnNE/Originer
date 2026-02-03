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
  
  // Actions
  setSession: (session: any) => {
    if (!session) {
      set({ session: null, currentSessionId: null, sessionState: 'initializing' });
      return;
    }
    const now = new Date();
    set({ 
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
  
  clearSession: () => set({ 
    session: null, 
    currentSessionId: null,
    sessionState: 'initializing',
    error: null 
  }),
  
  updateSession: (updates) => set((state) => ({
    session: state.session ? { ...state.session, ...updates } : null,
    sessionState: updates.sessionState === 'completed' ? 'completed' :
                  updates.sessionState === 'paused' ? 'paused' :
                  state.sessionState === 'error' ? 'error' :
                  state.session ? 'active' : state.sessionState
  })),
  
  setError: (error) => set({ error, sessionState: 'error' }),
}));
