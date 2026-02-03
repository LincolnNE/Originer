# Lesson Screen Logical Structure

## Overview

**Screen Type**: Lesson-based learning interface (classroom), NOT a chat window  
**Purpose**: Active learning through structured lesson screens  
**States**: IN_LESSON, AWAITING_FEEDBACK, REVIEWING

---

## Screen Layout (Logical Structure)

### 1. INSTRUCTOR AREA

**Purpose**: Display what the instructor is currently doing and providing

**Fixed Elements**:
- Instructor identity indicator (name/avatar, always visible)
- Instructor status indicator (what instructor is doing)

**Dynamic Elements**:
- Current instructor activity
- Instructor feedback content
- Instructor guidance/hints
- Instructor response status

**Content by State**:

**IN_LESSON**:
- Activity: "Presenting problem" or "Waiting for your response"
- Content: Problem statement, instructions, examples
- Status: Static content displayed

**AWAITING_FEEDBACK**:
- Activity: "Analyzing your answer..." or "Preparing feedback..."
- Content: Problem statement (still visible, dimmed)
- Status: Loading indicator, progress message
- Streaming: If SSE enabled, show partial response as it arrives

**REVIEWING**:
- Activity: "Providing feedback" or "Reviewing your work"
- Content: Complete instructor feedback, guidance, corrections
- Status: Feedback fully displayed, actionable

**Re-render Triggers**:
- State transition (IN_LESSON → AWAITING_FEEDBACK → REVIEWING)
- SSE stream update (new chunk received)
- Feedback received (complete response)
- Error occurred (show error message)

---

### 2. LEARNER TASK AREA

**Purpose**: Where the learner actively works on the lesson

**Fixed Elements**:
- Answer input field (always present, may be disabled)
- Submit button (always present, may be disabled)
- Task instructions area

**Dynamic Elements**:
- Answer input value (learner types)
- Answer input state (enabled/disabled/readonly)
- Submit button state (enabled/disabled/loading)
- Validation feedback (inline errors)
- Draft answer (unsaved changes)

**Content by State**:

**IN_LESSON**:
- Input: Enabled, editable, accepts text
- Submit: Enabled (if constraints met), disabled (if constraints violated)
- Validation: Real-time validation feedback
- Draft: Answer text stored locally (optimistic)
- Instructions: Visible, clear

**AWAITING_FEEDBACK**:
- Input: Disabled, readonly, shows submitted answer
- Submit: Disabled, shows "Submitting..." or loading state
- Validation: Hidden (already submitted)
- Draft: Submitted answer locked
- Instructions: Visible but dimmed

**REVIEWING**:
- Input: Disabled (shows submitted answer) OR enabled (if revising)
- Submit: Hidden (not applicable)
- Validation: Hidden (feedback shown instead)
- Draft: Shows submitted answer (readonly) or editable (if revising)
- Instructions: Visible, may include follow-up instructions

**Re-render Triggers**:
- User typing (input value change)
- Constraint status change (submit button enable/disable)
- Validation state change (error messages)
- State transition (input enabled/disabled)
- Answer submission (input locked)

---

### 3. PROGRESS INDICATOR

**Purpose**: Show learner progress through lesson and session

**Fixed Elements**:
- Progress bar container (always visible)
- Progress labels (current screen, session progress)

**Dynamic Elements**:
- Screen progress percentage (0-100%)
- Session progress percentage (0-100%)
- Current attempt number (X of Y attempts)
- Time spent on screen (seconds/minutes)
- Mastery score (if available)
- Concepts demonstrated (list)
- Unlock status (next screen locked/unlocked)

**Content by State**:

**IN_LESSON**:
- Screen progress: Based on attempts, time, mastery
- Session progress: Overall session completion
- Attempts: "Attempt 1 of 5"
- Time: "2 minutes on this screen"
- Mastery: "Current score: 65% (need 80% to proceed)"
- Concepts: List of concepts demonstrated
- Unlock: "Next screen locked: Complete 3 more attempts"

**AWAITING_FEEDBACK**:
- Screen progress: Frozen (no updates during wait)
- Session progress: Frozen
- Attempts: "Attempt 1 of 5" (frozen)
- Time: Timer paused
- Mastery: Previous score displayed
- Concepts: Previous list displayed
- Unlock: Status unchanged

**REVIEWING**:
- Screen progress: Updated with new mastery score
- Session progress: Updated if screen completed
- Attempts: "Attempt 1 of 5" (may increment if revising)
- Time: Updated total time
- Mastery: "Current score: 85% ✓ (mastery achieved)"
- Concepts: Updated list (new concepts added)
- Unlock: "Next screen unlocked ✓" or "Next screen locked: [requirements]"

**Re-render Triggers**:
- Attempt count change (after submission)
- Time increment (every second, if timer active)
- Mastery score update (after feedback received)
- Concepts list update (after feedback)
- Unlock status change (requirements met)
- Screen completion (progress jumps to 100%)

---

### 4. SYSTEM CONSTRAINTS AREA

**Purpose**: Display what the user cannot do right now and why

**Fixed Elements**:
- Constraints container (always visible, may be empty)
- Constraint icon/indicator

**Dynamic Elements**:
- Active constraints list
- Blocking constraints (preventing actions)
- Warning constraints (approaching limits)
- Constraint messages (user-friendly explanations)
- Time remaining (for time-based constraints)
- Progress toward limit (for count-based constraints)

**Constraint Types**:

**Rate Limit**:
- Message: "Please wait 10 seconds before submitting again"
- Display: Countdown timer, "X seconds remaining"
- Status: Blocking (if active), Warning (if approaching)
- Blocks: submitAnswer action

**Cooldown**:
- Message: "Cooldown active: 10 seconds between attempts"
- Display: Countdown timer
- Status: Blocking (if active)
- Blocks: submitAnswer action

**Max Attempts**:
- Message: "Maximum attempts reached (5/5). Review feedback to proceed."
- Display: "Attempts: 5/5"
- Status: Blocking (if reached)
- Blocks: submitAnswer action

**Min Time on Screen**:
- Message: "Spend at least 2 minutes on this screen before proceeding"
- Display: "Time remaining: 45 seconds"
- Status: Blocking (if not met), Warning (if approaching)
- Blocks: proceedToNext action

**Mastery Threshold**:
- Message: "Achieve 80% mastery to unlock next screen. Current: 65%"
- Display: Progress bar, "15% more needed"
- Status: Blocking (if not met)
- Blocks: proceedToNext action

**Required Attempts**:
- Message: "Complete at least 2 attempts. Current: 1/2"
- Display: "Attempts: 1/2"
- Status: Blocking (if not met)
- Blocks: proceedToNext action

**Content by State**:

**IN_LESSON**:
- Show all active constraints
- Highlight blocking constraints (red/warning)
- Show warning constraints (yellow/caution)
- Update countdowns in real-time
- Show progress toward limits

**AWAITING_FEEDBACK**:
- Constraints frozen (no updates during wait)
- Show last known constraint status
- Hide countdown timers (paused)

**REVIEWING**:
- Show updated constraints (after feedback)
- Show unlock requirements (if next screen locked)
- Highlight satisfied constraints (green/checkmark)
- Show remaining blocking constraints

**Re-render Triggers**:
- Constraint status change (active → satisfied, warning → blocking)
- Time remaining update (every second for countdowns)
- Attempt count change (constraint progress updates)
- Mastery score update (mastery constraint updates)
- Action attempted (constraint violation feedback)
- State transition (constraints may change)

---

## Screen State Transitions

### IN_LESSON → AWAITING_FEEDBACK

**What Changes**:
- Instructor area: Activity changes to "Analyzing..."
- Learner task area: Input disabled, submit button disabled
- Progress indicator: Timer paused, progress frozen
- Constraints: All constraints frozen, no updates

**What Stays Fixed**:
- Screen layout structure
- Problem statement (still visible)
- Progress bar structure (values frozen)

**Re-render Triggers**:
- State machine transition
- Submit button click
- API call initiated

---

### AWAITING_FEEDBACK → REVIEWING

**What Changes**:
- Instructor area: Activity changes to "Feedback ready", content shows full feedback
- Learner task area: Input shows submitted answer (readonly), submit button hidden
- Progress indicator: Updated with new mastery score, concepts, unlock status
- Constraints: Updated with new constraint statuses, unlock requirements shown

**What Stays Fixed**:
- Screen layout structure
- Problem statement (still visible)

**Re-render Triggers**:
- Feedback received (complete response)
- SSE stream complete
- State machine transition

---

### REVIEWING → IN_LESSON (revise)

**What Changes**:
- Instructor area: Activity changes back to "Waiting for your response"
- Learner task area: Input enabled, submit button enabled (if constraints met)
- Progress indicator: Shows updated progress (if attempt count incremented)
- Constraints: Re-evaluated based on new attempt count

**What Stays Fixed**:
- Screen layout structure
- Problem statement (still visible)
- Progress bar structure

**Re-render Triggers**:
- User clicks "Revise Answer"
- State machine transition

---

## Dynamic Content Updates

### Real-Time Updates (No State Change)

**Timer Updates**:
- Time spent on screen (every second)
- Cooldown countdown (every second)
- Rate limit countdown (every second)
- Min time remaining (every second)

**Re-render Triggers**:
- Timer tick (every 1 second)
- No state machine transition needed

---

### Constraint Status Updates

**When Constraints Change**:
- Rate limit reset (timer expires)
- Cooldown expires (timer reaches 0)
- Attempt count increments (after submission)
- Mastery score updates (after feedback)
- Time threshold met (min time elapsed)

**Re-render Triggers**:
- Constraint status change
- Timer expiration
- Attempt submission
- Feedback received

---

### SSE Streaming Updates (AWAITING_FEEDBACK)

**Streaming Behavior**:
- Instructor area: Append new chunks as they arrive
- Learner task area: No changes (input still disabled)
- Progress indicator: No changes (frozen)
- Constraints: No changes (frozen)

**Re-render Triggers**:
- SSE chunk received (every chunk)
- Stream complete (final chunk)
- Stream error (error state)

---

## Fixed Elements (Never Change)

**Screen Structure**:
- Layout container (always same structure)
- Section containers (instructor, task, progress, constraints)
- Navigation bar (if present)
- Header/footer (if present)

**Static Content**:
- Screen ID (never changes)
- Session ID (never changes)
- Concept name (never changes)
- Learning objective (never changes)
- Problem statement (never changes, but may be dimmed)

**UI Components**:
- Button structures (always present, may be disabled)
- Input field structure (always present, may be disabled)
- Progress bar structure (always present, values change)

---

## Re-render Optimization

### Should Re-render

**High Priority** (Immediate):
- State machine transition
- User input (typing)
- Submit button click
- Feedback received
- Constraint violation

**Medium Priority** (Debounced):
- Timer updates (every second, batch updates)
- Constraint status changes (debounce rapid changes)

**Low Priority** (Lazy):
- Progress percentage (only if visible)
- Unlock requirements (only if next screen locked)

### Should NOT Re-render

**Avoid Re-renders**:
- Unchanged constraint values (use memoization)
- Unchanged progress values (use memoization)
- Unchanged instructor content (use memoization)
- Parent component updates (isolate state)

---

## Data Flow

### State Sources

**App State Machine**:
- Current state (IDLE, IN_LESSON, AWAITING_FEEDBACK, REVIEWING, etc.)
- State transitions
- Action permissions

**Lesson State Store**:
- Screen content (problem, instructions)
- UI state (ready, interacting, submitting)
- Navigation state (can go back/forward)

**Progress Store**:
- Screen progress (attempts, time, mastery)
- Session progress (screens completed, overall)
- Unlock status

**Constraint Store**:
- Active constraints
- Constraint statuses
- Blocking reasons

**API Responses**:
- Instructor feedback (complete response)
- Updated progress (after submission)
- Unlock status (after feedback)

### State Updates

**User Actions**:
- Type answer → Update draft answer in local state
- Submit answer → Transition to AWAITING_FEEDBACK, call API
- Request hint → Call API, update instructor area
- Revise answer → Transition to IN_LESSON, reset input

**System Events**:
- Timer tick → Update time spent, countdowns
- API response → Update feedback, progress, constraints
- SSE chunk → Append to instructor feedback
- Constraint change → Update constraint display, button states

---

## Component Responsibilities

### Instructor Area Component

**Responsibilities**:
- Display instructor activity status
- Display instructor feedback content
- Handle SSE streaming (if enabled)
- Show loading states
- Show error states

**Props**:
- `instructorActivity: string`
- `feedbackContent: string | null`
- `isStreaming: boolean`
- `isLoading: boolean`
- `error: Error | null`

**State**:
- Streaming chunks (if SSE)
- Display state (collapsed/expanded)

---

### Learner Task Area Component

**Responsibilities**:
- Display problem statement
- Display answer input field
- Handle user input
- Validate input (client-side)
- Display submit button
- Handle submission

**Props**:
- `problem: string`
- `instructions: string`
- `answerValue: string`
- `isInputEnabled: boolean`
- `isSubmitEnabled: boolean`
- `validationErrors: string[]`
- `onAnswerChange: (value: string) => void`
- `onSubmit: () => void`

**State**:
- Draft answer (local, optimistic)
- Input validation state
- Submit button state

---

### Progress Indicator Component

**Responsibilities**:
- Display screen progress
- Display session progress
- Display attempt count
- Display time spent
- Display mastery score
- Display unlock status

**Props**:
- `screenProgress: ScreenProgressUI`
- `sessionProgress: SessionProgressUI`
- `unlockState: UnlockState`

**State**:
- Timer state (if active)
- Progress calculations (memoized)

---

### Constraints Component

**Responsibilities**:
- Display active constraints
- Display blocking constraints
- Display warning constraints
- Display countdown timers
- Display constraint messages

**Props**:
- `constraints: ActiveConstraints`
- `blockingActions: string[]`

**State**:
- Timer state (for countdowns)
- Constraint visibility (collapsed/expanded)

---

## Summary

**Screen Structure**:
- 4 main areas: Instructor, Learner Task, Progress, Constraints
- Fixed layout structure, dynamic content
- State-driven rendering

**Dynamic Elements**:
- Instructor activity and feedback
- Answer input and validation
- Progress indicators and timers
- Constraint statuses and countdowns

**Fixed Elements**:
- Screen layout structure
- Problem statement
- Component containers

**Re-render Triggers**:
- State machine transitions
- User actions (typing, clicking)
- Timer ticks (every second)
- API responses
- SSE chunks
- Constraint status changes

This structure ensures the lesson screen represents a structured learning experience (classroom), not a free-form chat interface.
