/**
 * useConstraints Hook
 * 
 * Custom hook for constraint management.
 * Wraps constraintStore with React-specific logic.
 */

import { useConstraintStore } from '../stores/constraintStore';

export function useConstraints() {
  const {
    activeConstraints,
    blockingConstraints,
    warningConstraints,
    updateConstraints,
    checkAction,
    getBlockingReason,
    getTimeUntilAvailable,
  } = useConstraintStore();

  /**
   * Check if action is allowed
   */
  const canPerformAction = (action: string): boolean => {
    return checkAction(action);
  };

  /**
   * Get blocking reason for action
   */
  const getActionBlockingReason = (action: string): string | null => {
    return getBlockingReason(action);
  };

  /**
   * Get time until action is available
   */
  const getTimeUntilActionAvailable = (action: string): number | null => {
    return getTimeUntilAvailable(action);
  };

  return {
    activeConstraints,
    blockingConstraints,
    warningConstraints,
    updateConstraints,
    canPerformAction,
    getActionBlockingReason,
    getTimeUntilActionAvailable,
  };
}
