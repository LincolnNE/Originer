# Frontend Structure - Next.js Application

## Overview

ORIGINER frontend is a Next.js application using the **App Router** (Next.js 13+). The structure prioritizes:
- **Screen-based organization**: Matches lesson screen architecture
- **State management**: Optimistic UI with backend sync
- **Constraint enforcement**: Client-side validation before API calls
- **SSE streaming**: Real-time instructor responses

---

## Directory Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Landing page
│   │   ├── (auth)/
│   │   │   └── register/
│   │   │       └── page.tsx     # Learner registration
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx     # Dashboard
│   │   │   └── layout.tsx       # Dashboard layout
│   │   ├── (learning)/
│   │   │   ├── assessment/
│   │   │   │   ├── intro/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── question/
│   │   │   │       └── page.tsx
│   │   │   ├── lessons/
│   │   │   │   ├── select/
│   │   │   │   │   └── page.tsx  # Lesson selection
│   │   │   │   └── [sessionId]/
│   │   │   │       ├── page.tsx  # Session start
│   │   │   │       └── [screenId]/
│   │   │   │           └── page.tsx  # Lesson screen
│   │   │   └── layout.tsx        # Learning layout
│   │   └── api/                  # API routes (if needed)
│   │       └── sse/
│   │           └── route.ts     # SSE proxy (optional)
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Timer.tsx
│   │   │   └── ...
│   │   ├── layout/               # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── screens/              # Lesson screen components
│   │   │   ├── ConceptIntroduction.tsx
│   │   │   ├── GuidedPractice.tsx
│   │   │   ├── IndependentPractice.tsx
│   │   │   ├── Assessment.tsx
│   │   │   ├── MasteryCheck.tsx
│   │   │   └── MisconceptionCorrection.tsx
│   │   ├── progress/             # Progress components
│   │   │   ├── ProgressVisualization.tsx
│   │   │   ├── ConceptMap.tsx
│   │   │   ├── MasteryIndicator.tsx
│   │   │   └── UnlockRequirements.tsx
│   │   ├── constraints/          # Constraint components
│   │   │   ├── ConstraintWarning.tsx
│   │   │   ├── CooldownTimer.tsx
│   │   │   ├── RateLimitIndicator.tsx
│   │   │   └── AttemptCounter.tsx
│   │   ├── feedback/             # Feedback components
│   │   │   ├── InstructorFeedback.tsx
│   │   │   ├── StreamingResponse.tsx
│   │   │   ├── FeedbackArea.tsx
│   │   │   └── MessageBubble.tsx
│   │   └── forms/                # Form components
│   │       ├── AnswerInput.tsx
│   │       ├── QuestionForm.tsx
│   │       └── AssessmentForm.tsx
│   │
│   ├── state/                     # State management
│   │   ├── stores/               # Zustand stores
│   │   │   ├── sessionStore.ts
│   │   │   ├── lessonStateStore.ts
│   │   │   ├── progressStore.ts
│   │   │   ├── constraintStore.ts
│   │   │   └── interactionModeStore.ts
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useSession.ts
│   │   │   ├── useLessonState.ts
│   │   │   ├── useProgress.ts
│   │   │   ├── useConstraints.ts
│   │   │   ├── useSSE.ts
│   │   │   └── useSync.ts
│   │   └── providers/           # Context providers
│   │       ├── SessionProvider.tsx
│   │       └── StateSyncProvider.tsx
│   │
│   ├── services/                 # API communication
│   │   ├── api/                 # API clients
│   │   │   ├── client.ts        # Base API client
│   │   │   ├── sessions.ts      # Session endpoints
│   │   │   ├── screens.ts       # Screen endpoints
│   │   │   ├── interactions.ts  # Interaction endpoints
│   │   │   └── progress.ts     # Progress endpoints
│   │   ├── sse/                 # SSE handling
│   │   │   ├── sseClient.ts     # SSE client
│   │   │   ├── eventHandlers.ts # Event handlers
│   │   │   └── streamManager.ts # Stream connection manager
│   │   └── sync/                # State synchronization
│   │       ├── syncManager.ts   # Sync orchestration
│   │       ├── conflictResolver.ts
│   │       └── optimisticUpdater.ts
│   │
│   ├── constraints/              # Constraint logic
│   │   ├── validators.ts        # Input validators
│   │   ├── checkers.ts          # Constraint checkers
│   │   ├── enforcers.ts         # Constraint enforcers
│   │   └── timers.ts            # Time-based constraints
│   │
│   ├── utils/                    # Utilities
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── navigation.ts
│   │   └── errors.ts
│   │
│   └── types/                    # Frontend-specific types
│       ├── lesson.ts
│       ├── progress.ts
│       ├── constraints.ts
│       └── interaction.ts
│
├── public/                       # Static assets
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## Pages / Routes

### Route Structure

```
/                                    → Landing page
/register                            → Learner registration
/dashboard                           → Learner dashboard
/assessment/intro                     → Assessment introduction
/assessment/question                 → Assessment questions
/lessons/select                      → Lesson selection
/lessons/[sessionId]                 → Session start/overview
/lessons/[sessionId]/[screenId]      → Lesson screen
```

### Route Groups

Using Next.js route groups `(auth)`, `(dashboard)`, `(learning)` for:
- **Shared layouts**: Each group has its own layout
- **Route organization**: Logical grouping without affecting URLs
- **Layout nesting**: Dashboard and learning share common navigation

### Page Decisions

**App Router over Pages Router**:
- Modern Next.js approach
- Better TypeScript support
- Server components by default
- Better data fetching patterns

**Dynamic Routes**:
- `[sessionId]` and `[screenId]` for lesson screens
- Enables direct navigation to specific screens
- Supports deep linking

**Route Groups**:
- `(auth)` for registration (no shared layout)
- `(dashboard)` for dashboard (has navigation)
- `(learning)` for assessment and lessons (has learning-specific layout)

---

## Core Components

### Component Hierarchy

```
App Layout
├── Root Layout (providers, global styles)
│   ├── Auth Layout (minimal, no nav)
│   │   └── Register Page
│   ├── Dashboard Layout (nav, sidebar)
│   │   └── Dashboard Page
│   └── Learning Layout (progress bar, nav)
│       ├── Assessment Pages
│       └── Lesson Pages
│           └── Screen Components
```

### Component Categories

#### 1. UI Components (`components/ui/`)
**Purpose**: Base, reusable UI primitives

**Examples**:
- `Button`: With disabled states, loading states
- `Input`: With validation, error states
- `ProgressBar`: Visual progress indicator
- `Timer`: Time display with formatting

**Decision**: Use shadcn/ui pattern - composable, accessible, customizable

#### 2. Screen Components (`components/screens/`)
**Purpose**: Lesson screen implementations

**Examples**:
- `ConceptIntroduction`: Renders concept intro screen
- `GuidedPractice`: Practice screen with guidance
- `Assessment`: Assessment screen (no help allowed)

**Decision**: One component per screen type, uses state stores and hooks

#### 3. Progress Components (`components/progress/`)
**Purpose**: Progress visualization

**Examples**:
- `ProgressVisualization`: Overall progress display
- `ConceptMap`: Visual concept relationships
- `MasteryIndicator`: Shows mastery level
- `UnlockRequirements`: Shows what's needed to unlock

**Decision**: Separate from screen components for reusability

#### 4. Constraint Components (`components/constraints/`)
**Purpose**: Display constraint warnings and limits

**Examples**:
- `ConstraintWarning`: Shows constraint violations
- `CooldownTimer`: Countdown timer for cooldowns
- `RateLimitIndicator`: Shows rate limit status
- `AttemptCounter`: Shows attempts remaining

**Decision**: Reusable across all screens, driven by constraint store

#### 5. Feedback Components (`components/feedback/`)
**Purpose**: Display instructor feedback

**Examples**:
- `InstructorFeedback`: Renders instructor messages
- `StreamingResponse`: Handles SSE streaming display
- `FeedbackArea`: Container for feedback
- `MessageBubble`: Individual message bubble

**Decision**: Separate streaming logic from display for testability

---

## State Management Approach

### Decision: **Zustand** + **React Context**

**Rationale**:
- **Zustand**: Lightweight, simple API, good TypeScript support, no providers needed
- **React Context**: For provider-level state (session context, sync status)
- **Custom Hooks**: Wrap stores for component usage

### State Architecture

```
┌─────────────────────────────────────────────────────────┐
│              State Management Layers                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  React Components                                        │
│    │                                                     │
│    ├─► Custom Hooks (useSession, useLessonState)        │
│    │         │                                           │
│    │         ├─► Zustand Stores                         │
│    │         │   • sessionStore                         │
│    │         │   • lessonStateStore                     │
│    │         │   • progressStore                         │
│    │         │   • constraintStore                        │
│    │         │   • interactionModeStore                  │
│    │         │                                           │
│    │         └─► React Context                          │
│    │             • SessionProvider                        │
│    │             • StateSyncProvider                      │
│    │                                                      │
│    └─► Direct Store Access (when needed)                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Store Structure

#### 1. Session Store (`sessionStore.ts`)
**Purpose**: Current session state

```typescript
interface SessionStore {
  currentSessionId: string | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSession: (session: Session) => void;
  clearSession: () => void;
  updateSession: (updates: Partial<Session>) => void;
}
```

**Decision**: Central session state, used by all screens

#### 2. Lesson State Store (`lessonStateStore.ts`)
**Purpose**: Current lesson screen UI state

```typescript
interface LessonStateStore {
  currentScreenId: string | null;
  lessonState: LessonState | null;
  availableScreens: string[];
  lockedScreens: string[];
  
  // Actions
  setCurrentScreen: (screenId: string) => void;
  updateLessonState: (updates: Partial<LessonState>) => void;
  transitionState: (newState: LessonUIState) => void;
}
```

**Decision**: Maps to `LessonState` domain model, controls UI flow

#### 3. Progress Store (`progressStore.ts`)
**Purpose**: Progress tracking and visualization

```typescript
interface ProgressStore {
  screenProgress: ScreenProgressUI | null;
  sessionProgress: SessionProgressUI | null;
  masteryState: MasteryState | null;
  unlockState: UnlockState | null;
  
  // Actions
  updateScreenProgress: (progress: ScreenProgressUI) => void;
  updateSessionProgress: (progress: SessionProgressUI) => void;
  checkUnlockStatus: (screenId: string) => Promise<void>;
}
```

**Decision**: Separate from lesson state for reusability across components

#### 4. Constraint Store (`constraintStore.ts`)
**Purpose**: Active constraints and enforcement

```typescript
interface ConstraintStore {
  activeConstraints: ActiveConstraints;
  blockingConstraints: UIConstraint[];
  warningConstraints: UIConstraint[];
  
  // Actions
  updateConstraints: (constraints: UIConstraint[]) => void;
  checkAction: (action: string) => boolean;
  getBlockingReason: (action: string) => string | null;
}
```

**Decision**: Central constraint checking, prevents invalid actions

#### 5. Interaction Mode Store (`interactionModeStore.ts`)
**Purpose**: Current interaction mode

```typescript
interface InteractionModeStore {
  interactionMode: InteractionMode | null;
  
  // Actions
  setMode: (mode: ModeType, subMode?: SubModeType) => void;
  updateAllowedActions: (actions: Partial<AllowedActions>) => void;
}
```

**Decision**: Controls what user can do based on current mode

### Custom Hooks

**Purpose**: Wrap stores for component usage, add React-specific logic

**Examples**:
- `useSession()`: Access session store + loading/error handling
- `useLessonState()`: Access lesson state + state transitions
- `useProgress()`: Access progress + unlock checking
- `useConstraints()`: Access constraints + action checking
- `useSSE()`: SSE connection management
- `useSync()`: State synchronization with backend

**Decision**: Hooks provide React-friendly API, handle side effects

### State Synchronization

**Strategy**: Optimistic updates with backend sync

```
User Action
  │
  ├─► Update Zustand Store (optimistic)
  │   └─► UI Updates Immediately
  │
  └─► API Call
      │
      ├─► Success → Reconcile State
      │   └─► Update Store with Backend Response
      │
      └─► Error → Rollback
          └─► Revert Optimistic Update
```

**Implementation**:
- `syncManager.ts`: Orchestrates sync
- `optimisticUpdater.ts`: Handles optimistic updates
- `conflictResolver.ts`: Resolves conflicts between frontend/backend

---

## API Communication Layer

### Architecture

```
Components
  │
  ├─► Custom Hooks (useSession, useLessonState)
  │         │
  │         ├─► API Clients (REST)
  │         │   • sessions.ts
  │         │   • screens.ts
  │         │   • interactions.ts
  │         │
  │         └─► SSE Client
  │             • sseClient.ts
  │             • streamManager.ts
  │
  └─► Direct API Access (when needed)
```

### REST API Client

#### Base Client (`services/api/client.ts`)
**Purpose**: HTTP client with error handling, auth, interceptors

**Features**:
- Base URL configuration
- Authentication headers
- Request/response interceptors
- Error handling
- Retry logic
- TypeScript types from `shared/types/api`

**Decision**: Axios or fetch wrapper - provides consistent API

#### Endpoint Clients

**`sessions.ts`**:
- `startSession()`
- `getSession()`
- `endSession()`
- `listSessions()`

**`screens.ts`**:
- `listScreens()`
- `startScreen()`
- `getScreenProgress()`
- `checkUnlockStatus()`

**`interactions.ts`**:
- `submitInteraction()` - Returns SSE stream URL
- `getInteractionHistory()`

**`progress.ts`**:
- `getProgress()`
- `updateProgress()`

**Decision**: One file per resource, matches backend API structure

### SSE Client

#### SSE Client (`services/sse/sseClient.ts`)
**Purpose**: Handle Server-Sent Events for streaming responses

**Features**:
- Connection management
- Event parsing
- Reconnection logic
- Error handling
- Event type handling (content_chunk, message_complete, etc.)

**Decision**: Native EventSource API with wrapper for better error handling

#### Stream Manager (`services/sse/streamManager.ts`)
**Purpose**: Manage multiple SSE connections

**Features**:
- Connection lifecycle
- Connection pooling (if needed)
- Cleanup on unmount
- Connection state tracking

**Decision**: Singleton pattern - one manager per app instance

#### Event Handlers (`services/sse/eventHandlers.ts`)
**Purpose**: Handle SSE events and update stores

**Features**:
- Parse event data
- Update Zustand stores
- Trigger UI updates
- Handle errors

**Decision**: Pure functions - testable, composable

### API Integration Pattern

```typescript
// Example: Submitting interaction
async function submitInteraction(
  sessionId: string,
  screenId: string,
  content: string
) {
  // 1. Optimistic update
  lessonStateStore.transitionState('submitting');
  
  // 2. API call (returns SSE URL)
  const response = await interactionsClient.submitInteraction({
    sessionId,
    screenId,
    content,
    stream: true
  });
  
  // 3. Start SSE stream
  const streamUrl = response.sseUrl;
  sseClient.connect(streamUrl, {
    onContentChunk: (chunk) => {
      // Update UI with chunk
      feedbackStore.appendChunk(chunk);
    },
    onComplete: (message) => {
      // Update stores with complete message
      lessonStateStore.transitionState('ready');
      progressStore.updateScreenProgress(message.progress);
    },
    onError: (error) => {
      // Handle error, rollback
      lessonStateStore.transitionState('error');
    }
  });
}
```

---

## Key Decisions Summary

### 1. Next.js App Router
**Why**: Modern, better TypeScript, server components, better data fetching
**Alternative**: Pages Router (older, less type-safe)

### 2. Zustand + React Context
**Why**: Lightweight, simple, good TypeScript, no provider hell
**Alternative**: Redux (too heavy), Jotai (good but Zustand simpler)

### 3. Optimistic Updates
**Why**: Immediate UI feedback, better UX
**Implementation**: Update stores immediately, sync with backend, rollback on error

### 4. SSE for Streaming
**Why**: One-way streaming, simpler than WebSocket, HTTP-based
**Implementation**: Native EventSource with wrapper for better error handling

### 5. Component Organization
**Why**: Screen-based matches architecture, reusable components, clear separation
**Structure**: UI → Screens → Progress → Constraints → Feedback

### 6. API Client Structure
**Why**: Matches backend structure, type-safe, consistent error handling
**Pattern**: Base client + endpoint clients + SSE client

### 7. State Synchronization
**Why**: Frontend optimistic, backend authoritative, need sync
**Implementation**: Sync manager + conflict resolver + optimistic updater

---

## File Naming Conventions

- **Components**: PascalCase (`ConceptIntroduction.tsx`)
- **Hooks**: camelCase with `use` prefix (`useSession.ts`)
- **Stores**: camelCase with `Store` suffix (`sessionStore.ts`)
- **Services**: camelCase (`sseClient.ts`)
- **Utils**: camelCase (`validation.ts`)
- **Types**: camelCase (`lesson.ts`)

---

## TypeScript Strategy

1. **Shared Types**: Import from `shared/types/`
2. **Frontend Types**: Define in `src/types/` (UI-specific)
3. **API Types**: Import from `shared/types/api`
4. **Domain Types**: Import from `shared/types/domain`

**Decision**: Use shared types where possible, frontend-specific types only for UI concerns

---

## Testing Strategy

- **Components**: React Testing Library
- **Hooks**: React Testing Library + custom render
- **Stores**: Direct store testing (Zustand)
- **Services**: Mock API responses
- **Utils**: Unit tests

**Decision**: Test behavior, not implementation details

---

## Summary

**Pages**: App Router with route groups for logical organization
**Components**: Screen-based organization with reusable UI components
**State**: Zustand stores + React Context + custom hooks
**API**: REST client + SSE client with optimistic updates
**Sync**: Optimistic UI with backend reconciliation

Structure enables:
- ✅ Screen-based architecture
- ✅ Optimistic UI updates
- ✅ Constraint enforcement
- ✅ SSE streaming
- ✅ Type safety
- ✅ Testability
