/**
 * App State Machine Store
 * 
 * Manages the application-level state machine.
 * Ensures explicit state transitions and action validation.
 * 
 * This is NOT a chat app - it's a lesson-based learning system.
 */

import { create } from 'zustand';

export type AppState = 
  | 'IDLE'
  | 'ASSESSING_LEVEL'
  | 'IN_LESSON'
  | 'AWAITING_FEEDBACK'
  | 'REVIEWING'
  | 'COMPLETED'
  | 'ERROR';

export type UserAction = 
  | 'startLearning'
  | 'submitAnswer'
  | 'requestHint'
  | 'reviseAnswer'
  | 'proceedToNext'
  | 'completeScreen'
  | 'navigateBack'
  | 'cancelSubmission'
  | 'retry'
  | 'reset'
  | 'completeAssessment';

export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'VALIDATION_ERROR'
  | 'TIMEOUT_ERROR'
  | 'SESSION_ERROR';

export interface StateData {
  sessionId?: string;
  screenId?: string;
  [key: string]: unknown;
}

export interface ErrorStateData {
  errorType: ErrorType;
  errorMessage: string;
  previousState: AppState;
  retryCount: number;
  errorTimestamp: Date;
}

export interface AppStateMachineStore {
  // Current state
  currentState: AppState;
  previousState: AppState | null;
  stateData: StateData | null;
  errorData: ErrorStateData | null;
  
  // Actions
  transitionTo: (newState: AppState, data?: StateData) => void;
  canTransitionTo: (newState: AppState) => boolean;
  canPerformAction: (action: UserAction) => boolean;
  getBlockingReasons: (action: UserAction) => string[];
  
  // Error handling
  transitionToError: (error: Error, errorType: ErrorType, previousState: AppState) => void;
  retryFromError: () => Promise<void>;
  resetFromError: () => void;
  
  // State queries
  isInLesson: () => boolean;
  canSubmit: () => boolean;
  canNavigate: () => boolean;
  
  // Persistence (localStorage)
  loadFromLocalStorage: () => { currentState: AppState; stateData: StateData | null } | null;
  saveToLocalStorage: () => void;
  clearLocalStorage: () => void;
}

/**
 * State transition validation matrix
 */
const VALID_TRANSITIONS: Record<AppState, AppState[]> = {
  IDLE: ['ASSESSING_LEVEL', 'IN_LESSON', 'ERROR'],
  ASSESSING_LEVEL: ['IN_LESSON', 'IDLE', 'ERROR'],
  IN_LESSON: ['AWAITING_FEEDBACK', 'REVIEWING', 'COMPLETED', 'ERROR'],
  AWAITING_FEEDBACK: ['REVIEWING', 'IN_LESSON', 'ERROR'],
  REVIEWING: ['IN_LESSON', 'COMPLETED', 'ERROR'],
  COMPLETED: ['IDLE', 'IN_LESSON', 'ASSESSING_LEVEL'],
  ERROR: ['IDLE'], // Can transition to any previous state via retry
};

/**
 * Action validation matrix
 * Maps (state, action) -> allowed (true/false)
 */
const ACTION_ALLOWED: Record<AppState, Set<UserAction>> = {
  IDLE: new Set(['startLearning']),
  ASSESSING_LEVEL: new Set(['submitAnswer', 'requestHint', 'completeAssessment', 'navigateBack']),
  IN_LESSON: new Set(['submitAnswer', 'requestHint', 'navigateBack', 'completeScreen']),
  AWAITING_FEEDBACK: new Set(['cancelSubmission']),
  REVIEWING: new Set(['reviseAnswer', 'proceedToNext', 'completeScreen', 'requestHint', 'navigateBack']),
  COMPLETED: new Set(['startLearning', 'reset']),
  ERROR: new Set(['retry', 'reset']),
};

export const useAppStateMachineStore = create<AppStateMachineStore>((set, get) => ({
  // Initial state
  currentState: 'IDLE',
  previousState: null,
  stateData: null,
  errorData: null,
  
  /**
   * Transition to new state
   */
  transitionTo: (newState, data) => {
    const { currentState } = get();
    
    // Validate transition
    const validTransitions = VALID_TRANSITIONS[currentState];
    if (!validTransitions.includes(newState)) {
      console.warn(`Invalid transition: ${currentState} → ${newState}`);
      return;
    }
    
    set({
      previousState: currentState,
      currentState: newState,
      stateData: data || null,
      errorData: newState === 'ERROR' ? null : get().errorData, // Clear error if not transitioning to ERROR
    });
    
    // Persist to localStorage after state update
    get().saveToLocalStorage();
  },
  
  /**
   * Check if can transition to state
   */
  canTransitionTo: (newState) => {
    const { currentState } = get();
    const validTransitions = VALID_TRANSITIONS[currentState];
    return validTransitions.includes(newState);
  },
  
  /**
   * Check if action is allowed in current state
   * Note: This checks state-level permission only.
   * Additional constraint checks (rate limit, cooldown, etc.) must be done separately.
   */
  canPerformAction: (action) => {
    const { currentState } = get();
    const allowedActions = ACTION_ALLOWED[currentState];
    return allowedActions.has(action);
  },
  
  /**
   * Get blocking reasons for action
   */
  getBlockingReasons: (action) => {
    const { currentState } = get();
    const reasons: string[] = [];
    
    // Check if action allowed in current state
    if (!get().canPerformAction(action)) {
      reasons.push(`Action '${action}' is not allowed in state '${currentState}'`);
    }
    
    // Additional constraint checks would be added here
    // (rate limit, cooldown, mastery, etc.)
    
    return reasons;
  },
  
  /**
   * Transition to error state
   */
  transitionToError: (error, errorType, previousState) => {
    const { errorData } = get();
    set({
      currentState: 'ERROR',
      previousState,
      errorData: {
        errorType,
        errorMessage: error.message || 'An error occurred',
        previousState,
        retryCount: (errorData?.retryCount || 0) + 1,
        errorTimestamp: new Date(),
      },
    });
  },
  
  /**
   * Retry from error state
   */
  retryFromError: async () => {
    const { errorData } = get();
    if (!errorData) {
      return;
    }
    
    // Transition back to previous state
    // Actual retry logic should be handled by the component/caller
    set({
      currentState: errorData.previousState,
      previousState: 'ERROR',
      errorData: null,
    });
  },
  
  /**
   * Reset from error state to IDLE
   */
  resetFromError: () => {
    set({
      currentState: 'IDLE',
      previousState: 'ERROR',
      stateData: null,
      errorData: null,
    });
    
    // Clear localStorage on reset
    get().clearLocalStorage();
  },
  
  /**
   * Check if currently in lesson
   */
  isInLesson: () => {
    const { currentState } = get();
    return currentState === 'IN_LESSON' || 
           currentState === 'AWAITING_FEEDBACK' || 
           currentState === 'REVIEWING';
  },
  
  /**
   * Check if can submit answer
   */
  canSubmit: () => {
    const { currentState } = get();
    return currentState === 'IN_LESSON' && get().canPerformAction('submitAnswer');
  },
  
  /**
   * Check if can navigate
   */
  canNavigate: () => {
    const { currentState } = get();
    return currentState === 'IN_LESSON' || 
           currentState === 'REVIEWING' || 
           currentState === 'ASSESSING_LEVEL';
  },
  
  /**
   * Load UI state from localStorage
   * Returns null if no state found or invalid
   */
  loadFromLocalStorage: () => {
    if (typeof window === 'undefined') {
      return null; // Server-side, no localStorage
    }
    
    try {
      const stored = localStorage.getItem('originer:stateMachine:currentState');
      const storedData = localStorage.getItem('originer:stateMachine:stateData');
      
      if (!stored) {
        return null;
      }
      
      const currentState = stored as AppState;
      const stateData = storedData ? JSON.parse(storedData) : null;
      
      // Validate state is valid
      if (!Object.keys(VALID_TRANSITIONS).includes(currentState)) {
        return null;
      }
      
      return { currentState, stateData };
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
      return null;
    }
  },
  
  /**
   * Save UI state to localStorage
   */
  saveToLocalStorage: () => {
    if (typeof window === 'undefined') {
      return; // Server-side, no localStorage
    }
    
    try {
      const { currentState, stateData } = get();
      localStorage.setItem('originer:stateMachine:currentState', currentState);
      localStorage.setItem('originer:stateMachine:stateData', JSON.stringify(stateData || null));
      
      // Also save session/screen IDs for quick access
      if (stateData?.sessionId) {
        localStorage.setItem('originer:session:currentSessionId', stateData.sessionId as string);
      }
      if (stateData?.screenId) {
        localStorage.setItem('originer:screen:currentScreenId', stateData.screenId as string);
      }
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  },
  
  /**
   * Clear UI state from localStorage
   */
  clearLocalStorage: () => {
    if (typeof window === 'undefined') {
      return; // Server-side, no localStorage
    }
    
    try {
      localStorage.removeItem('originer:stateMachine:currentState');
      localStorage.removeItem('originer:stateMachine:stateData');
      localStorage.removeItem('originer:session:currentSessionId');
      localStorage.removeItem('originer:screen:currentScreenId');
      localStorage.removeItem('originer:screen:draftAnswer');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  },
}));
