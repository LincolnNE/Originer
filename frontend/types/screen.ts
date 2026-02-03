/**
 * Screen Type Definitions
 * 
 * Defines lesson screen structure and types.
 * Frontend represents a classroom, not a chat app.
 */

export type ScreenType = 
  | 'guided_practice'        // MVP: Single screen type
  | 'concept_introduction'   // Future
  | 'independent_practice'   // Future
  | 'assessment'              // Future
  | 'mastery_check'          // Future
  | 'misconception_correction'; // Future

export type ScreenState = 
  | 'not_started'
  | 'active'
  | 'completed'
  | 'locked';

export interface LessonScreen {
  // Identity
  screenId: string;
  sessionId: string;
  screenType: ScreenType;
  
  // Content
  concept: string;
  learningObjective: string;
  content: ScreenContent;
  
  // State
  state: ScreenState;
  progress: ScreenProgress;
  constraints: ScreenConstraints;
  
  // Navigation
  navigation: ScreenNavigation;
}

export interface ScreenContent {
  problem: string;
  instructions: string;
  examples?: string[];
  hintsAvailable: number;
  maxAttempts: number;
  additionalContext?: string;
}

export interface ScreenProgress {
  attempts: number;
  timeSpent: number;          // Seconds (client-tracked)
  masteryScore: number | null; // 0-100
  canProceed: boolean;
  conceptsDemonstrated: string[];
}

export interface ScreenConstraints {
  minTimeOnScreen: number;        // Seconds
  requiredAttempts: number;
  masteryThreshold: number;      // 0-100
  cooldownBetweenAttempts: number; // Seconds
  rateLimitPerMinute: number;
  maxAttempts: number;
}

export interface ScreenNavigation {
  canGoBack: boolean;
  canGoForward: boolean;
  nextScreenId: string | null;
  nextScreenUnlocked: boolean;
  unlockRequirements: UnlockRequirement[];
}

export interface UnlockRequirement {
  type: 'prerequisite' | 'mastery' | 'time' | 'attempts';
  description: string;
  isMet: boolean;
  currentValue: number | string;
  requiredValue: number | string;
}
