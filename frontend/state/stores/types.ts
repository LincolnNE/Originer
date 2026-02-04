/**
 * State Store Type Definitions
 * 
 * Defines interfaces for Zustand stores.
 * These are the contracts for state management.
 */

import { LessonState, ProgressState, ActiveConstraints, InteractionMode, SessionState } from '../../types/state';

// Session Store
export interface SessionStore {
  // State
  currentSessionId: string | null;
  sessionState: SessionState;
  session: {
    id: string;
    learnerId: string;
    instructorProfileId: string;
    subject: string;
    topic: string;
    learningObjective: string;
    sessionState: 'active' | 'paused' | 'completed' | 'abandoned';
    startedAt: Date;
    lastActivityAt: Date;
    endedAt: Date | null;
  } | null;
  error: string | null;
  
  // Actions
  setSession: (session: {
    id: string;
    learnerId: string;
    instructorProfileId: string;
    subject: string;
    topic: string;
    learningObjective: string;
    sessionState: 'active' | 'paused' | 'completed' | 'abandoned';
    startedAt: string | Date;
    lastActivityAt?: string | Date;
    endedAt?: string | Date | null;
  } | null) => void;
  setSessionState: (state: SessionState) => void;
  clearSession: () => void;
  updateSession: (updates: Partial<NonNullable<SessionStore['session']>>) => void;
  setError: (error: string | null) => void;
}

// Lesson State Store
export interface LessonStateStore {
  // State
  currentScreenId: string | null;
  lessonState: LessonState | null;
  availableScreens: string[];
  lockedScreens: string[];
  
  // Actions
  setCurrentScreen: (screenId: string) => void;
  setLessonState: (state: LessonState) => void;
  updateLessonState: (updates: Partial<LessonState>) => void;
  transitionState: (newState: LessonState['uiState']) => void;
  setAvailableScreens: (screens: string[]) => void;
  setLockedScreens: (screens: string[]) => void;
  lockScreen: (screenId: string, reason?: string) => void;
  unlockScreen: (screenId: string) => void;
}

// Progress Store
export interface ProgressStore {
  // State
  screenProgress: ProgressState['screenProgress'] | null;
  sessionProgress: ProgressState['sessionProgress'] | null;
  masteryState: ProgressState['masteryState'] | null;
  unlockState: ProgressState['unlockState'] | null;
  
  // Actions
  updateScreenProgress: (progress: ProgressState['screenProgress']) => void;
  updateSessionProgress: (progress: ProgressState['sessionProgress']) => void;
  updateMasteryState: (state: ProgressState['masteryState']) => void;
  updateUnlockState: (state: ProgressState['unlockState']) => void;
  checkUnlockStatus: (screenId: string) => Promise<void>;
}

// Constraint Store
export interface ConstraintStore {
  // State
  activeConstraints: ActiveConstraints;
  blockingConstraints: ActiveConstraints['blockingConstraints'];
  warningConstraints: ActiveConstraints['warningConstraints'];
  
  // Actions
  updateConstraints: (constraints: ActiveConstraints['constraints']) => void;
  checkAction: (action: string) => boolean;
  getBlockingReason: (action: string) => string | null;
  getTimeUntilAvailable: (action: string) => number | null;
}

// Interaction Mode Store
export interface InteractionModeStore {
  // State
  interactionMode: InteractionMode | null;
  
  // Actions
  setMode: (mode: InteractionMode['mode'], subMode?: InteractionMode['subMode']) => void;
  updateAllowedActions: (actions: Partial<InteractionMode['allowedActions']>) => void;
  updateInputState: (state: Partial<InteractionMode['inputState']>) => void;
  updateFeedbackState: (state: Partial<InteractionMode['feedbackState']>) => void;
}
