# State Flow Explanation

## Overview

This document explains how session and screen state binding works in the frontend application. The system uses explicit state enums (not booleans) to control route-level behavior and UI component rendering.

## State Architecture

### Two-Level State System

1. **Session State** (`SessionState`) - Controls route-level behavior
2. **Screen State** (`LessonUIState`) - Controls UI component rendering

### Session State Enum

```typescript
type SessionState =
  | 'initializing'    // Session is being initialized
  | 'active'          // Session is active and ready
  | 'loading'         // Loading session data
  | 'paused'          // Session is paused
  | 'completed'       // Session is completed
  | 'error';          // Session error state
```

**Purpose**: Controls what routes are accessible and handles session-level navigation.

**Location**: `state/stores/sessionStore.ts`

**Usage**: 
- Route pages check `sessionState` to determine if they should render or redirect
- Invalid states trigger redirects (e.g., `error` → `/`, `completed` → `/complete`)

### Screen State Enum

```typescript
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
```

**Purpose**: Controls what UI components are shown and what actions are available.

**Location**: `state/stores/lessonStateStore.ts`

**Usage**:
- `ScreenRenderer` component uses `screenState` to determine what to render
- Different states show different UI (loading spinner, lesson screen, error message, etc.)

## State Flow

### 1. Route Load → Session Initialization

```
User navigates to /lessons/[sessionId]/[screenId]
  ↓
Page component mounts
  ↓
useSession() hook checks sessionState
  ↓
If sessionState === 'initializing':
  → Call loadSession(sessionId) [or mock initialization]
  → Set sessionState to 'loading' → 'active'
```

### 2. Session Active → Screen Initialization

```
sessionState === 'active'
  ↓
Page component checks screen state
  ↓
useLessonState() hook initializes screen
  ↓
If screen not loaded:
  → Call loadScreen(sessionId, screenId) [or mock initialization]
  → Set lessonState with screenId and uiState: 'ready'
```

### 3. Screen State → UI Rendering

```
lessonState.uiState === 'ready'
  ↓
ScreenRenderer component receives screenState
  ↓
Switch on screenState:
  → 'loading' → Show loading spinner
  → 'error' → Show error message
  → 'blocked' → Show blocking message
  → 'ready' | 'interacting' | etc. → Render LessonScreen component
```

### 4. User Interaction → State Transition

```
User submits answer
  ↓
lessonState.uiState transitions: 'ready' → 'submitting'
  ↓
API call (or mock)
  ↓
lessonState.uiState transitions: 'submitting' → 'streaming' → 'processing' → 'ready'
```

## Component Responsibilities

### Page Components (`page.tsx`)

**Responsibilities**:
- Initialize session state on mount
- Initialize screen state on mount
- Handle route-level redirects based on session state
- Bind state to ScreenRenderer component

**Example**: `app/lessons/[sessionId]/[screenId]/page.tsx`

```typescript
// 1. Initialize session
useEffect(() => {
  if (sessionState === 'initializing') {
    loadSession(sessionId);
  }
}, [sessionId, sessionState]);

// 2. Initialize screen
useEffect(() => {
  if (currentScreenId !== screenId) {
    setCurrentScreen(screenId);
    setLessonState(mockLessonState);
  }
}, [screenId]);

// 3. Handle redirects
useEffect(() => {
  if (sessionState === 'error') router.push('/');
  if (sessionState === 'completed') router.push('/complete');
}, [sessionState]);

// 4. Render based on state
return <ScreenRenderer screenState={lessonState.uiState} />;
```

### ScreenRenderer Component

**Responsibilities**:
- Receive `screenState` prop
- Render appropriate UI based on state enum value
- Handle loading, error, and blocked states
- Delegate active states to LessonScreen component

**Location**: `components/ScreenRenderer.tsx`

### State Stores

**SessionStore** (`state/stores/sessionStore.ts`):
- Manages `sessionState` enum
- Provides `setSessionState()` action
- Syncs with session data

**LessonStateStore** (`state/stores/lessonStateStore.ts`):
- Manages `lessonState` object with `uiState` enum
- Provides `setLessonState()` and `transitionState()` actions
- Tracks screen navigation state

## Mock State (Development)

During development, when backend APIs are not available:

1. **Mock Session**: `state/utils/mockState.ts` → `initializeMockSession()`
2. **Mock Lesson**: `state/utils/mockState.ts` → `initializeMockLessonState()`

These functions create realistic state objects for testing UI behavior.

## State Transitions

### Session State Transitions

```
initializing → loading → active
active → paused (user pauses)
active → completed (session finished)
any → error (on error)
error → active (on retry)
```

### Screen State Transitions

```
loading → ready (screen loaded)
ready → interacting (user types)
interacting → submitting (user submits)
submitting → streaming (receiving feedback)
streaming → processing (processing feedback)
processing → ready (ready for next action)
any → error (on error)
any → blocked (constraint blocks action)
```

## Key Principles

1. **Explicit Enums**: States are explicit enum values, not booleans
2. **State-Driven Rendering**: UI renders based on state, not conditional logic
3. **Separation of Concerns**: Session state controls routes, screen state controls UI
4. **Mock Support**: Mock state helpers enable development without backend
5. **No Premature Optimization**: Simple state stores, no complex patterns

## Files Created/Updated

- `types/state.ts` - Added `SessionState` enum
- `state/stores/sessionStore.ts` - Updated to use `SessionState` enum
- `state/stores/types.ts` - Updated SessionStore interface
- `state/hooks/useSession.ts` - Updated to expose `sessionState` and `setSessionState`
- `components/ScreenRenderer.tsx` - New component for state-driven rendering
- `app/lessons/[sessionId]/[screenId]/page.tsx` - Updated with state binding
- `app/lessons/[sessionId]/page.tsx` - Updated with state binding
- `state/utils/mockState.ts` - New mock state helpers
