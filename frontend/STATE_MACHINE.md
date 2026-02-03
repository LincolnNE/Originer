# Frontend State Machine

## Overview

**System Type**: Lesson-based learning system (classroom), not a chat app  
**Principle**: Explicit states with explicit transitions. UI blocks invalid actions.

---

## State Machine Definition

### State Diagram

```
┌─────────┐
│  IDLE   │
└────┬────┘
     │ (start learning)
     ▼
┌─────────────────┐
│ ASSESSING_LEVEL │ (optional, MVP: skip)
└────┬────────────┘
     │ (assessment complete)
     ▼
┌─────────────┐
│  IN_LESSON  │◄────┐
└────┬────────┘     │
     │ (submit)     │ (revise)
     ▼              │
┌──────────────────┐│
│AWAITING_FEEDBACK ││
└────┬─────────────┘│
     │ (feedback)   │
     ▼              │
┌─────────────┐     │
│  REVIEWING  │─────┘
└────┬────────┘
     │ (proceed) or (session complete)
     ▼
┌─────────────┐
│  COMPLETED  │
└─────────────┘

Any state ──(error)──► ERROR ──(retry)──► Previous state
```

---

## State Definitions

### 1. IDLE

**Purpose**: Initial state before learning begins.

**Description**: User has not started a learning session. Landing page is displayed.

**Allowed User Actions**:
- ✅ `startLearning()` - Start a new learning session
- ✅ `continueSession(sessionId)` - Resume existing session (future)
- ✅ `viewDashboard()` - View dashboard (future)

**Forbidden Actions**:
- ❌ Submit answer
- ❌ Request hint
- ❌ Navigate to lesson screen
- ❌ Complete lesson
- ❌ Any lesson-specific actions

**UI Behavior**:
- Show "Start Learning" button
- Disable all lesson-related UI elements
- No lesson content displayed
- No progress indicators

**Transitions**:
- **To `ASSESSING_LEVEL`**: User clicks "Start Learning" AND assessment enabled
- **To `IN_LESSON`**: User clicks "Start Learning" AND assessment disabled (MVP)
- **To `ERROR`**: Session creation fails

**State Data**:
- No session ID
- No screen ID
- No lesson state

---

### 2. ASSESSING_LEVEL

**Purpose**: User is taking level assessment to determine starting point.

**Description**: Assessment flow to determine learner's level. Optional for MVP (can skip).

**Allowed User Actions**:
- ✅ `submitAssessmentAnswer(answer)` - Submit assessment answer
- ✅ `requestAssessmentHint()` - Request hint (if allowed)
- ✅ `completeAssessment()` - Complete assessment

**Forbidden Actions**:
- ❌ Start lesson (must complete assessment first)
- ❌ Navigate to lesson screens
- ❌ Skip assessment (unless explicitly allowed)
- ❌ Edit previous assessment answers (if locked)

**UI Behavior**:
- Show assessment questions
- Show assessment progress
- Disable lesson navigation
- Show "Complete Assessment" button when done
- No lesson content displayed

**Transitions**:
- **To `IN_LESSON`**: Assessment completed successfully
- **To `ERROR`**: Assessment submission fails
- **To `IDLE`**: User cancels assessment (if allowed)

**State Data**:
- Session ID (created)
- Assessment screen ID
- Assessment answers
- Assessment progress

**MVP Note**: This state can be skipped. MVP goes directly from `IDLE` to `IN_LESSON`.

---

### 3. IN_LESSON

**Purpose**: User is actively engaged in a lesson screen.

**Description**: User is on a lesson screen, can read content, type answers, and interact with the learning material.

**Sub-States** (internal to IN_LESSON):
- `reading` - Reading problem/content
- `typing` - Typing answer
- `ready` - Ready to submit

**Allowed User Actions**:
- ✅ `typeAnswer(text)` - Type answer in input field
- ✅ `submitAnswer(answer)` - Submit answer (if constraints met)
- ✅ `requestHint()` - Request hint (if available)
- ✅ `navigateBack()` - Navigate to previous screen (if allowed)
- ✅ `askQuestion(question)` - Ask clarifying question (if allowed)
- ✅ `viewProgress()` - View progress indicator
- ✅ `pauseSession()` - Pause session (future)

**Forbidden Actions**:
- ❌ Submit answer if constraints violated (rate limit, cooldown, max attempts)
- ❌ Navigate forward if screen not unlocked
- ❌ Request hint if hints exhausted
- ❌ Complete lesson if mastery not achieved
- ❌ Skip screen if prerequisites not met

**UI Behavior**:
- Show lesson content (problem, instructions)
- Show answer input field (enabled)
- Show "Submit" button (enabled if constraints met, disabled otherwise)
- Show "Request Hint" button (enabled if hints available)
- Show progress indicator
- Show constraint warnings (if approaching limits)
- Show navigation buttons (back enabled, forward disabled if locked)
- Hide feedback area (not yet received)

**Constraint Checks** (must pass before allowing submit):
- Rate limit not exceeded
- Cooldown period elapsed
- Max attempts not reached
- Minimum time on screen met (if enforced)
- Input validation passed

**Transitions**:
- **To `AWAITING_FEEDBACK`**: User submits answer AND constraints met
- **To `REVIEWING`**: User completes screen (mastery achieved) AND clicks "Next"
- **To `COMPLETED`**: User completes final screen AND session complete
- **To `ERROR`**: API call fails, network error, or constraint violation

**State Data**:
- Session ID
- Screen ID
- Current answer text (draft)
- Attempt count
- Time spent on screen
- Constraints status
- Screen content

---

### 4. AWAITING_FEEDBACK

**Purpose**: User has submitted answer, waiting for instructor response.

**Description**: Answer submitted successfully, instructor response is being generated/streamed.

**Allowed User Actions**:
- ✅ `cancelSubmission()` - Cancel and return to IN_LESSON (if streaming)
- ✅ `viewProgress()` - View progress indicator
- ✅ `wait()` - Wait for response (no action needed)

**Forbidden Actions**:
- ❌ Submit another answer (must wait for current response)
- ❌ Request hint (response pending)
- ❌ Navigate away (response pending)
- ❌ Edit answer (already submitted)
- ❌ Complete lesson (response pending)

**UI Behavior**:
- Show "Submitting..." or "Waiting for instructor..." message
- Show loading indicator
- Disable submit button
- Disable answer input field
- Show "Cancel" button (if streaming can be cancelled)
- Show progress indicator (if available)
- Hide feedback area (not yet received)

**SSE Streaming** (if implemented):
- Show streaming response as it arrives
- Update UI incrementally
- Allow cancellation during streaming

**Transitions**:
- **To `REVIEWING`**: Instructor response received (complete)
- **To `IN_LESSON`**: User cancels submission (if allowed)
- **To `ERROR`**: Response generation fails, network error, timeout

**State Data**:
- Session ID
- Screen ID
- Submitted answer
- Submission timestamp
- Response status (streaming, complete, error)

**Timeout Handling**:
- If response delayed > 30 seconds: Show timeout warning
- If response fails: Transition to ERROR
- Allow retry from ERROR state

---

### 5. REVIEWING

**Purpose**: User is reviewing instructor feedback and deciding next action.

**Description**: Instructor response received, user can review feedback and choose to revise answer or proceed.

**Allowed User Actions**:
- ✅ `reviseAnswer()` - Return to IN_LESSON to revise answer
- ✅ `proceedToNext()` - Proceed to next screen (if unlocked)
- ✅ `completeScreen()` - Complete current screen (if mastery achieved)
- ✅ `requestHint()` - Request additional hint (if available)
- ✅ `askFollowUpQuestion(question)` - Ask follow-up question
- ✅ `viewProgress()` - View updated progress

**Forbidden Actions**:
- ❌ Submit same answer again (must revise first)
- ❌ Proceed if mastery not achieved (if required)
- ❌ Proceed if next screen locked
- ❌ Complete screen if requirements not met

**UI Behavior**:
- Show instructor feedback (complete response)
- Show "Revise Answer" button (enabled)
- Show "Next" button (enabled if can proceed, disabled if locked)
- Show "Complete Screen" button (enabled if mastery achieved)
- Show updated progress
- Show unlock requirements (if next screen locked)
- Answer input field disabled (or editable if revising)

**Constraint Checks** (for proceeding):
- Mastery threshold met (if required)
- Required attempts completed
- Minimum time on screen met
- Prerequisites met (for next screen)

**Transitions**:
- **To `IN_LESSON`**: User clicks "Revise Answer"
- **To `IN_LESSON`**: User proceeds to next screen (new screen loaded)
- **To `COMPLETED`**: User completes final screen AND session complete
- **To `ERROR`**: Navigation fails, screen unlock fails

**State Data**:
- Session ID
- Screen ID
- Instructor feedback (complete)
- Updated progress
- Unlock status
- Next screen ID (if unlocked)

---

### 6. COMPLETED

**Purpose**: Learning session or lesson screen completed.

**Description**: User has completed the learning session or reached a completion milestone.

**Allowed User Actions**:
- ✅ `startNewSession()` - Start a new learning session
- ✅ `viewSummary()` - View session summary
- ✅ `viewProgress()` - View overall progress
- ✅ `continueRelatedTopic()` - Continue with related topic (future)
- ✅ `returnToDashboard()` - Return to dashboard (future)

**Forbidden Actions**:
- ❌ Submit answers (session complete)
- ❌ Request hints (session complete)
- ❌ Navigate to lesson screens (session complete)
- ❌ Edit previous answers (session complete)

**UI Behavior**:
- Show completion message
- Show session summary
- Show progress visualization
- Show "Start New Session" button
- Hide lesson content
- Hide answer input
- Hide submit button

**Transitions**:
- **To `IDLE`**: User clicks "Start New Session"
- **To `IN_LESSON`**: User starts new session (new session created)
- **To `ASSESSING_LEVEL`**: User starts new session AND assessment enabled

**State Data**:
- Session ID (completed)
- Completion timestamp
- Session summary
- Final progress
- Concepts mastered

---

### 7. ERROR

**Purpose**: Error state when something goes wrong.

**Description**: An error occurred (API failure, network error, validation error, etc.). User can retry or reset.

**Allowed User Actions**:
- ✅ `retry()` - Retry the failed action
- ✅ `reset()` - Reset to IDLE state
- ✅ `goBack()` - Return to previous state (if recoverable)
- ✅ `reportError()` - Report error (future)

**Forbidden Actions**:
- ❌ Continue with lesson (error must be resolved)
- ❌ Submit answers (error state)
- ❌ Navigate (error state)

**UI Behavior**:
- Show error message (user-friendly)
- Show "Retry" button
- Show "Start Over" button
- Show error details (if in development mode)
- Disable all lesson actions
- Hide lesson content (or show error overlay)

**Error Types**:
- `NETWORK_ERROR` - Network failure, can retry
- `API_ERROR` - API returned error, can retry
- `VALIDATION_ERROR` - Constraint violation, can retry after fixing
- `TIMEOUT_ERROR` - Request timed out, can retry
- `SESSION_ERROR` - Session invalid, must reset

**Transitions**:
- **To Previous State**: User clicks "Retry" AND retry succeeds
- **To `IDLE`**: User clicks "Start Over" or "Reset"
- **To `IN_LESSON`**: User clicks "Go Back" AND error recoverable

**State Data**:
- Error type
- Error message
- Previous state (for recovery)
- Retry count
- Error timestamp

---

## State Transition Rules

### Explicit Transitions Only

**Rule**: States can only transition via explicit user actions or system events. No implicit transitions.

**Examples**:
- ✅ `IN_LESSON` → `AWAITING_FEEDBACK` (explicit: user clicks submit)
- ✅ `AWAITING_FEEDBACK` → `REVIEWING` (explicit: response received)
- ❌ `IN_LESSON` → `REVIEWING` (implicit: not allowed, must go through AWAITING_FEEDBACK)

### Action Validation

**Rule**: Every user action must be validated against current state before execution.

**Validation Checks**:
1. Is action allowed in current state?
2. Are constraints met (rate limit, cooldown, etc.)?
3. Is input valid?
4. Is navigation allowed?

**If validation fails**: Action blocked, show error message, remain in current state.

### Constraint Enforcement

**Rule**: Constraints must be checked before allowing state transitions.

**Constraint Types**:
- Rate limiting (requests per minute)
- Cooldown periods (time between attempts)
- Max attempts (maximum submissions)
- Mastery thresholds (score required)
- Prerequisites (screens that must be completed)

**Enforcement**:
- Frontend: Disable buttons, show warnings
- Backend: Validate on API calls, return errors

---

## State Machine Implementation

### State Store Interface

```typescript
interface AppStateMachine {
  // Current state
  currentState: AppState;
  previousState: AppState | null;
  
  // State data
  stateData: StateData;
  
  // Actions
  transitionTo: (newState: AppState, data?: StateData) => void;
  canTransitionTo: (newState: AppState) => boolean;
  canPerformAction: (action: UserAction) => boolean;
  getBlockingReasons: (action: UserAction) => string[];
  
  // Error handling
  transitionToError: (error: Error, previousState: AppState) => void;
  retryFromError: () => Promise<void>;
  resetFromError: () => void;
}

type AppState = 
  | 'IDLE'
  | 'ASSESSING_LEVEL'
  | 'IN_LESSON'
  | 'AWAITING_FEEDBACK'
  | 'REVIEWING'
  | 'COMPLETED'
  | 'ERROR';

type UserAction = 
  | 'startLearning'
  | 'submitAnswer'
  | 'requestHint'
  | 'reviseAnswer'
  | 'proceedToNext'
  | 'completeScreen'
  | 'navigateBack'
  | 'cancelSubmission'
  | 'retry'
  | 'reset';
```

### State Transition Matrix

| From State | To State | Trigger | Condition |
|------------|----------|---------|-----------|
| IDLE | ASSESSING_LEVEL | `startLearning()` | Assessment enabled |
| IDLE | IN_LESSON | `startLearning()` | Assessment disabled (MVP) |
| ASSESSING_LEVEL | IN_LESSON | `completeAssessment()` | Assessment complete |
| IN_LESSON | AWAITING_FEEDBACK | `submitAnswer()` | Constraints met |
| AWAITING_FEEDBACK | REVIEWING | Response received | Response complete |
| AWAITING_FEEDBACK | IN_LESSON | `cancelSubmission()` | Cancellation allowed |
| REVIEWING | IN_LESSON | `reviseAnswer()` | Always allowed |
| REVIEWING | IN_LESSON | `proceedToNext()` | Next screen unlocked |
| REVIEWING | COMPLETED | `completeScreen()` | Final screen AND mastery |
| Any | ERROR | Error occurs | Error detected |
| ERROR | Previous State | `retry()` | Retry succeeds |
| ERROR | IDLE | `reset()` | Always allowed |

---

## Action Validation Matrix

| Action | IDLE | ASSESSING | IN_LESSON | AWAITING | REVIEWING | COMPLETED | ERROR |
|--------|------|-----------|-----------|----------|-----------|-----------|-------|
| startLearning | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| submitAnswer | ❌ | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| requestHint | ❌ | ✅* | ✅* | ❌ | ✅* | ❌ | ❌ |
| reviseAnswer | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| proceedToNext | ❌ | ❌ | ❌ | ❌ | ✅* | ❌ | ❌ |
| completeScreen | ❌ | ✅ | ❌ | ❌ | ✅* | ❌ | ❌ |
| navigateBack | ❌ | ✅* | ✅* | ❌ | ✅* | ❌ | ❌ |
| cancelSubmission | ❌ | ❌ | ❌ | ✅* | ❌ | ❌ | ❌ |
| retry | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| reset | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

* = Subject to constraints (rate limit, cooldown, mastery, etc.)

---

## Constraint Enforcement by State

### IN_LESSON Constraints

**Before `submitAnswer()`**:
- ✅ Rate limit not exceeded (6 requests/minute)
- ✅ Cooldown elapsed (10 seconds since last submit)
- ✅ Max attempts not reached (5 attempts)
- ✅ Minimum time on screen met (60 seconds, if enforced)
- ✅ Input validation passed (not empty, format valid)
- ✅ UI state is `ready` or `interacting`

**If constraint violated**: Block action, show warning, remain in `IN_LESSON`.

### REVIEWING Constraints

**Before `proceedToNext()`**:
- ✅ Mastery threshold met (80% score, if required)
- ✅ Required attempts completed (1 attempt minimum)
- ✅ Next screen unlocked (prerequisites met)
- ✅ Minimum time on screen met (if enforced)

**If constraint violated**: Block action, show unlock requirements, remain in `REVIEWING`.

---

## Error Recovery

### Error Types and Recovery

1. **NETWORK_ERROR**
   - **Recovery**: Retry action
   - **Transition**: ERROR → Previous State
   - **UI**: Show "Retry" button

2. **API_ERROR**
   - **Recovery**: Retry action or fix input
   - **Transition**: ERROR → Previous State
   - **UI**: Show error message + "Retry" button

3. **VALIDATION_ERROR**
   - **Recovery**: Fix constraint violation
   - **Transition**: ERROR → Previous State (after fix)
   - **UI**: Show constraint violation message

4. **TIMEOUT_ERROR**
   - **Recovery**: Retry action
   - **Transition**: ERROR → Previous State
   - **UI**: Show timeout message + "Retry" button

5. **SESSION_ERROR**
   - **Recovery**: Must reset, cannot retry
   - **Transition**: ERROR → IDLE
   - **UI**: Show "Start Over" button

---

## State Data Requirements

### State Data by State

**IDLE**:
- No data required

**ASSESSING_LEVEL**:
- `sessionId: string`
- `assessmentScreenId: string`
- `answers: string[]`
- `currentQuestionIndex: number`

**IN_LESSON**:
- `sessionId: string`
- `screenId: string`
- `answerText: string` (draft)
- `attemptCount: number`
- `timeSpent: number`
- `constraints: ActiveConstraints`

**AWAITING_FEEDBACK**:
- `sessionId: string`
- `screenId: string`
- `submittedAnswer: string`
- `submissionTimestamp: Date`
- `responseStatus: 'streaming' | 'complete' | 'error'`

**REVIEWING**:
- `sessionId: string`
- `screenId: string`
- `instructorFeedback: string`
- `updatedProgress: ScreenProgress`
- `unlockStatus: UnlockState`
- `nextScreenId: string | null`

**COMPLETED**:
- `sessionId: string`
- `completionTimestamp: Date`
- `sessionSummary: SessionSummary`
- `finalProgress: SessionProgress`

**ERROR**:
- `errorType: ErrorType`
- `errorMessage: string`
- `previousState: AppState`
- `retryCount: number`
- `errorTimestamp: Date`

---

## Implementation Notes

### State Machine Store

**Location**: `state/stores/appStateMachineStore.ts`

**Responsibilities**:
- Track current state
- Validate transitions
- Enforce action constraints
- Handle error states
- Provide state query methods

### UI Integration

**Components check state before rendering**:
- Disable buttons if action not allowed
- Show warnings if constraints approaching
- Hide UI elements not relevant to current state
- Display state-specific content

**Example**:
```typescript
// In component
const { currentState, canPerformAction } = useAppStateMachine();

const submitDisabled = !canPerformAction('submitAnswer') || 
                       currentState !== 'IN_LESSON';

<button disabled={submitDisabled} onClick={handleSubmit}>
  Submit
</button>
```

---

## Summary

**States**: 7 explicit states (IDLE, ASSESSING_LEVEL, IN_LESSON, AWAITING_FEEDBACK, REVIEWING, COMPLETED, ERROR)

**Transitions**: Explicit only, via user actions or system events

**Action Validation**: Every action validated against state and constraints

**Constraint Enforcement**: Frontend blocks invalid actions, backend validates

**Error Recovery**: Error state with retry/reset options

**UI Blocking**: UI disables buttons and shows warnings for invalid actions

This state machine ensures the frontend represents a structured learning experience (classroom), not a free-form chat interface.

---

## Implementation Files

- **`state/stores/appStateMachineStore.ts`** - Zustand store implementation
- **`state/hooks/useAppStateMachine.ts`** - React hook wrapper

**Usage Example**:
```typescript
const { currentState, canPerformAction, transitionTo } = useAppStateMachine();

// Check if action allowed
if (canPerformAction('submitAnswer')) {
  // Perform action
  await submitAnswer();
  transitionTo('AWAITING_FEEDBACK');
} else {
  // Show blocking reason
  const reasons = getBlockingReasons('submitAnswer');
  showError(reasons);
}
```
