# Final Next.js App Router Structure (LOCKED)

## Status: EXECUTION-READY

**This structure is LOCKED and considered final for execution.**

---

## Core Principles

1. **One Route = One State**: Every route maps to exactly one frontend state
2. **Invalid Access Prevention**: Invalid state access via URL is impossible or redirected
3. **No Free-Form Interaction**: No routes allow unrestricted user input or chat-like interaction
4. **Strict Validation**: All routes validate session/screen state before rendering

---

## Final Route Tree

```
app/
├── layout.tsx                          # Root layout (all states)
├── page.tsx                            # Landing page → IDLE state
├── loading.tsx                         # Global loading (transient)
├── error.tsx                           # Global error → ERROR state
├── not-found.tsx                       # 404 → ERROR state
│
├── assess/                              # Assessment flow (optional, MVP: skip)
│   └── [sessionId]/
│       ├── layout.tsx                   # Assessment layout
│       ├── page.tsx                     # Assessment → ASSESSING_LEVEL state
│       ├── loading.tsx                  # Assessment loading (transient)
│       └── error.tsx                    # Assessment error → ERROR state
│
└── lessons/                             # Main learning flow
    └── [sessionId]/
        ├── layout.tsx                   # Session layout
        ├── page.tsx                     # Session overview → Redirects (no state)
        ├── loading.tsx                  # Session loading (transient)
        ├── error.tsx                    # Session error → ERROR state
        │
        ├── [screenId]/                  # Lesson screen (core)
        │   ├── page.tsx                 # Lesson screen → IN_LESSON state (primary)
        │   ├── loading.tsx              # Screen loading (transient)
        │   └── error.tsx                # Screen error → ERROR state
        │
        └── complete/                    # Session completion
            ├── page.tsx                 # Completion → COMPLETED state
            ├── loading.tsx              # Completion loading (transient)
            └── error.tsx                # Completion error → ERROR state
```

---

## Route-to-State Mapping (FINAL)

| Route | File | Primary Frontend State | Secondary States | Validation |
|-------|------|----------------------|------------------|------------|
| `/` | `app/page.tsx` | `IDLE` | None | None (entry point) |
| `/assess/[sessionId]` | `app/assess/[sessionId]/page.tsx` | `ASSESSING_LEVEL` | `ERROR` | Session exists, not completed |
| `/lessons/[sessionId]` | `app/lessons/[sessionId]/page.tsx` | **Redirect** | None | Session exists → Redirect to first screen |
| `/lessons/[sessionId]/[screenId]` | `app/lessons/[sessionId]/[screenId]/page.tsx` | `IN_LESSON` | `ERROR` | Session exists, screen unlocked, screen not completed |
| `/lessons/[sessionId]/complete` | `app/lessons/[sessionId]/complete/page.tsx` | `COMPLETED` | `ERROR` | Session exists, session completed |
| Any route error | `app/*/error.tsx` | `ERROR` | None | Error occurred |
| 404 | `app/not-found.tsx` | `ERROR` | None | Route not found |

**Note**: `AWAITING_FEEDBACK` and `REVIEWING` are UI states within the `IN_LESSON` route, not separate routes. The route always initializes to `IN_LESSON` state, and state transitions happen within the component.

---

## Route Protection & Validation

### 1. Landing Page (`/`)

**Primary State**: `IDLE`

**Validation**: None (entry point)

**Invalid Access Handling**: N/A (always accessible)

**Behavior**:
- Always accessible
- No session required
- Creates new session on "Start Learning"
- Redirects to `/lessons/[sessionId]/screen_001` after session creation

---

### 2. Assessment Route (`/assess/[sessionId]`)

**Primary State**: `ASSESSING_LEVEL`

**Validation**:
1. `sessionId` must exist in backend
2. Session must not be completed
3. Assessment must not be completed (if accessing after completion)

**Invalid Access Handling**:
- **Session doesn't exist**: Redirect to `/` (IDLE)
- **Session completed**: Redirect to `/lessons/[sessionId]/complete` (COMPLETED)
- **Assessment completed**: Redirect to `/lessons/[sessionId]/screen_001` (IN_LESSON)
- **Invalid sessionId format**: Redirect to `/` (IDLE)

**Behavior**:
- Loads session from backend
- Validates session state
- If invalid, redirects to appropriate route
- If valid, initializes `ASSESSING_LEVEL` state
- No free-form interaction (structured assessment only)

---

### 3. Session Overview Route (`/lessons/[sessionId]`)

**Primary State**: **Redirect (no state)**

**Validation**:
1. `sessionId` must exist in backend
2. Session must not be completed

**Invalid Access Handling**:
- **Session doesn't exist**: Redirect to `/` (IDLE)
- **Session completed**: Redirect to `/lessons/[sessionId]/complete` (COMPLETED)
- **Invalid sessionId format**: Redirect to `/` (IDLE)

**Behavior**:
- Loads session from backend
- Determines first unlocked screen or last active screen
- Immediately redirects to `/lessons/[sessionId]/[screenId]` (IN_LESSON)
- No UI rendered (redirect only)

---

### 4. Lesson Screen Route (`/lessons/[sessionId]/[screenId]`)

**Primary State**: `IN_LESSON`

**Validation**:
1. `sessionId` must exist in backend
2. `screenId` must be valid format (`screen_001`, `screen_002`, etc.)
3. Screen must be unlocked for session
4. Screen must not be completed (if accessing completed screen, redirect to next)

**Invalid Access Handling**:
- **Session doesn't exist**: Redirect to `/` (IDLE)
- **Session completed**: Redirect to `/lessons/[sessionId]/complete` (COMPLETED)
- **Screen locked**: Redirect to `/lessons/[sessionId]` (which redirects to first unlocked screen)
- **Screen completed**: Redirect to `/lessons/[sessionId]/[nextScreenId]` (if next exists) or `/lessons/[sessionId]/complete` (if final screen)
- **Invalid screenId format**: Redirect to `/lessons/[sessionId]`
- **Screen doesn't exist**: Redirect to `/lessons/[sessionId]`

**Behavior**:
- Loads session and screen from backend
- Validates screen unlock status
- If invalid, redirects to appropriate route
- If valid, initializes `IN_LESSON` state
- Component handles state transitions (`AWAITING_FEEDBACK`, `REVIEWING`) internally
- No free-form interaction (structured lesson screen only)

**State Transitions Within Route**:
- `IN_LESSON` → `AWAITING_FEEDBACK`: Same route, state change only
- `AWAITING_FEEDBACK` → `REVIEWING`: Same route, state change only
- `REVIEWING` → `IN_LESSON`: Same route (revise) or next route (proceed)

---

### 5. Session Complete Route (`/lessons/[sessionId]/complete`)

**Primary State**: `COMPLETED`

**Validation**:
1. `sessionId` must exist in backend
2. Session must be completed

**Invalid Access Handling**:
- **Session doesn't exist**: Redirect to `/` (IDLE)
- **Session not completed**: Redirect to `/lessons/[sessionId]/[screenId]` (IN_LESSON) where `screenId` is first incomplete screen
- **Invalid sessionId format**: Redirect to `/` (IDLE)

**Behavior**:
- Loads session from backend
- Validates session completion status
- If invalid, redirects to appropriate route
- If valid, initializes `COMPLETED` state
- No free-form interaction (completion screen only)

---

## Invalid Access Scenarios

### Scenario 1: Direct URL Access to Locked Screen

**User Action**: Types `/lessons/sess_123/screen_005` directly in browser

**System Response**:
1. Load session `sess_123` from backend
2. Check if `screen_005` is unlocked
3. If locked: Redirect to `/lessons/sess_123` (which redirects to first unlocked screen)
4. If unlocked: Load screen, initialize `IN_LESSON` state

**Result**: User cannot access locked screens via URL manipulation

---

### Scenario 2: Access Completed Screen

**User Action**: Types `/lessons/sess_123/screen_001` but screen_001 is already completed

**System Response**:
1. Load session and screen from backend
2. Check screen completion status
3. If completed: Redirect to `/lessons/sess_123/screen_002` (next screen) or `/lessons/sess_123/complete` (if final screen)
4. If not completed: Load screen, initialize `IN_LESSON` state

**Result**: User cannot re-access completed screens (must use navigation)

---

### Scenario 3: Access Non-Existent Session

**User Action**: Types `/lessons/invalid_session/screen_001`

**System Response**:
1. Attempt to load session `invalid_session` from backend
2. Backend returns 404 or null
3. Redirect to `/` (IDLE state)

**Result**: Invalid sessions redirect to landing page

---

### Scenario 4: Access Assessment After Completion

**User Action**: Types `/assess/sess_123` but assessment already completed

**System Response**:
1. Load session from backend
2. Check assessment completion status
3. If completed: Redirect to `/lessons/sess_123/screen_001` (IN_LESSON)
4. If not completed: Load assessment, initialize `ASSESSING_LEVEL` state

**Result**: Cannot re-access completed assessment

---

### Scenario 5: Access Complete Route Before Completion

**User Action**: Types `/lessons/sess_123/complete` but session not completed

**System Response**:
1. Load session from backend
2. Check session completion status
3. If not completed: Redirect to `/lessons/sess_123/[screenId]` where `screenId` is first incomplete screen
4. If completed: Load completion screen, initialize `COMPLETED` state

**Result**: Cannot access completion route before session completion

---

## Route Protection Implementation

### Server-Side Validation (Server Components)

**Location**: Each route `page.tsx` file

**Pattern**:
```typescript
export default async function RoutePage({ params }) {
  // 1. Validate session exists
  const session = await fetchSession(params.sessionId);
  if (!session) {
    redirect('/');
  }

  // 2. Validate route-specific conditions
  if (session.completed && route !== '/complete') {
    redirect(`/lessons/${params.sessionId}/complete`);
  }

  // 3. Validate screen unlock (for screen routes)
  if (route.includes('[screenId]')) {
    const screen = await fetchScreen(params.screenId);
    if (!screen.unlocked) {
      redirect(`/lessons/${params.sessionId}`);
    }
  }

  // 4. If valid, render page
  return <PageComponent />;
}
```

---

### Client-Side Validation (Client Components)

**Location**: Client components within routes

**Pattern**:
```typescript
'use client';
export function PageComponent({ initialSession, initialScreen }) {
  const { currentState, transitionTo } = useAppStateMachine();
  
  useEffect(() => {
    // Validate initial state matches route
    if (route === '/lessons/[sessionId]/[screenId]' && currentState !== 'IN_LESSON') {
      transitionTo('IN_LESSON');
    }
    
    // Validate constraints
    if (!canAccessRoute(initialSession, initialScreen)) {
      router.push(getValidRoute(initialSession, initialScreen));
    }
  }, []);
}
```

---

## No Free-Form Interaction Routes

### Allowed Routes

✅ `/` - Landing page (structured, button-based)  
✅ `/assess/[sessionId]` - Assessment (structured questions)  
✅ `/lessons/[sessionId]/[screenId]` - Lesson screen (structured problem/answer)  
✅ `/lessons/[sessionId]/complete` - Completion (structured summary)

### Disallowed Routes

❌ No `/chat` route  
❌ No `/message` route  
❌ No `/conversation` route  
❌ No routes that accept arbitrary user input  
❌ No routes that allow free-form text interaction

**Enforcement**: Route structure prevents creation of free-form interaction routes

---

## State Machine Enforcement

### Route Initialization

**On Route Load**:
1. Extract route parameters (`sessionId`, `screenId`)
2. Load session/screen state from backend
3. Validate route access (server-side)
4. Initialize frontend state machine to route's primary state
5. Render component with initial state

**Example**:
- Route: `/lessons/[sessionId]/[screenId]`
- Primary State: `IN_LESSON`
- Initialization: `transitionTo('IN_LESSON', { sessionId, screenId })`

---

### State Transitions Within Route

**Allowed Transitions** (within `/lessons/[sessionId]/[screenId]`):
- `IN_LESSON` → `AWAITING_FEEDBACK` (on submit)
- `AWAITING_FEEDBACK` → `REVIEWING` (on feedback received)
- `REVIEWING` → `IN_LESSON` (on revise)

**Route Changes** (require navigation):
- `REVIEWING` → `IN_LESSON` (on proceed to next screen) → Navigate to `/lessons/[sessionId]/[nextScreenId]`
- `REVIEWING` → `COMPLETED` (on final screen) → Navigate to `/lessons/[sessionId]/complete`

---

## Route Validation Matrix

| Route | Session Exists | Session Not Completed | Screen Unlocked | Screen Not Completed | Assessment Not Completed | Action |
|-------|----------------|----------------------|-----------------|---------------------|-------------------------|--------|
| `/` | N/A | N/A | N/A | N/A | N/A | ✅ Allow |
| `/assess/[sessionId]` | ✅ Required | ✅ Required | N/A | N/A | ✅ Required | ✅ Allow, else redirect |
| `/lessons/[sessionId]` | ✅ Required | ✅ Required | N/A | N/A | N/A | ✅ Redirect to screen |
| `/lessons/[sessionId]/[screenId]` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | N/A | ✅ Allow, else redirect |
| `/lessons/[sessionId]/complete` | ✅ Required | ❌ Must be completed | N/A | N/A | N/A | ✅ Allow, else redirect |

---

## Navigation Rules

### Valid Navigation Paths

```
/ (IDLE)
  ↓ (create session)
/lessons/[sessionId]/screen_001 (IN_LESSON)
  ↓ (submit answer)
/lessons/[sessionId]/screen_001 (IN_LESSON, state: AWAITING_FEEDBACK)
  ↓ (feedback received)
/lessons/[sessionId]/screen_001 (IN_LESSON, state: REVIEWING)
  ↓ (proceed)
/lessons/[sessionId]/screen_002 (IN_LESSON)
  ↓ (repeat)
/lessons/[sessionId]/screen_003 (IN_LESSON)
  ↓ (complete final screen)
/lessons/[sessionId]/complete (COMPLETED)
  ↓ (start new session)
/ (IDLE)
```

### Invalid Navigation Prevention

- **Cannot skip screens**: URL manipulation to locked screen → Redirect to first unlocked
- **Cannot re-access completed screens**: URL to completed screen → Redirect to next screen
- **Cannot access completion early**: URL to complete before completion → Redirect to first incomplete screen
- **Cannot access invalid sessions**: URL with invalid sessionId → Redirect to landing

---

## Implementation Checklist

### Server Components (Route Pages)

- [ ] Validate `sessionId` exists
- [ ] Validate session state matches route
- [ ] Validate screen unlock status (for screen routes)
- [ ] Redirect on invalid access
- [ ] Pass initial state to Client Components

### Client Components

- [ ] Initialize state machine to route's primary state
- [ ] Validate initial state matches route
- [ ] Handle state transitions within route
- [ ] Navigate on route-changing transitions
- [ ] Prevent invalid state transitions

### Route Protection

- [ ] Server-side validation in `page.tsx`
- [ ] Client-side validation in components
- [ ] Error boundaries for invalid states
- [ ] Redirect logic for invalid access

---

## Summary

**Final Route Structure**: 5 main routes + error/loading routes

**State Mapping**: Each route maps to exactly one primary frontend state

**Invalid Access**: All invalid access scenarios redirect to valid routes

**No Free-Form Interaction**: All routes are structured, no chat-like interfaces

**Status**: **LOCKED** - This structure is final and execution-ready

---

## Route Protection Summary

| Route | Primary State | Invalid Access Handling |
|-------|---------------|------------------------|
| `/` | `IDLE` | N/A (always accessible) |
| `/assess/[sessionId]` | `ASSESSING_LEVEL` | Redirect to `/` or `/lessons/[sessionId]/screen_001` |
| `/lessons/[sessionId]` | Redirect | Redirect to `/lessons/[sessionId]/[screenId]` or `/` |
| `/lessons/[sessionId]/[screenId]` | `IN_LESSON` | Redirect to `/lessons/[sessionId]` or `/lessons/[sessionId]/complete` |
| `/lessons/[sessionId]/complete` | `COMPLETED` | Redirect to `/lessons/[sessionId]/[screenId]` or `/` |

**All routes enforce strict validation and prevent invalid access.**
