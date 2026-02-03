# Frontend Domain Models

## Overview

Frontend domain models focus on **UI state**, **user control**, and **preventing invalid actions**. These models complement backend models but are frontend-specific, focusing on what the user can see and do, not backend persistence or learning logic.

**Key Principle**: These models enable the frontend to make immediate UI decisions without waiting for backend validation, while still respecting backend authority.

---

## Core Frontend Models

### LessonState

**Purpose**: Represents the UI state of a lesson screen from the user's perspective. Controls what actions are available and what the UI should display.

```typescript
interface LessonState {
  screenId: string;
  uiState: LessonUIState;
  navigationState: NavigationState;
  interactionAvailability: InteractionAvailability;
  visualState: VisualState;
  syncStatus: SyncStatus;
}

type LessonUIState = 
  | 'idle'              // Screen loaded, waiting for user action
  | 'loading'           // Loading screen content or state
  | 'ready'             // Ready for interaction
  | 'interacting'       // User is actively interacting (typing, selecting)
  | 'submitting'        // Submission in progress (cannot cancel)
  | 'streaming'         // Receiving instructor response via SSE
  | 'processing'        // Processing response, updating state
  | 'error'             // Error state, can retry
  | 'blocked';          // Blocked by constraint (shows reason)

interface NavigationState {
  canGoBack: boolean;           // Can navigate to previous screen
  canGoForward: boolean;         // Can navigate to next screen
  canSkip: boolean;              // Can skip current screen (if allowed)
  availableScreens: string[];   // Screen IDs user can navigate to
  lockedScreens: string[];       // Screen IDs that are locked
  lockedReason?: string;        // Why next screen is locked
}

interface InteractionAvailability {
  canSubmit: boolean;            // Can submit current interaction
  canAskQuestion: boolean;       // Can ask a question
  canRequestHelp: boolean;       // Can request help (limited)
  canRetry: boolean;             // Can retry after error
  canCancel: boolean;            // Can cancel current operation
  canEdit: boolean;              // Can edit previous submission
}

interface VisualState {
  showProgress: boolean;         // Show progress indicator
  showTimer: boolean;            // Show time spent indicator
  showConstraints: boolean;      // Show constraint warnings
  showFeedback: boolean;         // Show instructor feedback area
  showNextButton: boolean;       // Show "Next" button
  showSubmitButton: boolean;     // Show "Submit" button
  disabledActions: string[];     // Action IDs that are disabled
}

interface SyncStatus {
  isSynced: boolean;             // UI state matches backend
  lastSyncedAt: Date | null;     // Last successful sync
  pendingChanges: boolean;       // Has unsaved changes
  syncError: string | null;      // Last sync error
}
```

**Key Features**:
- **Prevents invalid actions**: `interactionAvailability` explicitly controls what user can do
- **UI control**: `visualState` controls what UI elements are shown/enabled
- **Navigation control**: `navigationState` prevents navigation to locked screens
- **State machine**: `uiState` ensures valid state transitions

**Usage Example**:
```typescript
// Prevent submission if not ready
if (lessonState.uiState !== 'ready' && lessonState.uiState !== 'interacting') {
  return; // Cannot submit
}

// Disable button based on availability
const submitDisabled = !lessonState.interactionAvailability.canSubmit;

// Show locked reason
if (!lessonState.navigationState.canGoForward) {
  showMessage(lessonState.navigationState.lockedReason);
}
```

---

### ProgressState

**Purpose**: Tracks and controls progress visualization and progression. Prevents advancing without meeting requirements.

```typescript
interface ProgressState {
  screenProgress: ScreenProgressUI;
  sessionProgress: SessionProgressUI;
  masteryState: MasteryState;
  unlockState: UnlockState;
}

interface ScreenProgressUI {
  screenId: string;
  currentAttempt: number;
  maxAttempts: number;
  timeSpent: number;              // Seconds spent on screen (client-tracked)
  minTimeRequired: number;        // Minimum time before proceeding
  score: number | null;           // Current score (0-100)
  masteryThreshold: number;       // Score needed to proceed
  conceptsDemonstrated: string[]; // Concepts shown in UI
  canProceed: boolean;           // Can proceed to next screen
  proceedReason?: string;        // Why can/cannot proceed
  progressPercentage: number;     // 0-100 for UI display
}

interface SessionProgressUI {
  sessionId: string;
  screensCompleted: number;
  totalScreens: number;
  conceptsIntroduced: string[];
  conceptsMastered: string[];
  currentConcept: string | null;
  nextConcept: string | null;
  overallProgress: number;        // 0-100 for UI display
}

interface MasteryState {
  currentConcept: string;
  masteryLevel: MasteryLevel;
  masteryScore: number;           // 0-100
  masteryThreshold: number;       // Score needed for mastery
  isMastered: boolean;
  masteryEvidence: string[];      // Evidence of mastery (attempts, scores)
  nextLevelUnlocked: boolean;     // Next difficulty level unlocked
}

type MasteryLevel = 
  | 'not_started'
  | 'introduced'
  | 'practicing'
  | 'near_mastery'
  | 'mastered';

interface UnlockState {
  nextScreenId: string | null;
  isUnlocked: boolean;
  unlockRequirements: UnlockRequirement[];
  unmetRequirements: UnlockRequirement[];
  estimatedUnlockTime: Date | null;
}

interface UnlockRequirement {
  type: 'prerequisite' | 'mastery' | 'time' | 'attempts';
  description: string;
  isMet: boolean;
  currentValue: number | string;
  requiredValue: number | string;
}
```

**Key Features**:
- **Prevents premature progression**: `canProceed` and `unlockState` prevent skipping ahead
- **Visual feedback**: Progress percentages for UI display
- **Requirement tracking**: Shows what's needed to unlock next screen
- **Mastery validation**: Tracks mastery state to prevent advancing without mastery

**Usage Example**:
```typescript
// Prevent navigation if requirements not met
if (!progressState.screenProgress.canProceed) {
  showUnlockRequirements(progressState.unlockState.unmetRequirements);
  return;
}

// Show progress bar
const progress = progressState.screenProgress.progressPercentage;
updateProgressBar(progress);

// Check mastery before allowing assessment
if (progressState.masteryState.masteryLevel !== 'near_mastery') {
  disableAssessmentButton();
}
```

---

### UIConstraint

**Purpose**: Represents active constraints that control user actions. Prevents invalid actions at the UI level.

```typescript
interface UIConstraint {
  constraintId: string;
  type: ConstraintType;
  status: ConstraintStatus;
  currentValue: number;
  limitValue: number;
  timeRemaining: number | null;    // Seconds until constraint lifts
  violationCount: number;
  isBlocking: boolean;             // Is this constraint currently blocking actions
  blockingActions: string[];        // Actions blocked by this constraint
  message: string;                 // User-facing message
}

type ConstraintType = 
  | 'rate_limit'           // Too many requests per minute
  | 'cooldown'             // Must wait between attempts
  | 'min_time'             // Minimum time on screen
  | 'max_attempts'         // Maximum attempts reached
  | 'required_attempts'    // Minimum attempts required
  | 'mastery_threshold'     // Mastery score not met
  | 'prerequisite'          // Prerequisites not met
  | 'session_limit';        // Session-level limit

type ConstraintStatus = 
  | 'active'               // Constraint is active and enforced
  | 'warning'              // Approaching limit (show warning)
  | 'blocking'             // Currently blocking actions
  | 'satisfied'             // Constraint satisfied, not blocking
  | 'expired';              // Constraint no longer applies

interface ActiveConstraints {
  constraints: UIConstraint[];
  blockingConstraints: UIConstraint[];  // Constraints currently blocking
  warningConstraints: UIConstraint[];   // Constraints showing warnings
  canPerformAction: (action: string) => boolean;
  getBlockingReason: (action: string) => string | null;
  getTimeUntilAvailable: (action: string) => number | null;
}
```

**Key Features**:
- **Action blocking**: Explicitly blocks specific actions
- **Time-based constraints**: Tracks time remaining for cooldowns
- **Warning system**: Shows warnings before blocking
- **Action checking**: `canPerformAction` prevents invalid actions

**Usage Example**:
```typescript
// Check if action is allowed
if (!activeConstraints.canPerformAction('submit')) {
  const reason = activeConstraints.getBlockingReason('submit');
  showError(reason);
  return;
}

// Show cooldown timer
const timeRemaining = activeConstraints.getTimeUntilAvailable('submit');
if (timeRemaining) {
  showCooldownTimer(timeRemaining);
}

// Disable button if blocked
const submitBlocked = activeConstraints.blockingConstraints.some(
  c => c.blockingActions.includes('submit')
);
```

---

### InteractionMode

**Purpose**: Defines the current interaction mode, controlling what the user can do and how the UI behaves.

```typescript
interface InteractionMode {
  mode: ModeType;
  subMode: SubModeType | null;
  allowedActions: AllowedActions;
  inputState: InputState;
  feedbackState: FeedbackState;
  transitionRules: TransitionRules;
}

type ModeType = 
  | 'reading'            // Reading content, no interaction
  | 'question'           // Answering a question
  | 'practice'          // Practicing exercises
  | 'assessment'        // Taking assessment (no help)
  | 'reflection'         // Reflecting on learning
  | 'waiting';           // Waiting for instructor response

type SubModeType = 
  | 'guided'             // With instructor guidance
  | 'independent'        // Without immediate help
  | 'correcting';        // Correcting misconceptions

interface AllowedActions {
  canType: boolean;              // Can type in input field
  canSubmit: boolean;            // Can submit response
  canEdit: boolean;              // Can edit previous response
  canAskQuestion: boolean;      // Can ask clarifying question
  canRequestHelp: boolean;      // Can request help (limited)
  canSkip: boolean;              // Can skip current item
  canNavigate: boolean;          // Can navigate to other screens
  canPause: boolean;            // Can pause session
}

interface InputState {
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

interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  message: string;
  validate: (value: string) => boolean;
}

interface FeedbackState {
  isVisible: boolean;
  type: FeedbackType;
  content: string;
  isStreaming: boolean;
  canDismiss: boolean;
}

type FeedbackType = 
  | 'guidance'           // Instructor guidance
  | 'correction'         // Correcting mistake
  | 'encouragement'      // Encouragement
  | 'hint'               // Hint (limited)
  | 'error';             // Error message

interface TransitionRules {
  canTransitionTo: (mode: ModeType) => boolean;
  requiredBeforeTransition: string[];  // Actions required before transition
  transitionMessage?: string;          // Message shown on transition
}
```

**Key Features**:
- **Mode-based control**: Different modes allow different actions
- **Input validation**: Prevents invalid input before submission
- **Action restrictions**: `allowedActions` explicitly controls what's possible
- **Transition control**: Prevents invalid mode transitions

**Usage Example**:
```typescript
// Check if action is allowed in current mode
if (!interactionMode.allowedActions.canSubmit) {
  return; // Cannot submit in current mode
}

// Validate input before submission
if (!interactionMode.inputState.isValid) {
  showValidationErrors(interactionMode.inputState.validationErrors);
  return;
}

// Check mode transition
if (!interactionMode.transitionRules.canTransitionTo('assessment')) {
  showMessage(interactionMode.transitionRules.transitionMessage);
  return;
}

// Disable input in assessment mode
if (interactionMode.mode === 'assessment') {
  disableHelpButton();
  disableQuestionButton();
}
```

---

## Supporting Types

### State Machine Types

```typescript
// LessonState UI state transitions
type LessonStateTransition = 
  | 'idle → loading'
  | 'loading → ready'
  | 'ready → interacting'
  | 'interacting → submitting'
  | 'submitting → streaming'
  | 'streaming → processing'
  | 'processing → ready'
  | 'ready → error'
  | 'error → ready'
  | 'ready → blocked'
  | 'blocked → ready';

// Interaction mode transitions
type ModeTransition = 
  | 'reading → question'
  | 'question → practice'
  | 'practice → assessment'
  | 'assessment → reflection'
  | 'reflection → reading';
```

### Validation Helpers

```typescript
interface ActionValidator {
  canPerform: (action: string, state: LessonState) => boolean;
  getBlockingReasons: (action: string, state: LessonState) => string[];
  validateTransition: (from: LessonUIState, to: LessonUIState) => boolean;
}

interface ConstraintChecker {
  checkConstraints: (action: string, constraints: UIConstraint[]) => ConstraintCheckResult;
  getTimeUntilAvailable: (action: string, constraints: UIConstraint[]) => number | null;
}

interface ConstraintCheckResult {
  isAllowed: boolean;
  blockingConstraints: UIConstraint[];
  warnings: UIConstraint[];
  timeUntilAvailable: number | null;
}
```

---

## Design Principles

### 1. Prevent Invalid Actions
All models include explicit checks that prevent invalid user actions:
- `interactionAvailability.canSubmit` prevents submission when not ready
- `allowedActions` restricts actions based on mode
- `canPerformAction` checks constraints before allowing actions

### 2. Frontend-Specific, Not Duplicated
These models focus on UI concerns:
- **Backend `ScreenState`**: Backend authority (locked/unlocked/active/completed)
- **Frontend `LessonState`**: UI state (idle/ready/interacting/streaming)
- **Backend `ScreenProgress`**: Learning progress (attempts, scores, mastery)
- **Frontend `ProgressState`**: UI progress display and navigation control

### 3. User Control and Flow
Models enable frontend to:
- Control navigation (prevent going to locked screens)
- Control interactions (disable buttons, show warnings)
- Control input (validate before submission)
- Control transitions (prevent invalid mode changes)

### 4. Optimistic UI with Validation
Frontend can:
- Update UI optimistically for immediate feedback
- Validate constraints client-side before API calls
- Show warnings before blocking actions
- Reconcile with backend state when sync occurs

---

## Usage Patterns

### Pattern 1: Prevent Invalid Submission

```typescript
function canSubmitAnswer(
  lessonState: LessonState,
  interactionMode: InteractionMode,
  constraints: ActiveConstraints
): boolean {
  // Check UI state
  if (lessonState.uiState !== 'ready' && lessonState.uiState !== 'interacting') {
    return false;
  }
  
  // Check interaction mode
  if (!interactionMode.allowedActions.canSubmit) {
    return false;
  }
  
  // Check input validation
  if (!interactionMode.inputState.isValid) {
    return false;
  }
  
  // Check constraints
  if (!constraints.canPerformAction('submit')) {
    return false;
  }
  
  return true;
}
```

### Pattern 2: Control Navigation

```typescript
function canNavigateToScreen(
  targetScreenId: string,
  progressState: ProgressState,
  lessonState: LessonState
): boolean {
  // Check if screen is locked
  if (lessonState.navigationState.lockedScreens.includes(targetScreenId)) {
    return false;
  }
  
  // Check if current screen allows navigation
  if (!lessonState.navigationState.canGoForward) {
    return false;
  }
  
  // Check unlock requirements
  if (targetScreenId === progressState.unlockState.nextScreenId) {
    if (!progressState.unlockState.isUnlocked) {
      return false;
    }
  }
  
  return true;
}
```

### Pattern 3: Show Constraint Warnings

```typescript
function getConstraintWarnings(
  constraints: ActiveConstraints,
  action: string
): string[] {
  return constraints.warningConstraints
    .filter(c => c.blockingActions.includes(action))
    .map(c => c.message);
}
```

---

## Summary

**LessonState**: Controls UI state, navigation, and interaction availability
**ProgressState**: Tracks progress, mastery, and unlock requirements
**UIConstraint**: Enforces constraints and blocks invalid actions
**InteractionMode**: Defines interaction mode and allowed actions

All models work together to:
- ✅ Prevent invalid user actions
- ✅ Control UI flow and navigation
- ✅ Provide immediate feedback
- ✅ Respect backend authority while enabling optimistic UI
