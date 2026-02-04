/**
 * useLessonState Hook
 * 
 * Custom hook for lesson state management.
 * Wraps lessonStateStore with React-specific logic.
 */

import { useLessonStateStore } from '../stores/lessonStateStore';
import { LessonUIState } from '../../types/state';

export function useLessonState() {
  const {
    currentScreenId,
    lessonState,
    availableScreens,
    lockedScreens,
    setCurrentScreen,
    setLessonState,
    updateLessonState,
    transitionState,
    setAvailableScreens,
    setLockedScreens,
    lockScreen,
    unlockScreen,
  } = useLessonStateStore();

  /**
   * Check if action is allowed
   */
  const canPerformAction = (action: string): boolean => {
    if (!lessonState) return false;
    
    switch (action) {
      case 'submit':
        return lessonState.interactionAvailability.canSubmit &&
               (lessonState.uiState === 'ready' || lessonState.uiState === 'interacting');
      case 'askQuestion':
        return lessonState.interactionAvailability.canAskQuestion;
      case 'requestHelp':
        return lessonState.interactionAvailability.canRequestHelp;
      case 'navigateForward':
        return lessonState.navigationState.canGoForward;
      case 'navigateBack':
        return lessonState.navigationState.canGoBack;
      default:
        return false;
    }
  };

  /**
   * Get blocking reason for action
   */
  const getBlockingReason = (action: string): string | null => {
    if (!lessonState) return null;
    
    if (action === 'navigateForward' && !lessonState.navigationState.canGoForward) {
      return lessonState.navigationState.lockedReason || 'Next screen is locked';
    }
    
    return null;
  };

  return {
    currentScreenId,
    lessonState,
    availableScreens,
    lockedScreens,
    setCurrentScreen,
    setLessonState,
    updateLessonState,
    transitionState,
    setAvailableScreens,
    setLockedScreens,
    lockScreen,
    unlockScreen,
    canPerformAction,
    getBlockingReason,
  };
}
