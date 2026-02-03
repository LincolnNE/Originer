/**
 * useProgress Hook
 * 
 * Custom hook for progress management.
 * Wraps progressStore with React-specific logic.
 */

import { useProgressStore } from '../stores/progressStore';

export function useProgress() {
  const {
    screenProgress,
    sessionProgress,
    masteryState,
    unlockState,
    updateScreenProgress,
    updateSessionProgress,
    updateMasteryState,
    updateUnlockState,
    checkUnlockStatus,
  } = useProgressStore();

  /**
   * Check if can proceed to next screen
   */
  const canProceed = (): boolean => {
    return screenProgress?.canProceed || false;
  };

  /**
   * Get progress percentage
   */
  const getProgressPercentage = (): number => {
    return screenProgress?.progressPercentage || 0;
  };

  /**
   * Get mastery status
   */
  const isMastered = (): boolean => {
    return masteryState?.isMastered || false;
  };

  return {
    screenProgress,
    sessionProgress,
    masteryState,
    unlockState,
    updateScreenProgress,
    updateSessionProgress,
    updateMasteryState,
    updateUnlockState,
    checkUnlockStatus,
    canProceed,
    getProgressPercentage,
    isMastered,
  };
}
