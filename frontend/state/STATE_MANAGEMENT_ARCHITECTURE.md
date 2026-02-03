# Global State Management Architecture

## Overview

**Purpose**: Design a state management approach that enforces the state machine, prevents invalid transitions, and is compatible with React Server Components.

**Constraints**:
- Must enforce previously defined state machine
- Prevent invalid transitions
- Compatible with React Server Components
- Handle errors properly

---

## Architecture Decision: Hybrid Approach

### Chosen Approach: **Zustand + React Context + State Machine Layer**

**Rationale**:
1. **Zustand** (Client-side state): Fast, lightweight, no provider needed, works with Client Components
2. **React Context** (Server Component compatibility): Provides initial state from Server Components
3. **State Machine Layer** (Enforcement): Centralized transition validation and enforcement

**Why Not Pure Context?**
- Context causes re-renders for all consumers
- Not ideal for frequently changing state (UI state, progress)
- Server Components can't use Context directly

**Why Not Pure Zustand?**
- Server Components can't access Zustand stores directly
- Need a way to pass initial state from Server Components

**Why Not State Machine Library (XState, etc.)?**
- Overkill for our needs
- Adds complexity and bundle size
- Our state machine is simple enough to implement ourselves
- Better control over transition validation

---

## Architecture Layers

### Layer 1: State Machine Core (Zustand Store)

**Location**: `state/stores/appStateMachineStore.ts`

**Purpose**: Centralized state machine enforcement

**Responsibilities**:
- Store current state (`IDLE`, `IN_LESSON`, `AWAITING_FEEDBACK`, etc.)
- Validate state transitions (transition matrix)
- Validate actions (action matrix)
- Enforce transition rules (prevent invalid transitions)
- Handle error states

**Key Features**:
- Transition validation matrix (`VALID_TRANSITIONS`)
- Action validation matrix (`ACTION_ALLOWED`)
- Transition methods (`transitionTo`, `canTransitionTo`)
- Error handling (`transitionToError`, `retryFromError`)

**Enforcement**:
- `transitionTo()` validates before allowing transition
- Invalid transitions are blocked (console.warn + no state change)
- TypeScript types ensure compile-time safety

---

### Layer 2: Domain Stores (Zustand Stores)

**Location**: `state/stores/*.ts`

**Purpose**: Domain-specific state (session, lesson, progress, constraints)

**Stores**:
- `sessionStore` - Session state
- `lessonStateStore` - Lesson screen state
- `progressStore` - Progress tracking
- `constraintStore` - Active constraints

**Responsibilities**:
- Store domain-specific state
- Provide domain-specific actions
- Sync with backend (optimistic updates)
- Reconcile with authoritative backend state

**Relationship to State Machine**:
- Domain stores are independent of state machine
- State machine controls UI flow
- Domain stores control domain data
- Both work together (state machine reads from domain stores for validation)

---

### Layer 3: React Hooks (Client Components)

**Location**: `state/hooks/*.ts`

**Purpose**: React-friendly interface to stores

**Hooks**:
- `useAppStateMachine()` - State machine hook
- `useSession()` - Session hook
- `useLessonState()` - Lesson state hook
- `useProgress()` - Progress hook
- `useConstraints()` - Constraints hook

**Responsibilities**:
- Wrap Zustand stores with React hooks
- Provide React-specific logic (effects, callbacks)
- Handle side effects (API calls, navigation)
- Coordinate between stores

**Usage**: Only in Client Components (`'use client'`)

---

### Layer 4: React Context (Server Component Compatibility)

**Location**: `state/providers/*.tsx`

**Purpose**: Pass initial state from Server Components to Client Components

**Providers**:
- `AppStateMachineProvider` - Provides initial state machine state
- `SessionProvider` - Provides initial session state

**Responsibilities**:
- Accept initial state from Server Components (via props)
- Pass initial state to Zustand stores (on mount)
- Provide fallback values for Client Components

**Usage**: 
- Server Components pass initial state as props
- Client Components consume via hooks (which read from Zustand)

---

### Layer 5: Transition Orchestrator (Action Layer)

**Location**: `state/orchestrators/stateMachineOrchestrator.ts` (to be created)

**Purpose**: Coordinate transitions across stores

**Responsibilities**:
- Validate transitions (state machine + constraints)
- Coordinate multiple store updates
- Handle side effects (API calls, navigation)
- Error handling and recovery

**Key Methods**:
- `performAction(action, context)` - Validate and perform action
- `transitionWithValidation(newState, data)` - Validate and transition
- `handleError(error, context)` - Handle errors with state machine

**Enforcement**:
- All transitions go through orchestrator
- Orchestrator validates before allowing transition
- Orchestrator coordinates store updates

---

## State Machine Enforcement

### Where Transitions Are Defined

**Location**: `state/stores/appStateMachineStore.ts`

**Transition Matrix**:
```typescript
const VALID_TRANSITIONS: Record<AppState, AppState[]> = {
  IDLE: ['ASSESSING_LEVEL', 'IN_LESSON', 'ERROR'],
  IN_LESSON: ['AWAITING_FEEDBACK', 'REVIEWING', 'COMPLETED', 'ERROR'],
  // ... etc
};
```

**Action Matrix**:
```typescript
const ACTION_ALLOWED: Record<AppState, Set<UserAction>> = {
  IDLE: new Set(['startLearning']),
  IN_LESSON: new Set(['submitAnswer', 'requestHint', 'navigateBack']),
  // ... etc
};
```

**Enforcement Points**:

1. **Store Level** (`appStateMachineStore.ts`):
   - `transitionTo()` validates transition matrix
   - Invalid transitions are blocked (no state change)
   - Console warning for debugging

2. **Hook Level** (`useAppStateMachine.ts`):
   - `safeTransitionTo()` double-checks validation
   - Provides user-friendly error messages
   - Returns validation result

3. **Orchestrator Level** (to be created):
   - Validates constraints before transition
   - Coordinates multiple store updates
   - Handles side effects

4. **Component Level** (UI):
   - Components check `canPerformAction()` before rendering buttons
   - Buttons disabled if action not allowed
   - User-friendly error messages

---

## Preventing Invalid Transitions

### Multi-Layer Validation

**Layer 1: TypeScript Types**
- Discriminated unions ensure type safety
- Compile-time errors for invalid states
- Type guards for runtime checks

**Layer 2: Transition Matrix**
- `VALID_TRANSITIONS` defines allowed transitions
- `transitionTo()` validates against matrix
- Invalid transitions blocked at store level

**Layer 3: Action Matrix**
- `ACTION_ALLOWED` defines allowed actions per state
- `canPerformAction()` validates actions
- Invalid actions blocked at hook level

**Layer 4: Constraint Validation**
- Constraints checked before transitions
- Rate limits, cooldowns, mastery thresholds
- Invalid constraints block transitions

**Layer 5: UI Blocking**
- Components check `canPerformAction()` before rendering
- Buttons disabled if action not allowed
- User-friendly error messages

---

## React Server Components Compatibility

### Problem

**React Server Components**:
- Run on server
- Can't use hooks (`useState`, `useContext`, etc.)
- Can't access Zustand stores directly
- Can fetch data and pass as props

**Client Components**:
- Run on client
- Can use hooks
- Can access Zustand stores
- Need initial state from Server Components

### Solution: Hybrid Approach

**Server Components**:
1. Fetch initial state from backend
2. Pass initial state as props to Client Components
3. Client Components initialize Zustand stores with initial state

**Client Components**:
1. Receive initial state from Server Components (props)
2. Initialize Zustand stores on mount (`useEffect`)
3. Use hooks to access stores
4. Updates happen in Zustand (no re-renders for Server Components)

**Example Flow**:

```typescript
// Server Component (app/lessons/[sessionId]/[screenId]/page.tsx)
export default async function LessonScreenPage({ params }) {
  // Fetch initial state from backend
  const initialSession = await fetchSession(params.sessionId);
  const initialScreen = await fetchScreen(params.screenId);
  
  // Pass to Client Component
  return (
    <LessonScreenClient 
      initialSession={initialSession}
      initialScreen={initialScreen}
    />
  );
}

// Client Component
'use client';
export function LessonScreenClient({ initialSession, initialScreen }) {
  const { setSession } = useSession();
  const { transitionTo } = useAppStateMachine();
  
  // Initialize stores with initial state
  useEffect(() => {
    setSession(initialSession);
    transitionTo('IN_LESSON', { screenId: initialScreen.id });
  }, []);
  
  // Use hooks for updates
  const { currentState } = useAppStateMachine();
  // ...
}
```

---

## Error Handling

### Error Flow

**1. Error Occurs**:
- API call fails
- Network error
- Validation error
- Constraint violation

**2. Error Detection**:
- Component catches error
- Calls `handleError(error, errorType)` from hook
- Hook calls `transitionToError()` in store

**3. State Machine Transition**:
- `transitionToError()` transitions to `ERROR` state
- Stores previous state for recovery
- Stores error details (type, message, retry count)

**4. UI Updates**:
- Component reads `currentState === 'ERROR'`
- Shows error UI (error message, retry button)
- Disables normal actions

**5. Error Recovery**:
- User clicks "Retry"
- Component calls `retryFromError()` from hook
- Hook calls `retryFromError()` in store
- Store transitions back to previous state
- Component retries failed operation

**6. Error Reset**:
- User clicks "Reset"
- Component calls `resetFromError()` from hook
- Hook calls `resetFromError()` in store
- Store transitions to `IDLE` state
- Component navigates to landing page

### Error Types

**Error Categories**:
- `NETWORK_ERROR` - Network failure (can retry)
- `API_ERROR` - API returned error (can retry)
- `VALIDATION_ERROR` - Constraint violation (fix and retry)
- `TIMEOUT_ERROR` - Request timed out (can retry)
- `SESSION_ERROR` - Session invalid (must reset)

**Error Handling Strategy**:
- Retryable errors: Show retry button, allow retry
- Non-retryable errors: Show reset button, must reset
- Validation errors: Show error message, allow fix and retry

### Error Boundaries

**Route-Level Error Boundaries**:
- `app/lessons/[sessionId]/[screenId]/error.tsx`
- Catches errors in route subtree
- Shows route-specific error UI
- Calls state machine `transitionToError()`

**Global Error Boundary**:
- `app/error.tsx`
- Catches unhandled errors
- Shows global error UI
- Calls state machine `transitionToError()`

---

## State Synchronization

### Server → Client

**Initial Load**:
1. Server Component fetches data from backend
2. Passes initial state as props to Client Component
3. Client Component initializes Zustand stores
4. Stores sync with backend state

**Updates**:
1. User action triggers API call
2. API returns updated state
3. Zustand store updates with new state
4. UI re-renders with updated state

### Optimistic Updates

**Pattern**:
1. User action triggers optimistic update (immediate UI feedback)
2. API call made in background
3. On success: Reconcile optimistic state with backend state
4. On error: Rollback optimistic state, show error

**Example**:
```typescript
// Optimistic update
setState({ attempts: currentAttempts + 1 });

// API call
try {
  const response = await submitAnswer(answer);
  // Reconcile with backend
  setState({ attempts: response.attempts });
} catch (error) {
  // Rollback
  setState({ attempts: currentAttempts });
  handleError(error);
}
```

---

## Transition Flow

### Standard Transition Flow

```
User Action
  ↓
Component checks canPerformAction()
  ↓
If allowed:
  Component calls performAction() from hook
  ↓
Hook validates action (canPerformAction())
  ↓
If valid:
  Hook calls transitionTo() in store
  ↓
Store validates transition (VALID_TRANSITIONS)
  ↓
If valid:
  Store updates state
  ↓
Hook triggers side effects (API calls, navigation)
  ↓
Component re-renders with new state
```

### Constraint-Validated Transition Flow

```
User Action
  ↓
Component checks canPerformAction()
  ↓
Component checks constraints (useConstraints hook)
  ↓
If constraints met:
  Component calls performAction()
  ↓
Hook validates action
  ↓
Hook validates constraints (additional check)
  ↓
If valid:
  Hook calls transitionTo()
  ↓
Store validates transition
  ↓
If valid:
  Store updates state
  ↓
Hook triggers API call
  ↓
API validates constraints (backend enforcement)
  ↓
If valid:
  API returns success
  ↓
Hook updates domain stores
  ↓
Component re-renders
```

---

## Implementation Strategy

### Phase 1: Core State Machine (Current)

**Status**: ✅ Implemented

**Components**:
- `appStateMachineStore.ts` - State machine store
- `useAppStateMachine.ts` - State machine hook
- Transition validation matrix
- Action validation matrix

**Features**:
- State transitions
- Action validation
- Error handling
- Type safety

---

### Phase 2: Transition Orchestrator (To Be Created)

**Purpose**: Coordinate transitions across stores

**Components**:
- `stateMachineOrchestrator.ts` - Transition orchestrator
- `performAction()` - Validate and perform action
- `transitionWithValidation()` - Validate and transition
- `handleError()` - Handle errors

**Features**:
- Multi-store coordination
- Constraint validation
- Side effect handling
- Error recovery

---

### Phase 3: Server Component Integration (To Be Created)

**Purpose**: Pass initial state from Server Components

**Components**:
- `AppStateMachineProvider.tsx` - State machine provider
- Server Component data fetching
- Client Component initialization

**Features**:
- Initial state from Server Components
- Store initialization
- Hydration support

---

## Summary

### Architecture Decision

**Chosen**: **Zustand + React Context + State Machine Layer**

**Rationale**:
- Zustand: Fast, lightweight, no provider needed
- Context: Server Component compatibility
- State Machine Layer: Centralized enforcement

### Where Transitions Are Defined

**Location**: `state/stores/appStateMachineStore.ts`

**Enforcement Points**:
1. Store level: Transition matrix validation
2. Hook level: Action validation
3. Orchestrator level: Constraint validation
4. Component level: UI blocking

### How Errors Are Handled

**Flow**:
1. Error occurs → Component catches
2. Component calls `handleError()` → Hook calls `transitionToError()`
3. Store transitions to `ERROR` state
4. UI shows error message and retry/reset buttons
5. User retries → `retryFromError()` → Back to previous state
6. User resets → `resetFromError()` → Back to `IDLE`

### React Server Components Compatibility

**Solution**: Hybrid approach
- Server Components fetch initial state, pass as props
- Client Components initialize Zustand stores with initial state
- Updates happen in Zustand (no Server Component re-renders)

---

## Key Principles

1. **State Machine is Authoritative**: All transitions go through state machine
2. **Multi-Layer Validation**: TypeScript → Store → Hook → Component
3. **Server Component Compatible**: Initial state from Server, updates in Client
4. **Error Recovery**: Errors transition to ERROR state, can retry or reset
5. **Optimistic Updates**: Immediate UI feedback, reconcile with backend

This architecture ensures the state machine is enforced, invalid transitions are prevented, and the system works seamlessly with React Server Components.
