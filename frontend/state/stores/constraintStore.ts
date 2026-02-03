/**
 * Constraint Store
 * 
 * Manages active constraints and enforcement.
 * 
 * State Ownership: Frontend (calculated from backend constraints)
 */

import { create } from 'zustand';
import { ConstraintStore } from './types';
import { UIConstraint } from '../../types/state';

const createActiveConstraints = (constraints: UIConstraint[]) => {
  const blockingConstraints = constraints.filter(c => c.isBlocking);
  const warningConstraints = constraints.filter(c => c.status === 'warning');
  
  return {
    constraints,
    blockingConstraints,
    warningConstraints,
    canPerformAction: (action: string) => {
      return !blockingConstraints.some(c => c.blockingActions.includes(action));
    },
    getBlockingReason: (action: string) => {
      const blocking = blockingConstraints.find(c => c.blockingActions.includes(action));
      return blocking?.message || null;
    },
    getTimeUntilAvailable: (action: string) => {
      const blocking = blockingConstraints.find(c => c.blockingActions.includes(action));
      return blocking?.timeRemaining || null;
    },
  };
};

export const useConstraintStore = create<ConstraintStore>((set, get) => ({
  // Initial state
  activeConstraints: createActiveConstraints([]),
  blockingConstraints: [],
  warningConstraints: [],
  
  // Actions
  updateConstraints: (constraints) => {
    const activeConstraints = createActiveConstraints(constraints);
    set({
      activeConstraints,
      blockingConstraints: activeConstraints.blockingConstraints,
      warningConstraints: activeConstraints.warningConstraints,
    });
  },
  
  checkAction: (action) => {
    return get().activeConstraints.canPerformAction(action);
  },
  
  getBlockingReason: (action) => {
    return get().activeConstraints.getBlockingReason(action);
  },
  
  getTimeUntilAvailable: (action) => {
    return get().activeConstraints.getTimeUntilAvailable(action);
  },
}));
