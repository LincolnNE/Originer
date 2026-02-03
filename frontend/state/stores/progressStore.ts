/**
 * Progress Store
 * 
 * Manages progress tracking and visualization.
 * 
 * State Ownership: Frontend (optimistic), Backend (authoritative)
 */

import { create } from 'zustand';
import { ProgressStore } from './types';
import { ScreenProgressUI, SessionProgressUI, MasteryState, UnlockState } from '../../types/state';

export const useProgressStore = create<ProgressStore>((set, get) => ({
  // Initial state
  screenProgress: null,
  sessionProgress: null,
  masteryState: null,
  unlockState: null,
  
  // Actions
  updateScreenProgress: (progress) => set({ screenProgress: progress }),
  
  updateSessionProgress: (progress) => set({ sessionProgress: progress }),
  
  updateMasteryState: (state) => set({ masteryState: state }),
  
  updateUnlockState: (state) => set({ unlockState: state }),
  
  checkUnlockStatus: async (screenId) => {
    // TODO: Call API to check unlock status
    // For now, placeholder
    const unlockState: UnlockState = {
      nextScreenId: null,
      isUnlocked: false,
      unlockRequirements: [],
      unmetRequirements: [],
      estimatedUnlockTime: null,
    };
    set({ unlockState });
  },
}));
