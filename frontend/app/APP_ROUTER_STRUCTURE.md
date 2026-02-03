# Next.js App Router Structure

## Overview

**Framework**: Next.js 14+ (App Router)  
**Pattern**: Screen-based routes mapping to frontend state machine  
**Principle**: Each route maps to a specific frontend state

---

## Directory Tree

```
app/
├── layout.tsx                          # Root layout (providers, global styles)
├── page.tsx                            # Landing page → IDLE state
├── loading.tsx                         # Global loading UI
├── error.tsx                            # Global error boundary
├── not-found.tsx                       # 404 page
│
├── assess/                              # Assessment flow (optional, MVP: skip)
│   └── [sessionId]/
│       ├── layout.tsx                   # Assessment layout
│       ├── page.tsx                     # Assessment screen → ASSESSING_LEVEL state
│       ├── loading.tsx                  # Assessment loading
│       └── error.tsx                    # Assessment error
│
└── lessons/                             # Main learning flow
    └── [sessionId]/
        ├── layout.tsx                   # Session layout (progress bar, navigation)
        ├── page.tsx                     # Session overview (optional, MVP: redirect)
        ├── loading.tsx                  # Session loading
        ├── error.tsx                    # Session error
        │
        ├── [screenId]/                  # Lesson screen (core)
        │   ├── page.tsx                 # Lesson screen → IN_LESSON/AWAITING_FEEDBACK/REVIEWING states
        │   ├── loading.tsx               # Screen loading
        │   └── error.tsx                # Screen error
        │
        └── complete/                    # Session completion
            ├── page.tsx                 # Completion screen → COMPLETED state
            ├── loading.tsx               # Completion loading
            └── error.tsx                # Completion error
```

---

## Route-to-State Mapping

| Route | Frontend State | Purpose | Accessible States |
|-------|----------------|---------|-------------------|
| `/` | `IDLE` | Landing page, start session | `IDLE` only |
| `/assess/[sessionId]` | `ASSESSING_LEVEL` | Level assessment (optional) | `ASSESSING_LEVEL`, `ERROR` |
| `/lessons/[sessionId]` | `IN_LESSON` (redirect) | Session overview (optional) | Redirects to `[screenId]` |
| `/lessons/[sessionId]/[screenId]` | `IN_LESSON`<br>`AWAITING_FEEDBACK`<br>`REVIEWING` | Main learning interface | `IN_LESSON`, `AWAITING_FEEDBACK`, `REVIEWING`, `ERROR` |
| `/lessons/[sessionId]/complete` | `COMPLETED` | Session completion | `COMPLETED`, `ERROR` |

**Note**: `ERROR` state can occur on any route, handled by route-specific `error.tsx` files.

---

## Route Definitions

### 1. Root Layout

**File**: `app/layout.tsx`  
**Route**: N/A (wraps all routes)  
**Purpose**: Global layout with providers

**Contains**:
- HTML structure (`<html>`, `<body>`)
- Global providers (`SessionProvider`, `AppStateMachineProvider`)
- Global error boundary wrapper
- Global styles
- Metadata

**State Access**: All states (wraps all routes)

---

### 2. Landing Page

**File**: `app/page.tsx`  
**Route**: `/`  
**Purpose**: Entry point - start new learning session

**Frontend State**: `IDLE`

**Allowed Actions**:
- Start new session
- Continue existing session (future)

**Forbidden Actions**:
- All lesson-specific actions

**Navigation**:
- On "Start Learning" → Create session → Redirect to `/lessons/[sessionId]/screen_001`
- On "Continue Session" (future) → Redirect to `/lessons/[sessionId]/[screenId]`

**State Transitions**:
- `IDLE` → `IN_LESSON` (on session creation)
- `IDLE` → `ERROR` (on session creation failure)

---

### 3. Assessment Route (Optional, MVP: Skip)

**File**: `app/assess/[sessionId]/page.tsx`  
**Route**: `/assess/[sessionId]`  
**Purpose**: Level assessment to determine starting point

**Frontend State**: `ASSESSING_LEVEL`

**Allowed Actions**:
- Submit assessment answers
- Request assessment hints
- Complete assessment

**Forbidden Actions**:
- Navigate to lesson screens
- Skip assessment

**Navigation**:
- On assessment complete → Redirect to `/lessons/[sessionId]/screen_001`
- On cancel (if allowed) → Redirect to `/`

**State Transitions**:
- `ASSESSING_LEVEL` → `IN_LESSON` (on completion)
- `ASSESSING_LEVEL` → `ERROR` (on failure)
- `ASSESSING_LEVEL` → `IDLE` (on cancel)

**Layout**: `app/assess/[sessionId]/layout.tsx`  
- Assessment-specific layout (progress, instructions)
- No lesson navigation

---

### 4. Session Overview Route (Optional, MVP: Redirect)

**File**: `app/lessons/[sessionId]/page.tsx`  
**Route**: `/lessons/[sessionId]`  
**Purpose**: Session overview (MVP: redirects to first screen)

**Frontend State**: `IN_LESSON` (after redirect)

**MVP Behavior**:
- Immediately redirects to `/lessons/[sessionId]/screen_001`
- No UI rendered

**Future Behavior**:
- Shows session progress overview
- Lists available screens
- Allows resume from last screen

**Layout**: `app/lessons/[sessionId]/layout.tsx`  
- Session-level layout (progress bar, navigation sidebar)
- Wraps all lesson screens

---

### 5. Lesson Screen Route (Core)

**File**: `app/lessons/[sessionId]/[screenId]/page.tsx`  
**Route**: `/lessons/[sessionId]/[screenId]`  
**Purpose**: Main learning interface - the "classroom"

**Frontend States**: 
- `IN_LESSON` - User actively learning
- `AWAITING_FEEDBACK` - Waiting for instructor response
- `REVIEWING` - Reviewing feedback

**State-Specific Behavior**:

**IN_LESSON**:
- Shows problem statement
- Shows answer input (enabled)
- Shows submit button (enabled if constraints met)
- Shows progress indicator
- Shows constraint warnings

**AWAITING_FEEDBACK**:
- Shows problem statement (dimmed)
- Shows submitted answer (readonly)
- Shows loading indicator
- Shows "Waiting for instructor..." message
- Shows cancel button (if streaming)

**REVIEWING**:
- Shows problem statement
- Shows instructor feedback
- Shows submitted answer (readonly or editable if revising)
- Shows "Revise Answer" button
- Shows "Next" button (enabled if can proceed)
- Shows updated progress

**Navigation**:
- On "Next" (if unlocked) → Navigate to `/lessons/[sessionId]/[nextScreenId]`
- On "Revise Answer" → Stay on same route, transition to `IN_LESSON`
- On "Back" → Navigate to `/lessons/[sessionId]/[previousScreenId]`
- On session complete → Redirect to `/lessons/[sessionId]/complete`

**State Transitions**:
- `IN_LESSON` → `AWAITING_FEEDBACK` (on submit)
- `AWAITING_FEEDBACK` → `REVIEWING` (on feedback received)
- `REVIEWING` → `IN_LESSON` (on revise)
- `REVIEWING` → `IN_LESSON` (on proceed to next screen)
- `REVIEWING` → `COMPLETED` (on final screen completion)
- Any state → `ERROR` (on error)

---

### 6. Session Complete Route

**File**: `app/lessons/[sessionId]/complete/page.tsx`  
**Route**: `/lessons/[sessionId]/complete`  
**Purpose**: Session completion screen

**Frontend State**: `COMPLETED`

**Allowed Actions**:
- Start new session
- View session summary
- View progress

**Forbidden Actions**:
- All lesson-specific actions
- Navigation to lesson screens

**Navigation**:
- On "Start New Session" → Redirect to `/`
- On "View Summary" → Stay on same route (show summary)

**State Transitions**:
- `COMPLETED` → `IDLE` (on start new session)
- `COMPLETED` → `IN_LESSON` (on start new session, new session created)

---

## Error Handling Routes

### Global Error Boundary

**File**: `app/error.tsx`  
**Route**: N/A (catches all errors)  
**Purpose**: Global error fallback

**Frontend State**: `ERROR`

**Behavior**:
- Catches unhandled errors
- Shows error message
- Provides retry/reset options
- Logs error for monitoring

---

### Route-Specific Error Boundaries

**Files**:
- `app/assess/[sessionId]/error.tsx` - Assessment errors
- `app/lessons/[sessionId]/error.tsx` - Session errors
- `app/lessons/[sessionId]/[screenId]/error.tsx` - Screen errors
- `app/lessons/[sessionId]/complete/error.tsx` - Completion errors

**Purpose**: Route-specific error handling with context

**Frontend State**: `ERROR`

**Behavior**:
- Catches errors in route subtree
- Shows route-specific error message
- Provides retry/reset options
- Preserves route context

---

## Loading States

### Global Loading

**File**: `app/loading.tsx`  
**Route**: N/A (shows during route transitions)  
**Purpose**: Global loading UI

**Behavior**:
- Shows during route navigation
- Shows loading spinner/skeleton
- No state machine state (transient)

---

### Route-Specific Loading

**Files**:
- `app/assess/[sessionId]/loading.tsx` - Assessment loading
- `app/lessons/[sessionId]/loading.tsx` - Session loading
- `app/lessons/[sessionId]/[screenId]/loading.tsx` - Screen loading
- `app/lessons/[sessionId]/complete/loading.tsx` - Completion loading

**Purpose**: Route-specific loading UI

**Behavior**:
- Shows during route data loading
- Shows route-specific skeleton
- No state machine state (transient)

---

## Not Found Route

**File**: `app/not-found.tsx`  
**Route**: N/A (404 fallback)  
**Purpose**: Handle 404 errors

**Frontend State**: `ERROR` (treated as error state)

**Behavior**:
- Shows 404 message
- Provides navigation options
- Logs 404 for monitoring

---

## Route Groups (Future)

For future expansion, use route groups:

```
app/
├── (auth)/                              # Authentication routes (future)
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
│
├── (dashboard)/                         # Dashboard routes (future)
│   └── dashboard/
│       └── page.tsx
│
└── (learning)/                          # Learning routes (current)
    ├── assess/
    │   └── [sessionId]/
    │       └── page.tsx
    └── lessons/
        └── [sessionId]/
            ├── [screenId]/
            │   └── page.tsx
            └── complete/
                └── page.tsx
```

**MVP**: No route groups needed (single learning flow)

---

## Dynamic Route Parameters

### `[sessionId]`

**Type**: `string`  
**Format**: `sess_<timestamp>_<random>`  
**Source**: Created on landing page  
**Purpose**: Identifies learning session  
**Validation**: Must exist in backend storage

**Usage**:
- Load session state
- Validate session ownership
- Track session progress

---

### `[screenId]`

**Type**: `string`  
**Format**: `screen_<number>` (e.g., `screen_001`, `screen_002`)  
**Source**: Determined by lesson flow  
**Purpose**: Identifies current lesson screen  
**Validation**: Must be unlocked for session

**Usage**:
- Load screen content
- Validate screen unlock status
- Track screen progress

---

## Navigation Flow

### MVP Flow

```
/ (IDLE)
  ↓ (click "Start Learning")
Create Session
  ↓
/lessons/[sessionId]/screen_001 (IN_LESSON)
  ↓ (submit answer)
/lessons/[sessionId]/screen_001 (AWAITING_FEEDBACK)
  ↓ (feedback received)
/lessons/[sessionId]/screen_001 (REVIEWING)
  ↓ (click "Next")
/lessons/[sessionId]/screen_002 (IN_LESSON)
  ↓ (repeat)
/lessons/[sessionId]/screen_003 (IN_LESSON)
  ↓ (complete final screen)
/lessons/[sessionId]/complete (COMPLETED)
  ↓ (click "Start New Session")
/ (IDLE)
```

### With Assessment (Future)

```
/ (IDLE)
  ↓ (click "Start Learning")
Create Session
  ↓
/assess/[sessionId] (ASSESSING_LEVEL)
  ↓ (complete assessment)
/lessons/[sessionId]/screen_001 (IN_LESSON)
  ↓ (continue as MVP flow)
```

---

## Route Protection

### MVP: No Authentication

**Current**: All routes are public (anonymous sessions)

**Behavior**:
- No authentication required
- Sessions are anonymous
- No user accounts

---

### Future: Authentication

**Protected Routes**:
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/history` - Learning history

**Public Routes**:
- `/` - Landing page
- `/lessons/[sessionId]/[screenId]` - Lesson screens (session-based)

**Implementation**:
- Middleware for route protection
- Session ownership validation
- User context providers

---

## Deep Linking Support

### URL Structure

**Pattern**: `/lessons/[sessionId]/[screenId]`

**Benefits**:
- Refresh preserves screen
- Shareable URLs (future: with permissions)
- Browser back/forward works
- Direct navigation to specific screen

**Implementation**:
- URL params drive screen loading
- State syncs with URL
- Navigation updates URL
- Backend validates screen unlock

---

## State Synchronization

### URL → State

**On Route Load**:
1. Extract `sessionId` and `screenId` from URL
2. Load session state from backend
3. Load screen state from backend
4. Initialize frontend state machine
5. Transition to appropriate state (`IN_LESSON`, `REVIEWING`, etc.)

### State → URL

**On State Transition**:
1. State machine transitions
2. If navigation required, update URL
3. If same screen, keep URL (state change only)

**Examples**:
- `IN_LESSON` → `AWAITING_FEEDBACK`: Same URL, state change only
- `REVIEWING` → `IN_LESSON` (proceed): Update URL to next screen
- `REVIEWING` → `IN_LESSON` (revise): Same URL, state change only

---

## File Structure Summary

```
app/
├── layout.tsx                          # Root layout
├── page.tsx                            # Landing (IDLE)
├── loading.tsx                         # Global loading
├── error.tsx                           # Global error
├── not-found.tsx                       # 404
│
├── assess/                              # Assessment (optional)
│   └── [sessionId]/
│       ├── layout.tsx
│       ├── page.tsx                    # Assessment (ASSESSING_LEVEL)
│       ├── loading.tsx
│       └── error.tsx
│
└── lessons/                             # Learning flow
    └── [sessionId]/
        ├── layout.tsx                   # Session layout
        ├── page.tsx                     # Session overview (redirect)
        ├── loading.tsx
        ├── error.tsx
        │
        ├── [screenId]/                 # Lesson screen (core)
        │   ├── page.tsx                # Screen (IN_LESSON/AWAITING_FEEDBACK/REVIEWING)
        │   ├── loading.tsx
        │   └── error.tsx
        │
        └── complete/                    # Completion
            ├── page.tsx                 # Complete (COMPLETED)
            ├── loading.tsx
            └── error.tsx
```

---

## Summary

**Routes**:
1. `/` - Landing page (IDLE)
2. `/assess/[sessionId]` - Assessment (ASSESSING_LEVEL, optional)
3. `/lessons/[sessionId]` - Session overview (redirect)
4. `/lessons/[sessionId]/[screenId]` - Lesson screen (IN_LESSON/AWAITING_FEEDBACK/REVIEWING)
5. `/lessons/[sessionId]/complete` - Completion (COMPLETED)

**State Mapping**: Each route maps to specific frontend states

**Navigation**: URL-driven, state-synchronized, backend-validated

**Error Handling**: Route-specific error boundaries with global fallback

**Loading**: Route-specific loading states with global fallback
