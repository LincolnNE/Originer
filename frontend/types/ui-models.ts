/**
 * Frontend-Only Domain Models
 * 
 * These types are frontend-specific and designed to make invalid UI states impossible.
 * They use discriminated unions and strict typing to enforce valid state transitions.
 * 
 * These models do NOT mirror backend models - they represent UI concerns only.
 * 
 * Design Principles:
 * 1. Discriminated Unions: Each state has a 'type' property that TypeScript uses for narrowing
 * 2. Mutually Exclusive Properties: Properties that don't make sense together are excluded
 * 3. Calculated Properties: Derived values are included to prevent inconsistencies
 * 4. Type Guards: Helper functions ensure runtime type safety
 * 5. React-Friendly: Plain interfaces work seamlessly with React state management
 * 
 * Usage:
 * - Use with useState<LessonUIState> for React state
 * - Use type guards (isInputEnabled, isSubmitting) for conditional logic
 * - Use discriminated unions in switch statements for exhaustive handling
 * - TypeScript will error if you try to access properties that don't exist for a state
 */

// ============================================================================
// LessonUIState - Discriminated Union for UI States
// ============================================================================

/**
 * Base UI state with common properties
 */
interface BaseUIState {
  screenId: string;
  timestamp: number; // Unix timestamp in milliseconds
}

/**
 * Idle state - Screen loaded, waiting for user action
 */
export interface IdleUIState extends BaseUIState {
  type: 'idle';
  canStart: boolean;
}

/**
 * Loading state - Loading screen content or state
 */
export interface LoadingUIState extends BaseUIState {
  type: 'loading';
  loadingReason: 'initial' | 'syncing' | 'navigating';
  progress?: number; // 0-100, optional
}

/**
 * Ready state - Ready for interaction
 */
export interface ReadyUIState extends BaseUIState {
  type: 'ready';
  inputEnabled: true;
  canSubmit: boolean;
  blockingReasons: string[]; // Empty if canSubmit is true
}

/**
 * Interacting state - User is actively interacting (typing, selecting)
 */
export interface InteractingUIState extends BaseUIState {
  type: 'interacting';
  inputEnabled: true;
  inputValue: string;
  canSubmit: boolean;
  validationErrors: string[]; // Empty if input is valid
}

/**
 * Submitting state - Submission in progress (cannot cancel)
 */
export interface SubmittingUIState extends BaseUIState {
  type: 'submitting';
  inputEnabled: false;
  submittedValue: string;
  submittedAt: number; // Unix timestamp
}

/**
 * Streaming state - Receiving instructor response via SSE
 */
export interface StreamingUIState extends BaseUIState {
  type: 'streaming';
  inputEnabled: false;
  submittedValue: string;
  streamedContent: string; // Partial content received so far
  canCancel: boolean;
  startedAt: number; // Unix timestamp
}

/**
 * Processing state - Processing response, updating state
 */
export interface ProcessingUIState extends BaseUIState {
  type: 'processing';
  inputEnabled: false;
  feedbackReceived: true;
  feedbackContent: string;
}

/**
 * Error state - Error occurred, can retry
 */
export interface ErrorUIState extends BaseUIState {
  type: 'error';
  errorCode: string;
  errorMessage: string;
  canRetry: boolean;
  canCancel: boolean;
  previousState: Exclude<LessonUIState, ErrorUIState>; // Previous state before error
}

/**
 * Blocked state - Blocked by constraint (shows reason)
 */
export interface BlockedUIState extends BaseUIState {
  type: 'blocked';
  inputEnabled: false;
  blockingConstraint: string;
  blockingReason: string;
  timeUntilAvailable: number | null; // Seconds, null if not time-based
}

/**
 * Discriminated union of all UI states
 * TypeScript will enforce that only valid properties exist for each state
 */
export type LessonUIState =
  | IdleUIState
  | LoadingUIState
  | ReadyUIState
  | InteractingUIState
  | SubmittingUIState
  | StreamingUIState
  | ProcessingUIState
  | ErrorUIState
  | BlockedUIState;

// ============================================================================
// AllowedInteraction - Discriminated Union for Allowed Actions
// ============================================================================

/**
 * Base interaction with common properties
 */
interface BaseInteraction {
  action: string;
  timestamp: number;
}

/**
 * Submit interaction - User can submit answer
 */
export interface SubmitInteraction extends BaseInteraction {
  type: 'submit';
  action: 'submit';
  enabled: boolean;
  blockingReasons: string[]; // Empty if enabled is true
  validationPassed: boolean;
}

/**
 * Hint interaction - User can request hint
 */
export interface HintInteraction extends BaseInteraction {
  type: 'hint';
  action: 'hint';
  enabled: boolean;
  hintsRemaining: number; // 0 if enabled is false
  blockingReason?: string; // Present if enabled is false
}

/**
 * Navigate interaction - User can navigate
 */
export interface NavigateInteraction extends BaseInteraction {
  type: 'navigate';
  action: 'navigate_back' | 'navigate_forward' | 'navigate_to';
  enabled: boolean;
  targetScreenId?: string; // Present if action is 'navigate_to'
  blockingReason?: string; // Present if enabled is false
}

/**
 * Edit interaction - User can edit answer
 */
export interface EditInteraction extends BaseInteraction {
  type: 'edit';
  action: 'edit';
  enabled: boolean;
  currentValue: string;
  canRevert: boolean; // Can revert to last submitted value
}

/**
 * Cancel interaction - User can cancel current operation
 */
export interface CancelInteraction extends BaseInteraction {
  type: 'cancel';
  action: 'cancel';
  enabled: boolean;
  cancelableOperation: 'submission' | 'streaming' | 'none'; // 'none' if enabled is false
}

/**
 * Retry interaction - User can retry failed operation
 */
export interface RetryInteraction extends BaseInteraction {
  type: 'retry';
  action: 'retry';
  enabled: boolean;
  retryableError: string; // Error code that can be retried
  maxRetries: number;
  currentRetries: number;
}

/**
 * Discriminated union of all allowed interactions
 */
export type AllowedInteraction =
  | SubmitInteraction
  | HintInteraction
  | NavigateInteraction
  | EditInteraction
  | CancelInteraction
  | RetryInteraction;

// ============================================================================
// InstructorActivity - What the Instructor is Currently Doing
// ============================================================================

/**
 * Base instructor activity
 */
interface BaseInstructorActivity {
  instructorId: string;
  timestamp: number;
}

/**
 * Presenting activity - Instructor is presenting problem/content
 */
export interface PresentingActivity extends BaseInstructorActivity {
  type: 'presenting';
  content: {
    problem: string;
    instructions: string;
    examples?: string[];
  };
  isComplete: true; // Content is fully loaded
}

/**
 * Waiting activity - Instructor is waiting for learner response
 */
export interface WaitingActivity extends BaseInstructorActivity {
  type: 'waiting';
  waitingFor: 'answer' | 'hint_request' | 'question';
  lastInteractionAt: number | null; // Timestamp of last learner interaction
}

/**
 * Analyzing activity - Instructor is analyzing learner's answer
 */
export interface AnalyzingActivity extends BaseInstructorActivity {
  type: 'analyzing';
  submittedAnswer: string;
  progress?: number; // 0-100, optional
  estimatedCompletion?: number; // Unix timestamp
}

/**
 * Providing feedback activity - Instructor is providing feedback
 */
export interface ProvidingFeedbackActivity extends BaseInstructorActivity {
  type: 'providing_feedback';
  feedbackType: 'guidance' | 'correction' | 'encouragement' | 'hint';
  content: string;
  isStreaming: boolean;
  streamedLength: number; // Characters streamed so far
  totalLength?: number; // Total expected length, if known
}

/**
 * Feedback complete activity - Instructor has completed feedback
 */
export interface FeedbackCompleteActivity extends BaseInstructorActivity {
  type: 'feedback_complete';
  feedbackContent: string;
  feedbackType: 'guidance' | 'correction' | 'encouragement' | 'hint';
  providedAt: number; // Unix timestamp
}

/**
 * Error activity - Instructor encountered an error
 */
export interface InstructorErrorActivity extends BaseInstructorActivity {
  type: 'error';
  errorCode: string;
  errorMessage: string;
  canRetry: boolean;
  retryableAt?: number; // Unix timestamp when retry is allowed
}

/**
 * Discriminated union of all instructor activities
 */
export type InstructorActivity =
  | PresentingActivity
  | WaitingActivity
  | AnalyzingActivity
  | ProvidingFeedbackActivity
  | FeedbackCompleteActivity
  | InstructorErrorActivity;

// ============================================================================
// ProgressSnapshot - Snapshot of Progress at a Point in Time
// ============================================================================

/**
 * Screen-level progress snapshot
 */
export interface ScreenProgressSnapshot {
  screenId: string;
  snapshotAt: number; // Unix timestamp
  
  // Attempt tracking
  attempts: {
    current: number;
    max: number;
    remaining: number; // Calculated: max - current
  };
  
  // Time tracking
  time: {
    spent: number; // Seconds spent on screen
    required: number; // Minimum seconds required (0 if not enforced)
    remaining: number; // Calculated: required - spent (0 if not enforced or met)
  };
  
  // Mastery tracking
  mastery: {
    score: number | null; // 0-100, null if not yet calculated
    threshold: number; // 0-100, required score to proceed
    isMet: boolean; // Calculated: score >= threshold (or false if score is null)
    progress: number; // 0-100, calculated progress toward threshold
  };
  
  // Concepts tracking
  concepts: {
    demonstrated: string[]; // Concepts demonstrated so far
    required: string[]; // Concepts required to proceed
    missing: string[]; // Calculated: required - demonstrated
  };
  
  // Progression status
  canProceed: boolean; // Calculated: all requirements met
  proceedReasons: string[]; // Reasons why can/cannot proceed
}

/**
 * Session-level progress snapshot
 */
export interface SessionProgressSnapshot {
  sessionId: string;
  snapshotAt: number; // Unix timestamp
  
  // Screen completion
  screens: {
    total: number;
    completed: number;
    active: number;
    locked: number;
    progress: number; // 0-100, calculated: (completed / total) * 100
  };
  
  // Concept mastery
  concepts: {
    introduced: string[]; // Concepts introduced in session
    mastered: string[]; // Concepts mastered in session
    practicing: string[]; // Concepts currently being practiced
    progress: number; // 0-100, calculated: (mastered.length / introduced.length) * 100
  };
  
  // Current focus
  current: {
    screenId: string | null;
    concept: string | null;
    learningObjective: string | null;
  };
  
  // Next focus
  next: {
    screenId: string | null;
    concept: string | null;
    isUnlocked: boolean;
    unlockRequirements: string[]; // Requirements to unlock next screen
  };
  
  // Overall progress
  overallProgress: number; // 0-100, calculated overall session progress
}

/**
 * Complete progress snapshot combining screen and session
 */
export interface ProgressSnapshot {
  screen: ScreenProgressSnapshot;
  session: SessionProgressSnapshot;
  snapshotAt: number; // Unix timestamp (same for both screen and session)
}

// ============================================================================
// Type Guards and Helpers
// ============================================================================

/**
 * Type guard to check if UI state allows input
 */
export function isInputEnabled(state: LessonUIState): state is ReadyUIState | InteractingUIState {
  return state.type === 'ready' || state.type === 'interacting';
}

/**
 * Type guard to check if UI state is in submission flow
 */
export function isSubmitting(state: LessonUIState): state is SubmittingUIState | StreamingUIState {
  return state.type === 'submitting' || state.type === 'streaming';
}

/**
 * Type guard to check if UI state has feedback
 */
export function hasFeedback(state: LessonUIState): state is ProcessingUIState {
  return state.type === 'processing';
}

/**
 * Type guard to check if instructor is providing feedback
 */
export function isInstructorProvidingFeedback(activity: InstructorActivity): activity is ProvidingFeedbackActivity {
  return activity.type === 'providing_feedback';
}

/**
 * Type guard to check if interaction is enabled
 */
export function isInteractionEnabled(interaction: AllowedInteraction): boolean {
  return interaction.enabled;
}

/**
 * Helper to get blocking reasons from UI state
 */
export function getBlockingReasons(state: LessonUIState): string[] {
  switch (state.type) {
    case 'ready':
      return state.blockingReasons;
    case 'blocked':
      return [state.blockingReason];
    case 'error':
      return [state.errorMessage];
    default:
      return [];
  }
}

/**
 * Helper to check if progress snapshot allows progression
 */
export function canProceedFromSnapshot(snapshot: ScreenProgressSnapshot): boolean {
  return snapshot.canProceed;
}
