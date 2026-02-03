/**
 * useAppStateMachine Hook
 * 
 * Custom hook for app state machine.
 * Wraps appStateMachineStore with React-specific logic.
 */

import { useAppStateMachineStore, UserAction, AppState, StateData } from '../stores/appStateMachineStore';

export function useAppStateMachine() {
  const {
    currentState,
    previousState,
    stateData,
    errorData,
    transitionTo,
    canTransitionTo,
    canPerformAction,
    getBlockingReasons,
    transitionToError,
    retryFromError,
    resetFromError,
    isInLesson,
    canSubmit,
    canNavigate,
    loadFromLocalStorage,
    saveToLocalStorage,
    clearLocalStorage,
  } = useAppStateMachineStore();
  
  // Note: localStorage loading should be done explicitly by components
  // This hook provides the method but doesn't auto-load to avoid conflicts
  // Components should call loadFromLocalStorage() explicitly when needed

  /**
   * Validate and transition to new state
   */
  const safeTransitionTo = (newState: AppState, data?: StateData) => {
    if (canTransitionTo(newState)) {
      transitionTo(newState, data);
    } else {
      console.warn(`Cannot transition from ${currentState} to ${newState}`);
    }
  };

  /**
   * Validate action before performing
   */
  const validateAction = (action: UserAction): { allowed: boolean; reasons: string[] } => {
    const allowed = canPerformAction(action);
    const reasons = allowed ? [] : getBlockingReasons(action);
    return { allowed, reasons };
  };

  /**
   * Handle error with state machine
   */
  const handleError = (error: Error, errorType: 'NETWORK_ERROR' | 'API_ERROR' | 'VALIDATION_ERROR' | 'TIMEOUT_ERROR' | 'SESSION_ERROR') => {
    transitionToError(error, errorType, currentState);
  };

  return {
    // State
    currentState,
    previousState,
    stateData,
    errorData,
    
    // Actions
    transitionTo: safeTransitionTo,
    canTransitionTo,
    canPerformAction,
    validateAction,
    getBlockingReasons,
    
    // Error handling
    handleError,
    retryFromError,
    resetFromError,
    
    // State queries
    isInLesson,
    canSubmit,
    canNavigate,
    
    // Convenience checks
    isIdle: currentState === 'IDLE',
    isAssessing: currentState === 'ASSESSING_LEVEL',
    isInLessonState: currentState === 'IN_LESSON',
    isAwaitingFeedback: currentState === 'AWAITING_FEEDBACK',
    isReviewing: currentState === 'REVIEWING',
    isCompleted: currentState === 'COMPLETED',
    isError: currentState === 'ERROR',
    
    // Persistence
    loadFromLocalStorage,
    saveToLocalStorage,
    clearLocalStorage,
  };
}
