# Real-Time Interaction UX Design

## Overview

This document describes the UX design for real-time interactions in ORIGINER's web-based AI lesson experience. It covers streaming responses, partial display, interruption handling, and constraint enforcement.

---

## Streaming Instructor Responses

### SSE Flow

```
User Action (Submit Answer)
    │
    ├─► Frontend: Disable submit button
    ├─► Frontend: Show loading state
    ├─► API: POST /lessons/{id}/submit
    │
    └─► SSE Connection Established
        │
        ├─► event: interaction_started
        │   └─► UI: Show "Instructor is thinking..." indicator
        │
        ├─► event: feedback_chunk (multiple)
        │   └─► UI: Append chunks incrementally
        │
        ├─► event: feedback_complete
        │   └─► UI: Finalize message, enable actions
        │
        └─► event: progress_updated
            └─► UI: Update progress indicators
```

### Visual States

**State 1: Waiting for Response**
```
┌─────────────────────────────────────────┐
│  Your Answer: "x = 4"                   │
│  [Submit] (disabled)                    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  ⏳ Instructor is thinking...      │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**State 2: Streaming Response**
```
┌─────────────────────────────────────────┐
│  Your Answer: "x = 4"                    │
│  [Submit] (disabled)                    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  💬 Instructor:                    │ │
│  │                                     │ │
│  │  That's correct! You successfully  │ │
│  │  isolated the variable by...      │ │
│  │  ▊ (cursor blinking)               │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**State 3: Complete Response**
```
┌─────────────────────────────────────────┐
│  Your Answer: "x = 4"                    │
│  [Submit] (enabled, if allowed)          │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  💬 Instructor:                    │ │
│  │                                     │ │
│  │  That's correct! You successfully  │ │
│  │  isolated the variable by          │ │
│  │  subtracting 5 from both sides.    │ │
│  │  Great work!                        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Progress: ████████░░ 80%              │
└─────────────────────────────────────────┘
```

---

## Partial Response Display

### Chunk Rendering Strategy

**Approach**: Append chunks as they arrive, with smooth scrolling

#### Implementation Pattern

```typescript
// State management
interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
  chunks: string[];
  isComplete: boolean;
}

// Chunk handler
function handleFeedbackChunk(chunk: string) {
  // Append chunk
  setCurrentContent(prev => prev + chunk);
  
  // Auto-scroll to bottom (smooth)
  scrollToBottom('smooth');
  
  // Update UI
  setStreamingState({
    isStreaming: true,
    currentContent: currentContent + chunk,
    chunks: [...chunks, chunk],
    isComplete: false
  });
}
```

### Visual Design

**1. Typing Indicator**
- Show blinking cursor (`▊`) while streaming
- Cursor disappears when complete
- Smooth animation (CSS animation)

**2. Chunk Appending**
- Append text character-by-character or word-by-word
- Smooth transition (no jarring jumps)
- Maintain reading position (auto-scroll)

**3. Formatting**
- Preserve line breaks from instructor response
- Support markdown formatting (bold, italic, lists)
- Render code blocks if present

### UX Decision: Character-by-Character vs Word-by-Word

**Decision**: **Word-by-word** with small delay

**Rationale**:
- Character-by-character: Too fast, hard to read, feels artificial
- Word-by-word: Natural reading pace, easier to follow
- Delay: ~50ms per word (adjustable based on response length)

**Implementation**:
```typescript
// Buffer chunks and render word-by-word
function renderChunk(chunk: string) {
  const words = chunk.split(' ');
  words.forEach((word, index) => {
    setTimeout(() => {
      appendWord(word + ' ');
    }, index * 50); // 50ms delay per word
  });
}
```

---

## Interruption Handling

### Scenario: User Tries to Submit While Streaming

**Problem**: User clicks submit button while instructor response is still streaming.

### UX Flow

```
User clicks [Submit] while streaming
    │
    ├─► Check: Is streaming active?
    │   │
    │   ├─► Yes: Show interruption dialog
    │   │   │
    │   │   └─► Dialog: "Instructor is still responding. 
    │   │              Do you want to cancel and submit new answer?"
    │   │              [Cancel] [Yes, Submit New]
    │   │
    │   └─► No: Proceed with submission
    │
    └─► Handle user choice
        │
        ├─► Cancel: Continue streaming
        └─► Submit New: Close SSE, start new submission
```

### Visual States

**State 1: Streaming Active - Button Disabled**
```
┌─────────────────────────────────────────┐
│  Your Answer: "x = 5"                   │
│  [Submit] (disabled, grayed out)        │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  💬 Instructor:                    │ │
│  │  That's close, but let's think... │ │
│  │  ▊                                  │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**State 2: Interruption Attempt - Dialog**
```
┌─────────────────────────────────────────┐
│  Your Answer: "x = 5"                   │
│  [Submit] (disabled)                    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  💬 Instructor:                    │ │
│  │  That's close, but let's think... │ │
│  │  ▊                                  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  ⚠️ Interruption                   │ │
│  │                                     │ │
│  │  Instructor is still responding.   │ │
│  │  Do you want to cancel and submit  │ │
│  │  a new answer?                      │ │
│  │                                     │ │
│  │  [Cancel]  [Yes, Submit New]       │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**State 3: Interruption Confirmed - New Submission**
```
┌─────────────────────────────────────────┐
│  Your Answer: "x = 5"                   │
│  [Submit] (disabled)                    │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Previous response cancelled       │ │
│  │                                     │ │
│  │  ⏳ Processing new answer...       │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Implementation

```typescript
function handleSubmitClick() {
  // Check if streaming
  if (streamingState.isStreaming) {
    // Show interruption dialog
    setInterruptionDialog({
      show: true,
      message: "Instructor is still responding. Do you want to cancel and submit a new answer?",
      onCancel: () => {
        setInterruptionDialog({ show: false });
      },
      onConfirm: async () => {
        // Close SSE connection
        await sseClient.close();
        
        // Clear current response
        setStreamingState({
          isStreaming: false,
          currentContent: '',
          chunks: [],
          isComplete: false
        });
        
        // Submit new answer
        await submitAnswer(newAnswer);
      }
    });
    return;
  }
  
  // Normal submission flow
  await submitAnswer(answer);
}
```

### UX Decision: Allow Interruption vs Block Completely

**Decision**: **Allow interruption with confirmation**

**Rationale**:
- **Block completely**: Frustrating if user made mistake, wants to correct
- **Allow silently**: Confusing, loses context
- **Allow with confirmation**: Best balance - prevents accidents, allows intentional correction

**Implementation**: 
- Disable submit button visually
- Show dialog on click attempt
- Require explicit confirmation

---

## Blocking Premature Answers

### Constraint Enforcement UI

**Purpose**: Prevent users from submitting answers before constraints are met.

### Visual Indicators

#### 1. Submit Button States

**Disabled State (Constraint Not Met)**
```
┌─────────────────────────────────────────┐
│  Your Answer: "x = 4"                   │
│                                         │
│  [Submit] (disabled, grayed out)        │
│  ⏱️ Wait 5 more seconds                │
└─────────────────────────────────────────┘
```

**Enabled State (Ready)**
```
┌─────────────────────────────────────────┐
│  Your Answer: "x = 4"                   │
│                                         │
│  [Submit] (enabled, primary color)      │
└─────────────────────────────────────────┘
```

#### 2. Constraint Warnings

**Cooldown Active**
```
┌─────────────────────────────────────────┐
│  Your Answer: "x = 4"                   │
│                                         │
│  ⏱️ Please wait 8 seconds before        │
│     submitting again                     │
│                                         │
│  [Submit] (disabled)                    │
└─────────────────────────────────────────┘
```

**Minimum Time Not Met**
```
┌─────────────────────────────────────────┐
│  Your Answer: "x = 4"                   │
│                                         │
│  ⏱️ Spend at least 30 more seconds      │
│     thinking about this problem          │
│                                         │
│  [Submit] (disabled)                    │
└─────────────────────────────────────────┘
```

**Max Attempts Reached**
```
┌─────────────────────────────────────────┐
│  Your Answer: "x = 4"                   │
│                                         │
│  ⚠️ Maximum attempts reached (5/5)      │
│     Review the feedback and try the      │
│     next problem                         │
│                                         │
│  [Submit] (disabled)                    │
│  [Next Problem] (enabled)              │
└─────────────────────────────────────────┘
```

### Constraint Display Components

#### 1. Cooldown Timer

**Visual Design**:
```
┌─────────────────────────────────────────┐
│  ⏱️ Cooldown: 8 seconds remaining        │
│  ████████░░░░░░░░░░ 40%                 │
│                                         │
│  [Submit] (disabled)                    │
└─────────────────────────────────────────┘
```

**Implementation**:
```typescript
function CooldownTimer({ remainingSeconds, totalSeconds }) {
  const percentage = (remainingSeconds / totalSeconds) * 100;
  
  return (
    <div className="cooldown-timer">
      <div className="cooldown-message">
        ⏱️ Cooldown: {remainingSeconds} seconds remaining
      </div>
      <ProgressBar value={percentage} />
      <Button disabled>Submit</Button>
    </div>
  );
}
```

#### 2. Time Requirement Indicator

**Visual Design**:
```
┌─────────────────────────────────────────┐
│  ⏱️ Minimum time: 30 seconds            │
│  Time spent: 15 seconds                 │
│  ████████░░░░░░░░░░ 50%                │
│                                         │
│  [Submit] (disabled)                    │
└─────────────────────────────────────────┘
```

**Implementation**:
```typescript
function TimeRequirement({ timeSpent, minTimeRequired }) {
  const remaining = Math.max(0, minTimeRequired - timeSpent);
  const percentage = (timeSpent / minTimeRequired) * 100;
  
  return (
    <div className="time-requirement">
      <div className="time-message">
        ⏱️ Minimum time: {minTimeRequired}s
        {remaining > 0 && ` (${remaining}s remaining)`}
      </div>
      <ProgressBar value={percentage} />
      {remaining > 0 && <Button disabled>Submit</Button>}
    </div>
  );
}
```

#### 3. Attempt Counter

**Visual Design**:
```
┌─────────────────────────────────────────┐
│  Attempts: 3 / 5                        │
│  ████████████░░░░ 60%                   │
│                                         │
│  [Submit] (enabled)                     │
└─────────────────────────────────────────┘
```

**When Max Reached**:
```
┌─────────────────────────────────────────┐
│  ⚠️ Maximum attempts reached (5/5)       │
│                                         │
│  [Submit] (disabled)                    │
│  [Review Feedback] (enabled)           │
└─────────────────────────────────────────┘
```

### Constraint Checking Flow

```
User types answer
    │
    ├─► Frontend: Validate input format
    │   │
    │   ├─► Invalid: Show format error
    │   └─► Valid: Continue
    │
    ├─► Frontend: Check constraints
    │   │
    │   ├─► Cooldown active?
    │   │   ├─► Yes: Disable button, show timer
    │   │   └─► No: Continue
    │   │
    │   ├─► Min time met?
    │   │   ├─► No: Disable button, show progress
    │   │   └─► Yes: Continue
    │   │
    │   ├─► Max attempts reached?
    │   │   ├─► Yes: Disable button, show message
    │   │   └─► No: Continue
    │   │
    │   └─► All constraints met?
    │       ├─► Yes: Enable submit button
    │       └─► No: Keep disabled, show reason
    │
    └─► User clicks submit
        │
        ├─► Frontend: Re-check constraints (final check)
        │   │
        │   ├─► Still valid: Proceed to API
        │   └─► Invalid: Show error, prevent submission
        │
        └─► API: Backend validates (source of truth)
            │
            ├─► Valid: Process, return response
            └─► Invalid: Return error, show message
```

### UX Decision: Show Constraints vs Hide Until Attempt

**Decision**: **Show constraints proactively**

**Rationale**:
- **Hide until attempt**: Frustrating, user doesn't know why button is disabled
- **Show proactively**: Transparent, user understands requirements
- **Progressive disclosure**: Show most relevant constraint first

**Implementation**:
- Always show active constraints
- Prioritize: Cooldown > Time > Attempts
- Update in real-time as constraints change

---

## Complete Interaction Flow

### Full User Journey

```
1. User types answer
   └─► Input validation (format, length)
       └─► Show validation errors if invalid

2. User ready to submit
   └─► Check constraints
       ├─► Cooldown active?
       │   └─► Show cooldown timer, disable button
       ├─► Min time not met?
       │   └─► Show time progress, disable button
       └─► All constraints met?
           └─► Enable submit button

3. User clicks submit
   └─► Final constraint check
       ├─► Still valid?
       │   ├─► Yes: Disable button, show "Submitting..."
       │   └─► No: Show error, prevent submission
       │
       └─► API call
           ├─► Success: Start SSE stream
           └─► Error: Show error message, re-enable button

4. SSE stream starts
   └─► Show "Instructor is thinking..."
       └─► Receive chunks
           └─► Append chunks word-by-word
               └─► Auto-scroll to bottom

5. User tries to interrupt
   └─► Check if streaming
       ├─► Yes: Show interruption dialog
       └─► No: Allow new submission

6. Stream completes
   └─► Finalize message
       └─► Update progress
           └─► Enable actions (if allowed)
               └─► Show next steps
```

---

## Visual Design Principles

### 1. Progressive Disclosure
- Show constraints only when relevant
- Hide completed constraints
- Prioritize active constraints

### 2. Clear Feedback
- Always show why button is disabled
- Provide countdown timers for time-based constraints
- Show progress indicators

### 3. Smooth Transitions
- Animate state changes
- Smooth scrolling for streaming content
- Fade in/out for messages

### 4. Prevent Accidents
- Disable buttons during critical operations
- Require confirmation for interruptions
- Show warnings before destructive actions

### 5. Maintain Context
- Keep previous responses visible
- Show conversation history
- Maintain scroll position appropriately

---

## Accessibility Considerations

### 1. Screen Reader Support
- Announce streaming state changes
- Read chunks as they arrive (optional, can disable)
- Announce constraint states
- Announce completion

### 2. Keyboard Navigation
- Tab through interactive elements
- Enter to submit (when enabled)
- Escape to cancel dialogs

### 3. Visual Indicators
- High contrast for disabled states
- Clear focus indicators
- Color + text for status (not color alone)

---

## Performance Optimizations

### 1. Chunk Buffering
- Buffer small chunks before rendering
- Render in batches (reduce re-renders)
- Use requestAnimationFrame for smooth updates

### 2. Debouncing
- Debounce constraint checks (don't check on every keystroke)
- Debounce scroll updates
- Debounce progress updates

### 3. Virtualization
- For long conversation history
- Only render visible messages
- Lazy load older messages

---

## Summary

**Streaming**: SSE with word-by-word rendering, smooth scrolling, typing indicator
**Partial Display**: Append chunks incrementally, preserve formatting, auto-scroll
**Interruptions**: Allow with confirmation dialog, close SSE gracefully
**Blocking**: Show constraints proactively, disable buttons, provide clear feedback

All decisions prioritize:
- ✅ Clear feedback
- ✅ Prevent accidents
- ✅ Maintain context
- ✅ Smooth UX
- ✅ Accessibility
