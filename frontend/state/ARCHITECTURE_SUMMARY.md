# State Management Architecture Summary

## Decision: Hybrid Approach

**Chosen**: **Zustand + React Context + State Machine Layer**

**Why**:
- ✅ Zustand: Fast, lightweight, no provider needed (Client Components)
- ✅ Context: Server Component compatibility (initial state)
- ✅ State Machine Layer: Centralized transition enforcement

**Why Not**:
- ❌ Pure Context: Causes re-renders, not ideal for frequent updates
- ❌ Pure Zustand: Server Components can't access directly
- ❌ State Machine Library: Overkill, adds complexity

---

## Architecture Layers

### 1. State Machine Core (Zustand)
**Location**: `state/stores/appStateMachineStore.ts`

**Purpose**: Enforce state machine transitions

**Key Features**:
- Transition validation matrix (`VALID_TRANSITIONS`)
- Action validation matrix (`ACTION_ALLOWED`)
- `transitionTo()` - Validates before allowing transition
- Invalid transitions blocked (console.warn + no state change)

---

### 2. Domain Stores (Zustand)
**Location**: `state/stores/*.ts`

**Purpose**: Domain-specific state (session, lesson, progress, constraints)

**Stores**:
- `sessionStore` - Session state
- `lessonStateStore` - Lesson screen state
- `progressStore` - Progress tracking
- `constraintStore` - Active constraints

**Relationship**: Independent of state machine, work together

---

### 3. React Hooks (Client Components)
**Location**: `state/hooks/*.ts`

**Purpose**: React-friendly interface to stores

**Hooks**:
- `useAppStateMachine()` - State machine
- `useSession()` - Session
- `useLessonState()` - Lesson state
- `useProgress()` - Progress
- `useConstraints()` - Constraints

**Usage**: Only in Client Components (`'use client'`)

---

### 4. React Context (Server Component Compatibility)
**Location**: `state/providers/*.tsx`

**Purpose**: Pass initial state from Server Components

**Flow**:
1. Server Component fetches initial state
2. Passes as props to Client Component
3. Client Component initializes Zustand stores
4. Updates happen in Zustand (no Server Component re-renders)

---

### 5. Transition Orchestrator (To Be Created)
**Location**: `state/orchestrators/stateMachineOrchestrator.ts`

**Purpose**: Coordinate transitions across stores

**Key Methods**:
- `performAction(action, context)` - Validate and perform
- `transitionWithValidation(newState, data)` - Validate and transition
- `handleError(error, context)` - Handle errors

---

## Where Transitions Are Defined

**Location**: `state/stores/appStateMachineStore.ts`

**Transition Matrix**:
```typescript
const VALID_TRANSITIONS: Record<AppState, AppState[]> = {
  IDLE: ['ASSESSING_LEVEL', 'IN_LESSON', 'ERROR'],
  IN_LESSON: ['AWAITING_FEEDBACK', 'REVIEWING', 'COMPLETED', 'ERROR'],
  // ... etc
};
```

**Enforcement Points**:
1. **Store Level**: `transitionTo()` validates matrix
2. **Hook Level**: `safeTransitionTo()` double-checks
3. **Orchestrator Level**: Validates constraints
4. **Component Level**: UI blocks invalid actions

---

## Preventing Invalid Transitions

### Multi-Layer Validation

1. **TypeScript Types**: Discriminated unions, type guards
2. **Transition Matrix**: `VALID_TRANSITIONS` defines allowed transitions
3. **Action Matrix**: `ACTION_ALLOWED` defines allowed actions
4. **Constraint Validation**: Rate limits, cooldowns, mastery
5. **UI Blocking**: Components check `canPerformAction()` before rendering

**Result**: Invalid transitions blocked at multiple layers

---

## React Server Components Compatibility

### Problem
- Server Components can't use hooks
- Server Components can't access Zustand stores
- Need to pass initial state from Server to Client

### Solution: Hybrid Approach

**Server Component**:
```typescript
// Fetch initial state
const initialSession = await fetchSession(sessionId);

// Pass to Client Component
return <LessonScreenClient initialSession={initialSession} />;
```

**Client Component**:
```typescript
'use client';
export function LessonScreenClient({ initialSession }) {
  const { setSession } = useSession();
  
  // Initialize store with initial state
  useEffect(() => {
    setSession(initialSession);
  }, []);
  
  // Use hooks for updates
  const { currentState } = useAppStateMachine();
}
```

---

## Error Handling

### Error Flow

1. **Error Occurs**: API fails, network error, validation error
2. **Error Detection**: Component catches, calls `handleError()`
3. **State Transition**: `transitionToError()` → `ERROR` state
4. **UI Updates**: Shows error message, retry/reset buttons
5. **Error Recovery**: 
   - Retry → `retryFromError()` → Back to previous state
   - Reset → `resetFromError()` → Back to `IDLE`

### Error Types

- `NETWORK_ERROR` - Can retry
- `API_ERROR` - Can retry
- `VALIDATION_ERROR` - Fix and retry
- `TIMEOUT_ERROR` - Can retry
- `SESSION_ERROR` - Must reset

---

## Transition Flow

```
User Action
  ↓
Component checks canPerformAction()
  ↓
Component checks constraints
  ↓
Hook validates action
  ↓
Hook validates constraints
  ↓
Store validates transition (VALID_TRANSITIONS)
  ↓
Store updates state
  ↓
Hook triggers side effects (API calls)
  ↓
Component re-renders
```

---

## Key Principles

1. **State Machine is Authoritative**: All transitions go through state machine
2. **Multi-Layer Validation**: TypeScript → Store → Hook → Component
3. **Server Component Compatible**: Initial state from Server, updates in Client
4. **Error Recovery**: Errors → ERROR state → Retry/Reset
5. **Optimistic Updates**: Immediate UI feedback, reconcile with backend

---

## Implementation Status

✅ **Phase 1: Core State Machine** (Implemented)
- State machine store
- Transition validation
- Action validation
- Error handling

⏳ **Phase 2: Transition Orchestrator** (To Be Created)
- Multi-store coordination
- Constraint validation
- Side effect handling

⏳ **Phase 3: Server Component Integration** (To Be Created)
- Initial state from Server Components
- Store initialization
- Hydration support

---

See `STATE_MANAGEMENT_ARCHITECTURE.md` for complete documentation.
