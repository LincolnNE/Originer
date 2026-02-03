# Frontend Structure Definition

## Overview

**Framework**: Next.js 14+ (App Router)  
**Pattern**: Screen-based (classroom), not message-based (chat)  
**State**: Zustand + React Context  
**Focus**: MVP scope (single screen type), structured for growth

---

## Directory Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (providers)
│   ├── page.tsx                 # Landing page (/)
│   └── lessons/
│       └── [sessionId]/
│           └── [screenId]/
│               └── page.tsx     # Lesson screen (/lessons/[sessionId]/[screenId])
│
├── components/                   # React components
│   ├── screens/
│   │   └── GuidedPractice.tsx  # MVP: Single screen component
│   ├── ui/                      # Base UI components (future)
│   ├── feedback/                # Feedback display (future)
│   └── progress/                # Progress indicators (future)
│
├── state/                        # State management
│   ├── stores/                  # Zustand stores
│   │   ├── sessionStore.ts
│   │   ├── lessonStateStore.ts
│   │   ├── progressStore.ts
│   │   └── constraintStore.ts
│   ├── hooks/                   # Custom hooks
│   │   ├── useSession.ts
│   │   ├── useLessonState.ts
│   │   ├── useProgress.ts
│   │   └── useConstraints.ts
│   └── providers/               # Context providers
│       └── SessionProvider.tsx
│
├── services/                     # API communication
│   ├── api/                    # REST API clients
│   │   ├── client.ts           # Base API client
│   │   ├── sessions.ts        # Session endpoints
│   │   └── lessons.ts         # Lesson endpoints
│   └── sse/                    # SSE client (future)
│       └── sseClient.ts
│
├── types/                       # TypeScript types
│   ├── screen.ts               # Screen types
│   ├── state.ts                # State types
│   └── api.ts                  # API types (from shared/)
│
├── utils/                       # Utilities
│   ├── validation.ts
│   └── navigation.ts
│
├── ROUTES.md                    # Route definitions
├── SCREENS.md                   # Screen definitions
├── STATE_OWNERSHIP.md           # State ownership
└── STRUCTURE.md                 # This file
```

---

## App Routes

### Route Structure

```
/                                    → Landing page
/lessons/[sessionId]/[screenId]    → Lesson screen
```

### Route Files

**`app/layout.tsx`**
- Root layout
- Providers (SessionProvider, etc.)
- Global error boundary
- Global styles

**`app/page.tsx`**
- Landing page
- "Start Learning" button
- Creates session, redirects to first screen

**`app/lessons/[sessionId]/[screenId]/page.tsx`**
- Lesson screen page
- Loads screen data
- Renders screen component
- Handles navigation

---

## Components

### Screen Components

**`components/screens/GuidedPractice.tsx`** (MVP)
- Single screen component for MVP
- Handles all learning interactions
- Can be extended for other screen types

**Future Components**:
- `ConceptIntroduction.tsx`
- `IndependentPractice.tsx`
- `Assessment.tsx`
- `MasteryCheck.tsx`

### UI Components (Future)

**`components/ui/`**
- Base UI primitives
- Button, Input, ProgressBar, etc.
- Reusable across screens

### Feedback Components (Future)

**`components/feedback/`**
- InstructorFeedback.tsx
- StreamingResponse.tsx
- FeedbackArea.tsx

### Progress Components (Future)

**`components/progress/`**
- ProgressVisualization.tsx
- MasteryIndicator.tsx
- UnlockRequirements.tsx

---

## State Management

### Zustand Stores

**`state/stores/sessionStore.ts`**
- Current session ID
- Session metadata
- Session loading state

**`state/stores/lessonStateStore.ts`**
- Current screen ID
- UI state (idle, ready, submitting, streaming)
- Navigation state

**`state/stores/progressStore.ts`**
- Screen progress
- Session progress
- Mastery state
- Unlock state

**`state/stores/constraintStore.ts`**
- Active constraints
- Constraint warnings
- Action blocking

### Custom Hooks

**`state/hooks/useSession.ts`**
- Access session store
- Load session from API
- Handle session errors

**`state/hooks/useLessonState.ts`**
- Access lesson state store
- Handle state transitions
- Validate actions

**`state/hooks/useProgress.ts`**
- Access progress store
- Check unlock status
- Calculate progress

**`state/hooks/useConstraints.ts`**
- Access constraint store
- Check if action allowed
- Get blocking reasons

### Context Providers

**`state/providers/SessionProvider.tsx`**
- Provides session context
- Handles session initialization
- Manages session lifecycle

---

## Services

### API Clients

**`services/api/client.ts`**
- Base HTTP client
- Error handling
- Request/response interceptors
- TypeScript types

**`services/api/sessions.ts`**
- `createSession()`
- `getSession(sessionId)`
- `endSession(sessionId)`

**`services/api/lessons.ts`**
- `startLesson(sessionId, screenId)`
- `submitAnswer(sessionId, screenId, answer)`
- `requestHint(sessionId, screenId)`
- `completeLesson(sessionId, screenId)`

### SSE Client (Future)

**`services/sse/sseClient.ts`**
- SSE connection management
- Event parsing
- Reconnection logic
- Stream handling

---

## Types

### Screen Types

**`types/screen.ts`**
- `LessonScreen`
- `ScreenType`
- `ScreenState`
- `ScreenContent`
- `ScreenProgress`
- `ScreenConstraints`
- `ScreenNavigation`

### State Types

**`types/state.ts`**
- `LessonState`
- `ProgressState`
- `UIConstraint`
- `InteractionMode`

### API Types

**`types/api.ts`**
- Import from `shared/types/api`
- API request/response types
- Error types

---

## Key Design Decisions

### 1. Screen-Based Routes
**Why**: Matches classroom architecture, not chat  
**Pattern**: `/lessons/[sessionId]/[screenId]`  
**Benefit**: URL reflects current screen, enables refresh/reload

### 2. Single Screen Type (MVP)
**Why**: MVP scope, reduce complexity  
**Type**: `guided_practice`  
**Future**: Add other screen types incrementally

### 3. Zustand for State
**Why**: Lightweight, simple API, good TypeScript  
**Alternative**: Redux (too heavy), Jotai (good but Zustand simpler)

### 4. Optimistic Updates
**Why**: Immediate UI feedback, better UX  
**Pattern**: Update store → API call → Reconcile → Rollback on error

### 5. State Ownership Split
**Why**: Frontend controls UI, backend controls learning  
**Split**: Frontend (UI state), Backend (authoritative learning state)

---

## MVP Scope

### Included
- Landing page
- Single lesson screen (guided practice)
- Basic state management
- API client structure
- Route structure

### Excluded (Future)
- Dashboard
- Registration
- Assessment flow
- Multiple screen types
- Advanced progress visualization
- SSE streaming (structure ready, implementation later)

---

## File Naming Conventions

- **Components**: PascalCase (`GuidedPractice.tsx`)
- **Hooks**: camelCase with `use` prefix (`useSession.ts`)
- **Stores**: camelCase with `Store` suffix (`sessionStore.ts`)
- **Services**: camelCase (`sseClient.ts`)
- **Types**: camelCase (`screen.ts`)
- **Utils**: camelCase (`validation.ts`)

---

## Next Steps

1. Create Next.js app structure
2. Implement route files (no JSX yet)
3. Create state store interfaces
4. Create API client interfaces
5. Define component interfaces
6. Then implement JSX components

---

## Summary

**Routes**: `/` → `/lessons/[sessionId]/[screenId]`  
**Screens**: Single type (`guided_practice`) for MVP  
**State**: Zustand stores + React Context + custom hooks  
**Ownership**: Frontend (UI), Backend (authoritative learning)  
**Structure**: Screen-based (classroom), not message-based (chat)
