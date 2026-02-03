# Final Global State Management Strategy (LOCKED)

## Status: BINDING DECISION FOR JSX IMPLEMENTATION

**This strategy is final, locked, and binding for all JSX implementation.**

---

## Final Decision

### Mechanism: **Zustand + Custom State Machine Layer**

**Exact Implementation**:
- **Zustand** for state storage (no Redux, no Context for state)
- **Custom state machine layer** (no XState, no state machine library)
- **React Context** for Server Component → Client Component initial state passing only
- **localStorage** for UI state persistence across refresh/navigation

**Rationale**:
1. **Zustand**: Fast, lightweight, no provider needed, works seamlessly with Client Components
2. **Custom State Machine**: Simple enough to implement ourselves, full control over validation, no external dependencies
3. **React Context**: Only for passing initial state from Server Components, not for state management
4. **localStorage**: Persists UI state across refresh/navigation, syncs with backend on load

---

## Where State Transitions Are Declared

### Location: `state/stores/appStateMachineStore.ts`

**Transition Matrix**:
```typescript
const VALID_TRANSITIONS: Record<AppState, AppState[]> = {
  IDLE: ['ASSESSING_LEVEL', 'IN_LESSON', 'ERROR'],
  ASSESSING_LEVEL: ['IN_LESSON', 'IDLE', 'ERROR'],
  IN_LESSON: ['AWAITING_FEEDBACK', 'REVIEWING', 'COMPLETED', 'ERROR'],
  AWAITING_FEEDBACK: ['REVIEWING', 'IN_LESSON', 'ERROR'],
  REVIEWING: ['IN_LESSON', 'COMPLETED', 'ERROR'],
  COMPLETED: ['IDLE', 'IN_LESSON', 'ASSESSING_LEVEL'],
  ERROR: ['IDLE'], // Can transition to any previous state via retry
};
```

**Action Matrix**:
```typescript
const ACTION_ALLOWED: Record<AppState, Set<UserAction>> = {
  IDLE: new Set(['startLearning']),
  ASSESSING_LEVEL: new Set(['submitAnswer', 'requestHint', 'completeAssessment', 'navigateBack']),
  IN_LESSON: new Set(['submitAnswer', 'requestHint', 'navigateBack', 'completeScreen']),
  AWAITING_FEEDBACK: new Set(['cancelSubmission']),
  REVIEWING: new Set(['reviseAnswer', 'proceedToNext', 'completeScreen', 'requestHint', 'navigateBack']),
  COMPLETED: new Set(['startLearning', 'reset']),
  ERROR: new Set(['retry', 'reset']),
};
```

**Enforcement Method**: `transitionTo(newState, data)` in `appStateMachineStore.ts`

**Rationale**:
- Single source of truth for transitions
- TypeScript ensures compile-time safety
- Runtime validation prevents invalid transitions
- Easy to maintain and extend

---

## How Invalid Transitions Are Prevented at Runtime

### Multi-Layer Runtime Validation

**Layer 1: Store-Level Validation** (`appStateMachineStore.ts`)
- `transitionTo()` method checks `VALID_TRANSITIONS` matrix
- Invalid transitions: Blocked (no state change), console.warn for debugging
- Returns early if invalid (no state update)

**Layer 2: Hook-Level Validation** (`useAppStateMachine.ts`)
- `safeTransitionTo()` wrapper double-checks validation
- Provides user-friendly error messages
- Returns validation result to caller

**Layer 3: Component-Level Validation** (UI Components)
- Components call `canPerformAction()` before rendering buttons
- Buttons disabled if action not allowed
- User-friendly error messages displayed

**Layer 4: Constraint-Level Validation** (`constraintStore.ts`)
- Constraints checked before transitions
- Rate limits, cooldowns, mastery thresholds
- Invalid constraints block transitions

**Runtime Prevention Flow**:
```
User Action
  ↓
Component: canPerformAction() check
  ↓
Hook: safeTransitionTo() validation
  ↓
Store: transitionTo() validates VALID_TRANSITIONS matrix
  ↓
If invalid: Block transition, console.warn, return early
If valid: Update state, trigger side effects
```

**Rationale**:
- Multiple layers ensure invalid transitions cannot occur
- Store-level validation is authoritative
- Component-level validation provides UX feedback
- Constraint-level validation prevents rule violations

---

## How State Survives Refresh/Navigation

### State Persistence Strategy

**UI State (Frontend-Owned)**:
- **Storage**: `localStorage` (browser storage)
- **Persisted**: Current state machine state, current screen ID, draft answers (optional)
- **On Refresh**: Load from localStorage, initialize Zustand stores, sync with backend
- **On Navigation**: Persist to localStorage before navigation, load on new route

**Authoritative State (Backend-Owned)**:
- **Storage**: Backend database/storage
- **Persisted**: Session state, screen progress, constraints, instructor responses
- **On Refresh**: Load from backend via Server Component, pass to Client Component
- **On Navigation**: Load from backend on route load

**Persistence Flow**:
```
Page Refresh
  ↓
Server Component: Fetch authoritative state from backend
  ↓
Server Component: Pass initial state to Client Component
  ↓
Client Component: Load UI state from localStorage
  ↓
Client Component: Initialize Zustand stores with:
  - Authoritative state (from Server Component)
  - UI state (from localStorage)
  ↓
Client Component: Sync and reconcile states
  ↓
Client Component: Render with correct state
```

**Navigation Flow**:
```
Route Change
  ↓
Before Navigation: Persist UI state to localStorage
  ↓
Navigate to new route
  ↓
New Route Server Component: Fetch authoritative state
  ↓
New Route Client Component: Load UI state from localStorage
  ↓
New Route Client Component: Initialize stores, reconcile
```

**localStorage Keys**:
- `originer:stateMachine:currentState` - Current state machine state
- `originer:stateMachine:stateData` - State machine data (sessionId, screenId)
- `originer:session:currentSessionId` - Current session ID
- `originer:screen:currentScreenId` - Current screen ID
- `originer:screen:draftAnswer` - Draft answer (optional, cleared on submit)

**Rationale**:
- localStorage provides immediate state restoration (better UX)
- Backend provides authoritative state (prevents manipulation)
- Reconciliation ensures consistency
- Clear separation: UI state (localStorage) vs. Learning state (backend)

---

## Implementation Details

### State Machine Store Structure

**File**: `state/stores/appStateMachineStore.ts`

**Current State**:
- `currentState: AppState` - Current state machine state
- `previousState: AppState | null` - Previous state (for error recovery)
- `stateData: StateData | null` - State-specific data (sessionId, screenId)
- `errorData: ErrorStateData | null` - Error state data

**Methods**:
- `transitionTo(newState, data)` - Validate and transition (runtime validation)
- `canTransitionTo(newState)` - Check if transition allowed
- `canPerformAction(action)` - Check if action allowed
- `transitionToError(error, errorType, previousState)` - Transition to error
- `retryFromError()` - Retry from error state
- `resetFromError()` - Reset to IDLE

**Persistence Integration**:
- `loadFromLocalStorage()` - Load UI state from localStorage
- `saveToLocalStorage()` - Save UI state to localStorage
- `clearLocalStorage()` - Clear UI state (on reset)

---

### Domain Stores Structure

**Files**: `state/stores/*.ts`

**Stores**:
- `sessionStore` - Session state (syncs with backend)
- `lessonStateStore` - Lesson screen state (syncs with backend)
- `progressStore` - Progress tracking (syncs with backend)
- `constraintStore` - Active constraints (syncs with backend)

**Persistence**:
- Domain stores do NOT use localStorage
- Domain stores load from backend on route load
- Domain stores update optimistically, reconcile with backend

---

### React Hooks Structure

**Files**: `state/hooks/*.ts`

**Hooks**:
- `useAppStateMachine()` - State machine hook (wraps `appStateMachineStore`)
- `useSession()` - Session hook (wraps `sessionStore`)
- `useLessonState()` - Lesson state hook (wraps `lessonStateStore`)
- `useProgress()` - Progress hook (wraps `progressStore`)
- `useConstraints()` - Constraints hook (wraps `constraintStore`)

**Persistence Integration**:
- Hooks handle localStorage persistence
- Hooks sync with backend on mount
- Hooks reconcile optimistic updates with backend

---

### Server Component Integration

**Pattern**: Server Component → Client Component → Zustand Store

**Server Component** (`app/lessons/[sessionId]/[screenId]/page.tsx`):
```typescript
export default async function LessonScreenPage({ params }) {
  // Fetch authoritative state from backend
  const session = await fetchSession(params.sessionId);
  const screen = await fetchScreen(params.screenId);
  
  // Pass to Client Component
  return (
    <LessonScreenClient 
      initialSession={session}
      initialScreen={screen}
    />
  );
}
```

**Client Component** (`LessonScreenClient.tsx`):
```typescript
'use client';
export function LessonScreenClient({ initialSession, initialScreen }) {
  const { setSession } = useSession();
  const { transitionTo, loadFromLocalStorage } = useAppStateMachine();
  
  useEffect(() => {
    // 1. Load UI state from localStorage
    const uiState = loadFromLocalStorage();
    
    // 2. Initialize domain stores with authoritative state
    setSession(initialSession);
    
    // 3. Initialize state machine with UI state or default
    if (uiState) {
      transitionTo(uiState.currentState, uiState.stateData);
    } else {
      transitionTo('IN_LESSON', { screenId: initialScreen.id });
    }
    
    // 4. Sync and reconcile states
    // (authoritative state wins for learning state)
  }, []);
  
  // Use hooks for updates
  const { currentState } = useAppStateMachine();
}
```

---

## Non-Goals (What This System Will NOT Handle)

### 1. Offline Functionality
**Will NOT**:
- Work offline
- Queue actions for later sync
- Handle network disconnection gracefully

**Rationale**: MVP scope, requires significant additional complexity

---

### 2. Multi-Tab Synchronization
**Will NOT**:
- Sync state across browser tabs
- Handle concurrent sessions in multiple tabs
- Prevent conflicts between tabs

**Rationale**: MVP scope, not required for single-user learning flow

---

### 3. Undo/Redo Functionality
**Will NOT**:
- Provide undo/redo for state transitions
- Maintain history of state changes
- Allow reverting to previous states

**Rationale**: Not required for learning flow, adds complexity

---

### 4. State Time Travel / Debugging
**Will NOT**:
- Provide state time travel for debugging
- Maintain full state history
- Allow jumping to arbitrary previous states

**Rationale**: Development tool, not production feature

---

### 5. Cross-Device Synchronization
**Will NOT**:
- Sync state across devices
- Handle multiple devices accessing same session
- Prevent conflicts between devices

**Rationale**: MVP scope, requires backend session management

---

### 6. State Compression / Optimization
**Will NOT**:
- Compress state for storage
- Optimize state size
- Handle very large state objects

**Rationale**: Current state is small enough, optimization not needed

---

### 7. State Migration / Versioning
**Will NOT**:
- Migrate state between versions
- Handle state schema changes
- Version state format

**Rationale**: MVP scope, can be added later if needed

---

### 8. State Analytics / Telemetry
**Will NOT**:
- Track state transition analytics
- Log all state changes
- Provide state transition telemetry

**Rationale**: Can be added via separate analytics layer, not state management concern

---

## Summary

### Final Decision

**Mechanism**: Zustand + Custom State Machine Layer

**Where Transitions Declared**: `state/stores/appStateMachineStore.ts` (VALID_TRANSITIONS matrix)

**Invalid Transition Prevention**: Runtime validation in `transitionTo()` method (multi-layer)

**State Persistence**: localStorage for UI state, backend for authoritative state

### Rationale

- **Zustand**: Fast, lightweight, no provider needed
- **Custom State Machine**: Full control, no external dependencies
- **Runtime Validation**: Multiple layers prevent invalid transitions
- **localStorage + Backend**: Immediate UX + authoritative state

### Non-Goals

- Offline functionality
- Multi-tab synchronization
- Undo/redo
- State time travel
- Cross-device sync
- State compression
- State migration
- State analytics

---

## Binding for JSX Implementation

**This strategy is LOCKED and binding for all JSX implementation.**

**All components must**:
1. Use Zustand stores via hooks (no direct store access)
2. Use `useAppStateMachine()` for state machine operations
3. Call `transitionTo()` for state transitions (validated automatically)
4. Load from localStorage on mount (via hooks)
5. Save to localStorage on state changes (via hooks)
6. Sync with backend authoritative state (via Server Components)

**No deviations from this strategy are allowed.**

---

**Status**: FINAL & LOCKED
