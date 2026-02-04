/**
 * Lesson State Store
 * 
 * Manages current lesson screen UI state.
 * 
 * State Ownership: Frontend (UI state), Backend (screen state)
 */

import { create } from 'zustand';
import { LessonStateStore } from './types';
import { LessonState, LessonUIState } from '../../types/state';

export const useLessonStateStore = create<LessonStateStore>((set) => ({
  // Initial state
  currentScreenId: null,
  lessonState: null,
  availableScreens: [],
  lockedScreens: [],
  
  // Actions
  setCurrentScreen: (screenId) => set({ currentScreenId: screenId }),
  
  setLessonState: (state) => set({ lessonState: state }),
  
  updateLessonState: (updates) => set((state) => ({
    lessonState: state.lessonState ? { ...state.lessonState, ...updates } : null,
  })),
  
  transitionState: (newState: LessonUIState) => set((state) => ({
    lessonState: state.lessonState ? {
      ...state.lessonState,
      uiState: newState,
    } : null,
  })),
  
  setAvailableScreens: (screens) => set({ availableScreens: screens }),
  
  setLockedScreens: (screens) => set({ lockedScreens: screens }),
  
  lockScreen: (screenId: string, reason?: string) => set((state) => {
    if (!state.lockedScreens.includes(screenId)) {
      const newLockedScreens = [...state.lockedScreens, screenId];
      // Update lessonState navigationState if current screen
      if (state.lessonState && state.currentScreenId === screenId) {
        return {
          lockedScreens: newLockedScreens,
          lessonState: {
            ...state.lessonState,
            navigationState: {
              ...state.lessonState.navigationState,
              canGoForward: false,
              lockedReason: reason || 'Screen is locked',
            },
          },
        };
      }
      return { lockedScreens: newLockedScreens };
    }
    return state;
  }),
  
  unlockScreen: (screenId: string) => set((state) => {
    const newLockedScreens = state.lockedScreens.filter(id => id !== screenId);
    // Update lessonState navigationState if current screen
    if (state.lessonState && state.currentScreenId === screenId) {
      return {
        lockedScreens: newLockedScreens,
        lessonState: {
          ...state.lessonState,
          navigationState: {
            ...state.lessonState.navigationState,
            canGoForward: true,
            lockedReason: undefined,
          },
        },
      };
    }
    return { lockedScreens: newLockedScreens };
  }),
}));
