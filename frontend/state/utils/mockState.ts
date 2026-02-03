/**
 * Mock State Utilities
 * 
 * Helper functions for initializing mock state during development.
 * These are used when backend APIs are not yet available.
 * 
 * In production, these would be replaced with actual API calls.
 */

import { SessionState } from '../../types/state';
import { LessonState, LessonUIState } from '../../types/state';
import { useSessionStore } from '../stores/sessionStore';
import { useLessonStateStore } from '../stores/lessonStateStore';

/**
 * Initialize mock session state
 */
export function initializeMockSession(sessionId: string) {
  const store = useSessionStore.getState();
  
  store.setSession({
    id: sessionId,
    learnerId: 'mock-learner-001',
    instructorProfileId: 'default',
    subject: 'Mathematics',
    topic: 'Algebra',
    learningObjective: 'Solve linear equations',
    sessionState: 'active',
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  });
  
  store.setSessionState('active');
}

/**
 * Initialize mock lesson state for a screen
 */
export function initializeMockLessonState(sessionId: string, screenId: string): LessonState {
  const store = useLessonStateStore.getState();
  
  const mockState: LessonState = {
    screenId,
    uiState: 'ready' as LessonUIState,
    navigationState: {
      canGoBack: true,
      canGoForward: false,
      canSkip: false,
      availableScreens: ['screen_001', 'screen_002', 'screen_003'],
      lockedScreens: ['screen_003'],
      lockedReason: undefined,
    },
    interactionAvailability: {
      canSubmit: true,
      canAskQuestion: true,
      canRequestHelp: true,
      canRetry: false,
      canCancel: false,
      canEdit: true,
    },
    visualState: {
      showProgress: true,
      showTimer: false,
      showConstraints: true,
      showFeedback: false,
      showNextButton: false,
      showSubmitButton: true,
      disabledActions: [],
    },
    syncStatus: {
      isSynced: true,
      lastSyncedAt: new Date(),
      pendingChanges: false,
      syncError: null,
    },
  };
  
  store.setLessonState(mockState);
  store.setCurrentScreen(screenId);
  
  return mockState;
}

/**
 * Create default lesson state for a screen
 */
export function createDefaultLessonState(screenId: string, uiState: LessonUIState = 'ready'): LessonState {
  return {
    screenId,
    uiState,
    navigationState: {
      canGoBack: false,
      canGoForward: false,
      canSkip: false,
      availableScreens: [],
      lockedScreens: [],
    },
    interactionAvailability: {
      canSubmit: false,
      canAskQuestion: false,
      canRequestHelp: false,
      canRetry: false,
      canCancel: false,
      canEdit: false,
    },
    visualState: {
      showProgress: false,
      showTimer: false,
      showConstraints: false,
      showFeedback: false,
      showNextButton: false,
      showSubmitButton: false,
      disabledActions: [],
    },
    syncStatus: {
      isSynced: false,
      lastSyncedAt: null,
      pendingChanges: false,
      syncError: null,
    },
  };
}
