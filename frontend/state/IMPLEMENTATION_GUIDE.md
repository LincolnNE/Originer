# State Management Implementation Guide

## Binding Strategy for JSX Implementation

**This guide shows exactly how to use the state management strategy in JSX components.**

---

## Core Principles

1. **Zustand stores** are the source of truth
2. **Hooks** provide React-friendly interface
3. **localStorage** persists UI state across refresh/navigation
4. **Backend** provides authoritative learning state
5. **State machine** enforces valid transitions

---

## Component Implementation Pattern

### Server Component (Route Page)

```typescript
// app/lessons/[sessionId]/[screenId]/page.tsx
export default async function LessonScreenPage({ params }) {
  // 1. Fetch authoritative state from backend
  const session = await fetchSession(params.sessionId);
  const screen = await fetchScreen(params.screenId);
  
  // 2. Validate route access (server-side)
  if (!session) {
    redirect('/');
  }
  if (session.completed) {
    redirect(`/lessons/${params.sessionId}/complete`);
  }
  if (!screen.unlocked) {
    redirect(`/lessons/${params.sessionId}`);
  }
  
  // 3. Pass initial state to Client Component
  return (
    <LessonScreenClient 
      initialSession={session}
      initialScreen={screen}
    />
  );
}
```

---

### Client Component (Lesson Screen)

```typescript
// components/screens/LessonScreenClient.tsx
'use client';

import { useEffect } from 'react';
import { useAppStateMachine } from '@/state/hooks/useAppStateMachine';
import { useSession } from '@/state/hooks/useSession';
import { useLessonState } from '@/state/hooks/useLessonState';

export function LessonScreenClient({ initialSession, initialScreen }) {
  const { 
    currentState, 
    transitionTo, 
    loadFromLocalStorage,
    canPerformAction 
  } = useAppStateMachine();
  
  const { setSession } = useSession();
  const { setCurrentScreen } = useLessonState();
  
  // 1. Initialize stores on mount
  useEffect(() => {
    // Initialize domain stores with authoritative state
    setSession(initialSession);
    setCurrentScreen(initialScreen.id);
    
    // Load UI state from localStorage (if exists)
    const storedState = loadFromLocalStorage();
    
    if (storedState) {
      // Restore UI state from localStorage
      transitionTo(storedState.currentState, storedState.stateData);
    } else {
      // Initialize to route's primary state
      transitionTo('IN_LESSON', {
        sessionId: initialSession.id,
        screenId: initialScreen.id,
      });
    }
  }, []);
  
  // 2. Use state machine for UI logic
  const canSubmit = canPerformAction('submitAnswer');
  const canRequestHint = canPerformAction('requestHint');
  
  // 3. Handle state transitions
  const handleSubmit = async () => {
    if (!canSubmit) {
      return; // Already blocked by UI, but double-check
    }
    
    // Transition to AWAITING_FEEDBACK
    transitionTo('AWAITING_FEEDBACK', {
      sessionId: initialSession.id,
      screenId: initialScreen.id,
    });
    
    // API call happens here
    // On success: transitionTo('REVIEWING')
    // On error: transitionToError()
  };
  
  // 4. Render based on state
  return (
    <div>
      {currentState === 'IN_LESSON' && (
        <LessonScreenUI 
          canSubmit={canSubmit}
          onSubmit={handleSubmit}
        />
      )}
      {currentState === 'AWAITING_FEEDBACK' && (
        <AwaitingFeedbackUI />
      )}
      {currentState === 'REVIEWING' && (
        <ReviewingUI />
      )}
    </div>
  );
}
```

---

## State Transition Pattern

### Valid Transition Flow

```typescript
// Component code
const handleAction = async () => {
  // 1. Check if action allowed
  if (!canPerformAction('submitAnswer')) {
    showError('Cannot submit answer in current state');
    return;
  }
  
  // 2. Transition state (validated automatically)
  transitionTo('AWAITING_FEEDBACK', {
    sessionId: session.id,
    screenId: screen.id,
  });
  
  // 3. Perform side effects (API calls)
  try {
    const response = await submitAnswer(answer);
    transitionTo('REVIEWING', {
      sessionId: session.id,
      screenId: screen.id,
    });
  } catch (error) {
    handleError(error, 'API_ERROR');
  }
};
```

### Invalid Transition Prevention

```typescript
// transitionTo() automatically validates
transitionTo('INVALID_STATE'); // Blocked, console.warn, no state change

// Component should check before calling
if (canTransitionTo('REVIEWING')) {
  transitionTo('REVIEWING');
} else {
  showError('Cannot transition to REVIEWING from current state');
}
```

---

## Persistence Pattern

### Loading State on Mount

```typescript
useEffect(() => {
  // 1. Load authoritative state from Server Component props
  setSession(initialSession);
  setCurrentScreen(initialScreen.id);
  
  // 2. Load UI state from localStorage
  const storedState = loadFromLocalStorage();
  
  // 3. Reconcile states
  if (storedState) {
    // Use stored UI state if valid
    transitionTo(storedState.currentState, storedState.stateData);
  } else {
    // Initialize to route's primary state
    transitionTo('IN_LESSON', {
      sessionId: initialSession.id,
      screenId: initialScreen.id,
    });
  }
}, []);
```

### Saving State on Changes

```typescript
// State is automatically saved to localStorage on transition
// transitionTo() calls saveToLocalStorage() internally

// Manual save (if needed)
const { saveToLocalStorage } = useAppStateMachine();
saveToLocalStorage();
```

### Clearing State on Reset

```typescript
const handleReset = () => {
  resetFromError(); // Automatically clears localStorage
  // Or manually:
  clearLocalStorage();
  router.push('/');
};
```

---

## Error Handling Pattern

```typescript
const handleError = (error: Error, errorType: ErrorType) => {
  // Transition to ERROR state
  transitionToError(error, errorType, currentState);
  
  // Show error UI
  // Error state is persisted to localStorage automatically
};

const handleRetry = async () => {
  // Retry from error state
  await retryFromError();
  
  // Retry failed operation
  // State automatically transitions back to previous state
};

const handleReset = () => {
  // Reset to IDLE
  resetFromError(); // Clears localStorage, transitions to IDLE
  router.push('/');
};
```

---

## Constraint Validation Pattern

```typescript
const { constraints, canPerformAction: canPerformConstraintAction } = useConstraints();
const { canPerformAction: canPerformStateAction } = useAppStateMachine();

const handleSubmit = async () => {
  // 1. Check state-level permission
  if (!canPerformStateAction('submitAnswer')) {
    showError('Cannot submit in current state');
    return;
  }
  
  // 2. Check constraint-level permission
  if (!canPerformConstraintAction('submitAnswer')) {
    const reason = constraints.getBlockingReason('submitAnswer');
    showError(reason);
    return;
  }
  
  // 3. Both checks passed, proceed
  transitionTo('AWAITING_FEEDBACK');
  // ... API call
};
```

---

## Navigation Pattern

```typescript
const handleProceed = async () => {
  // 1. Validate can proceed
  if (!canPerformAction('proceedToNext')) {
    return;
  }
  
  // 2. Get next screen
  const nextScreen = await getNextScreen(sessionId);
  
  // 3. Save current state to localStorage before navigation
  saveToLocalStorage();
  
  // 4. Navigate to next screen
  router.push(`/lessons/${sessionId}/${nextScreen.id}`);
  
  // 5. New route will load and initialize state
};
```

---

## Summary

**All JSX components must**:
1. Use hooks (`useAppStateMachine()`, `useSession()`, etc.)
2. Call `transitionTo()` for state changes (validated automatically)
3. Load from localStorage on mount (via `loadFromLocalStorage()`)
4. State automatically saves to localStorage on transitions
5. Sync with backend authoritative state (from Server Components)

**No direct store access allowed.**
**No manual state manipulation allowed.**
**All transitions go through `transitionTo()` method.**

---

**This pattern is binding for all JSX implementation.**
