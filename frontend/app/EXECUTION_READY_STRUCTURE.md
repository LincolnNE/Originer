# Execution-Ready Next.js App Router Structure

## Status: LOCKED & EXECUTION-READY

**This structure is final and locked for execution.**

---

## Final Route Tree

```
app/
├── layout.tsx                          # Root layout (all states)
├── page.tsx                            # Landing → IDLE state
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

| Route | Primary Frontend State | Validation Required | Invalid Access → Redirect To |
|-------|----------------------|---------------------|------------------------------|
| `/` | `IDLE` | None | N/A (always accessible) |
| `/assess/[sessionId]` | `ASSESSING_LEVEL` | Session exists, not completed, assessment not completed | `/` or `/lessons/[sessionId]/screen_001` |
| `/lessons/[sessionId]` | **Redirect** | Session exists, not completed | `/` or `/lessons/[sessionId]/complete` |
| `/lessons/[sessionId]/[screenId]` | `IN_LESSON` | Session exists, not completed, screen unlocked, screen not completed | `/lessons/[sessionId]` or `/lessons/[sessionId]/complete` |
| `/lessons/[sessionId]/complete` | `COMPLETED` | Session exists, session completed | `/lessons/[sessionId]/[screenId]` or `/` |

**Note**: `AWAITING_FEEDBACK` and `REVIEWING` are UI states within the `IN_LESSON` route, handled by the component's state machine.

---

## Invalid Access Scenarios & Handling

### Scenario 1: Invalid Session ID

**User Action**: Types `/lessons/invalid_session/screen_001`

**System Response**:
1. Attempt to load session from backend
2. Backend returns 404/null
3. **Redirect to**: `/` (IDLE state)

**Result**: Invalid sessions cannot be accessed

---

### Scenario 2: Locked Screen Access

**User Action**: Types `/lessons/sess_123/screen_005` but screen_005 is locked

**System Response**:
1. Load session from backend
2. Check screen unlock status
3. Screen is locked
4. **Redirect to**: `/lessons/sess_123` (which redirects to first unlocked screen)

**Result**: Cannot access locked screens via URL manipulation

---

### Scenario 3: Completed Screen Access

**User Action**: Types `/lessons/sess_123/screen_001` but screen_001 is completed

**System Response**:
1. Load session and screen from backend
2. Check screen completion status
3. Screen is completed
4. **Redirect to**: `/lessons/sess_123/screen_002` (next screen) or `/lessons/sess_123/complete` (if final screen)

**Result**: Cannot re-access completed screens

---

### Scenario 4: Early Completion Access

**User Action**: Types `/lessons/sess_123/complete` but session not completed

**System Response**:
1. Load session from backend
2. Check session completion status
3. Session not completed
4. **Redirect to**: `/lessons/sess_123/[screenId]` where `screenId` is first incomplete screen

**Result**: Cannot access completion route before session completion

---

### Scenario 5: Completed Assessment Access

**User Action**: Types `/assess/sess_123` but assessment already completed

**System Response**:
1. Load session from backend
2. Check assessment completion status
3. Assessment completed
4. **Redirect to**: `/lessons/sess_123/screen_001` (IN_LESSON)

**Result**: Cannot re-access completed assessment

---

### Scenario 6: Completed Session Access to Lesson Screen

**User Action**: Types `/lessons/sess_123/screen_001` but session already completed

**System Response**:
1. Load session from backend
2. Check session completion status
3. Session completed
4. **Redirect to**: `/lessons/sess_123/complete` (COMPLETED)

**Result**: Cannot access lesson screens after session completion

---

## Route Protection Implementation

### Server-Side Validation Pattern

**Every route `page.tsx` must**:
1. Validate session exists (if `sessionId` present)
2. Validate session state matches route requirements
3. Validate screen unlock status (if `screenId` present)
4. Redirect on invalid access
5. Pass validated initial state to Client Components

**Example Implementation**:
```typescript
// app/lessons/[sessionId]/[screenId]/page.tsx
export default async function LessonScreenPage({ params }) {
  // 1. Validate session exists
  const session = await fetchSession(params.sessionId);
  if (!session) {
    redirect('/');
  }

  // 2. Validate session not completed
  if (session.completed) {
    redirect(`/lessons/${params.sessionId}/complete`);
  }

  // 3. Validate screen unlocked
  const screen = await fetchScreen(params.screenId);
  if (!screen.unlocked) {
    redirect(`/lessons/${params.sessionId}`);
  }

  // 4. Validate screen not completed
  if (screen.completed) {
    const nextScreen = await getNextScreen(params.sessionId);
    redirect(`/lessons/${params.sessionId}/${nextScreen?.id || 'complete'}`);
  }

  // 5. If valid, render with initial state
  return (
    <LessonScreenClient 
      initialSession={session}
      initialScreen={screen}
    />
  );
}
```

---

## State Machine Enforcement

### Route Initialization

**On Route Load**:
1. Server Component validates route access
2. Server Component loads session/screen state
3. Server Component passes initial state to Client Component
4. Client Component initializes state machine to route's primary state
5. Component renders with correct state

**State Initialization**:
- Route `/lessons/[sessionId]/[screenId]` → Initialize to `IN_LESSON` state
- Route `/lessons/[sessionId]/complete` → Initialize to `COMPLETED` state
- Route `/assess/[sessionId]` → Initialize to `ASSESSING_LEVEL` state
- Route `/` → Initialize to `IDLE` state

---

## No Free-Form Interaction Routes

### Allowed Routes (Structured Only)

✅ `/` - Landing page (button-based, no free input)  
✅ `/assess/[sessionId]` - Assessment (structured questions, no chat)  
✅ `/lessons/[sessionId]/[screenId]` - Lesson screen (structured problem/answer, no chat)  
✅ `/lessons/[sessionId]/complete` - Completion (structured summary, no chat)

### Disallowed Routes (Never Created)

❌ `/chat` - No chat route  
❌ `/message` - No message route  
❌ `/conversation` - No conversation route  
❌ Any route accepting arbitrary user input  
❌ Any route allowing free-form text interaction

**Enforcement**: Route structure prevents creation of free-form interaction routes

---

## Navigation Rules

### Valid Navigation Flow

```
/ (IDLE)
  ↓ (create session)
/lessons/[sessionId]/screen_001 (IN_LESSON)
  ↓ (submit answer - state change only)
/lessons/[sessionId]/screen_001 (IN_LESSON, UI state: AWAITING_FEEDBACK)
  ↓ (feedback received - state change only)
/lessons/[sessionId]/screen_001 (IN_LESSON, UI state: REVIEWING)
  ↓ (proceed - route change)
/lessons/[sessionId]/screen_002 (IN_LESSON)
  ↓ (repeat)
/lessons/[sessionId]/screen_003 (IN_LESSON)
  ↓ (complete final screen - route change)
/lessons/[sessionId]/complete (COMPLETED)
  ↓ (start new session - route change)
/ (IDLE)
```

### Invalid Navigation Prevention

- **Cannot skip screens**: URL to locked screen → Redirect to first unlocked
- **Cannot re-access completed screens**: URL to completed screen → Redirect to next screen
- **Cannot access completion early**: URL to complete before completion → Redirect to first incomplete screen
- **Cannot access invalid sessions**: URL with invalid sessionId → Redirect to landing

---

## Validation Matrix

| Route | Session Exists | Session Not Completed | Screen Unlocked | Screen Not Completed | Assessment Not Completed | Action |
|-------|----------------|----------------------|-----------------|---------------------|-------------------------|--------|
| `/` | N/A | N/A | N/A | N/A | N/A | ✅ Allow |
| `/assess/[sessionId]` | ✅ Required | ✅ Required | N/A | N/A | ✅ Required | ✅ Allow, else redirect |
| `/lessons/[sessionId]` | ✅ Required | ✅ Required | N/A | N/A | N/A | ✅ Redirect to screen |
| `/lessons/[sessionId]/[screenId]` | ✅ Required | ✅ Required | ✅ Required | ✅ Required | N/A | ✅ Allow, else redirect |
| `/lessons/[sessionId]/complete` | ✅ Required | ❌ Must be completed | N/A | N/A | N/A | ✅ Allow, else redirect |

---

## Implementation Checklist

### Server Components (Route Pages)

- [x] Route structure defined
- [ ] Validate `sessionId` exists
- [ ] Validate session state matches route
- [ ] Validate screen unlock status (for screen routes)
- [ ] Redirect on invalid access
- [ ] Pass initial state to Client Components

### Client Components

- [x] Component structure defined
- [ ] Initialize state machine to route's primary state
- [ ] Validate initial state matches route
- [ ] Handle state transitions within route
- [ ] Navigate on route-changing transitions
- [ ] Prevent invalid state transitions

### Route Protection

- [x] Route structure prevents free-form interaction
- [ ] Server-side validation in `page.tsx`
- [ ] Client-side validation in components
- [ ] Error boundaries for invalid states
- [ ] Redirect logic for invalid access

---

## Summary

**Final Routes**: 5 main routes + error/loading routes

**State Mapping**: Each route maps to exactly one primary frontend state

**Invalid Access**: All invalid access scenarios redirect to valid routes

**No Free-Form Interaction**: All routes are structured, no chat-like interfaces

**Route Protection**: Server-side validation + Client-side validation

**Status**: **LOCKED & EXECUTION-READY**

---

## Files Created

1. `FINAL_ROUTE_STRUCTURE.md` - Complete final structure documentation
2. `ROUTE_VALIDATION.md` - Route validation rules and patterns
3. `ROUTE_LOCK_SUMMARY.md` - Quick reference summary
4. `EXECUTION_READY_STRUCTURE.md` - This file (comprehensive guide)

---

**This structure is LOCKED and ready for execution.**
