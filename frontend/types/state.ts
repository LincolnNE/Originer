/**
 * Frontend State Type Definitions
 * 
 * Defines UI state types for frontend state management.
 * These are frontend-specific, focusing on UI control and user actions.
 */

// Session State (explicit enum, not booleans)
export type SessionState =
  | 'initializing'    // Session is being initialized
  | 'active'          // Session is active and ready
  | 'loading'         // Loading session data
  | 'paused'          // Session is paused
  | 'completed'       // Session is completed
  | 'error';          // Session error state

// Lesson UI State
export type LessonUIState = 
  | 'idle'              // Screen loaded, waiting for user action
  | 'loading'           // Loading screen content or state
  | 'ready'             // Ready for interaction
  | 'interacting'       // User is actively interacting (typing, selecting)
  | 'submitting'        // Submission in progress (cannot cancel)
  | 'streaming'         // Receiving instructor response via SSE
  | 'processing'        // Processing response, updating state
  | 'error'             // Error state, can retry
  | 'blocked';          // Blocked by constraint (shows reason)

export interface LessonState {
  screenId: string;
  uiState: LessonUIState;
  navigationState: NavigationState;
  interactionAvailability: InteractionAvailability;
  visualState: VisualState;
  syncStatus: SyncStatus;
}

export interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  canSkip: boolean;
  availableScreens: string[];
  lockedScreens: string[];
  lockedReason?: string;
}

export interface InteractionAvailability {
  canSubmit: boolean;
  canAskQuestion: boolean;
  canRequestHelp: boolean;
  canRetry: boolean;
  canCancel: boolean;
  canEdit: boolean;
}

export interface VisualState {
  showProgress: boolean;
  showTimer: boolean;
  showConstraints: boolean;
  showFeedback: boolean;
  showNextButton: boolean;
  showSubmitButton: boolean;
  disabledActions: string[];
}

export interface SyncStatus {
  isSynced: boolean;
  lastSyncedAt: Date | null;
  pendingChanges: boolean;
  syncError: string | null;
}

// Progress State
export interface ProgressState {
  screenProgress: ScreenProgressUI;
  sessionProgress: SessionProgressUI;
  masteryState: MasteryState;
  unlockState: UnlockState;
}

export interface ScreenProgressUI {
  screenId: string;
  currentAttempt: number;
  maxAttempts: number;
  timeSpent: number;
  minTimeRequired: number;
  score: number | null;
  masteryThreshold: number;
  conceptsDemonstrated: string[];
  canProceed: boolean;
  proceedReason?: string;
  progressPercentage: number;
}

export interface SessionProgressUI {
  sessionId: string;
  screensCompleted: number;
  totalScreens: number;
  conceptsIntroduced: string[];
  conceptsMastered: string[];
  currentConcept: string | null;
  nextConcept: string | null;
  overallProgress: number;
}

export type MasteryLevel = 
  | 'not_started'
  | 'introduced'
  | 'practicing'
  | 'near_mastery'
  | 'mastered';

export interface MasteryState {
  currentConcept: string;
  masteryLevel: MasteryLevel;
  masteryScore: number;
  masteryThreshold: number;
  isMastered: boolean;
  masteryEvidence: string[];
  nextLevelUnlocked: boolean;
}

export interface UnlockState {
  nextScreenId: string | null;
  isUnlocked: boolean;
  unlockRequirements: UnlockRequirement[];
  unmetRequirements: UnlockRequirement[];
  estimatedUnlockTime: Date | null;
}

export interface UnlockRequirement {
  type: 'prerequisite' | 'mastery' | 'time' | 'attempts';
  description: string;
  isMet: boolean;
  currentValue: number | string;
  requiredValue: number | string;
}

// Constraint State
export type ConstraintType = 
  | 'rate_limit'
  | 'cooldown'
  | 'min_time'
  | 'max_attempts'
  | 'required_attempts'
  | 'mastery_threshold'
  | 'prerequisite'
  | 'session_limit';

export type ConstraintStatus = 
  | 'active'
  | 'warning'
  | 'blocking'
  | 'satisfied'
  | 'expired';

export interface UIConstraint {
  constraintId: string;
  type: ConstraintType;
  status: ConstraintStatus;
  currentValue: number;
  limitValue: number;
  timeRemaining: number | null;
  violationCount: number;
  isBlocking: boolean;
  blockingActions: string[];
  message: string;
}

export interface ActiveConstraints {
  constraints: UIConstraint[];
  blockingConstraints: UIConstraint[];
  warningConstraints: UIConstraint[];
  canPerformAction: (action: string) => boolean;
  getBlockingReason: (action: string) => string | null;
  getTimeUntilAvailable: (action: string) => number | null;
}

// Interaction Mode
export type ModeType = 
  | 'reading'
  | 'question'
  | 'practice'
  | 'assessment'
  | 'reflection'
  | 'waiting';

export type SubModeType = 
  | 'guided'
  | 'independent'
  | 'correcting';

export interface InteractionMode {
  mode: ModeType;
  subMode: SubModeType | null;
  allowedActions: AllowedActions;
  inputState: InputState;
  feedbackState: FeedbackState;
  transitionRules: TransitionRules;
}

export interface AllowedActions {
  canType: boolean;
  canSubmit: boolean;
  canEdit: boolean;
  canAskQuestion: boolean;
  canRequestHelp: boolean;
  canSkip: boolean;
  canNavigate: boolean;
  canPause: boolean;
}

export interface InputState {
  isEnabled: boolean;
  placeholder: string;
  maxLength: number;
  minLength: number;
  required: boolean;
  validationRules: ValidationRule[];
  currentValue: string;
  isValid: boolean;
  validationErrors: string[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  message: string;
  validate: (value: string) => boolean;
}

export interface FeedbackState {
  isVisible: boolean;
  type: FeedbackType;
  content: string;
  isStreaming: boolean;
  canDismiss: boolean;
}

export type FeedbackType = 
  | 'guidance'
  | 'correction'
  | 'encouragement'
  | 'hint'
  | 'error';

export interface TransitionRules {
  canTransitionTo: (mode: ModeType) => boolean;
  requiredBeforeTransition: string[];
  transitionMessage?: string;
}
