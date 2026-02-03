# State Management Architecture Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER COMPONENTS                        │
│  (app/lessons/[sessionId]/[screenId]/page.tsx)            │
│                                                             │
│  • Fetch initial state from backend                        │
│  • Pass as props to Client Components                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ Props (initial state)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT COMPONENTS                        │
│  ('use client')                                             │
│                                                             │
│  • Receive initial state from Server                       │
│  • Initialize Zustand stores                               │
│  • Use hooks for updates                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    REACT HOOKS LAYER                        │
│  (state/hooks/*.ts)                                         │
│                                                             │
│  • useAppStateMachine()                                     │
│  • useSession()                                             │
│  • useLessonState()                                         │
│  • useProgress()                                            │
│  • useConstraints()                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              TRANSITION ORCHESTRATOR                        │
│  (state/orchestrators/stateMachineOrchestrator.ts)          │
│                                                             │
│  • performAction() - Validate and perform                   │
│  • transitionWithValidation() - Validate and transition    │
│  • handleError() - Handle errors                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ STATE MACHINE│ │ DOMAIN STORES│ │ CONSTRAINT   │
│    STORE     │ │              │ │   STORE      │
│              │ │              │ │              │
│ • Transition │ │ • Session    │ │ • Rate Limit │
│   Matrix     │ │ • Lesson     │ │ • Cooldown   │
│ • Action     │ │ • Progress   │ │ • Mastery    │
│   Matrix     │ │              │ │              │
│ • Validation │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## State Machine Enforcement Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACTION                              │
│  (Click button, submit answer, etc.)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              COMPONENT VALIDATION                           │
│                                                             │
│  • Check canPerformAction()                                 │
│  • Check constraints (useConstraints hook)                │
│  • Disable button if not allowed                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              HOOK VALIDATION                                │
│  (useAppStateMachine hook)                                  │
│                                                             │
│  • Validate action (ACTION_ALLOWED matrix)                 │
│  • Validate constraints                                     │
│  • Call transitionTo() if valid                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              STORE VALIDATION                                │
│  (appStateMachineStore)                                     │
│                                                             │
│  • Validate transition (VALID_TRANSITIONS matrix)           │
│  • Block invalid transitions (console.warn + no change)     │
│  • Update state if valid                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SIDE EFFECTS                                   │
│                                                             │
│  • API calls (submit answer, request hint)                  │
│  • Navigation (proceed to next screen)                      │
│  • Domain store updates (session, progress)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              UI UPDATE                                      │
│                                                             │
│  • Component re-renders with new state                      │
│  • UI reflects new state (buttons enabled/disabled)         │
│  • User sees updated interface                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR OCCURS                             │
│  (API fails, network error, validation error)              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ERROR DETECTION                                │
│  (Component catches error)                                  │
│                                                             │
│  • try/catch block                                          │
│  • Error boundary                                           │
│  • API error response                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ERROR HANDLING                                 │
│  (handleError() hook)                                       │
│                                                             │
│  • Determine error type                                     │
│  • Call transitionToError()                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              STATE TRANSITION                               │
│  (transitionToError() in store)                             │
│                                                             │
│  • Transition to ERROR state                                │
│  • Store previous state                                     │
│  • Store error details (type, message, retry count)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ERROR UI                                      │
│                                                             │
│  • Show error message                                       │
│  • Show retry button (if retryable)                         │
│  • Show reset button                                        │
│  • Disable normal actions                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│    RETRY     │ │    RESET     │ │    IGNORE    │
│              │ │              │ │              │
│ • retryFrom  │ │ • resetFrom  │ │ • Stay in    │
│   Error()    │ │   Error()    │ │   ERROR      │
│ • Back to    │ │ • Back to    │ │   state      │
│   previous   │ │   IDLE       │ │              │
│   state      │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## Server Component → Client Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│              SERVER COMPONENT                               │
│  (app/lessons/[sessionId]/[screenId]/page.tsx)             │
│                                                             │
│  async function LessonScreenPage({ params }) {              │
│    const session = await fetchSession(params.sessionId);    │
│    const screen = await fetchScreen(params.screenId);       │
│                                                             │
│    return (                                                 │
│      <LessonScreenClient                                    │
│        initialSession={session}                            │
│        initialScreen={screen}                               │
│      />                                                     │
│    );                                                       │
│  }                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ Props
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CLIENT COMPONENT                               │
│  ('use client')                                             │
│                                                             │
│  function LessonScreenClient({ initialSession,             │
│                                initialScreen }) {           │
│    const { setSession } = useSession();                     │
│    const { transitionTo } = useAppStateMachine();           │
│                                                             │
│    useEffect(() => {                                        │
│      setSession(initialSession);                            │
│      transitionTo('IN_LESSON', {                            │
│        screenId: initialScreen.id                           │
│      });                                                    │
│    }, []);                                                  │
│                                                             │
│    // Use hooks for updates                                 │
│    const { currentState } = useAppStateMachine();           │
│    // ...                                                   │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Layer Validation

```
┌─────────────────────────────────────────────────────────────┐
│              LAYER 1: TYPESCRIPT                            │
│                                                             │
│  • Discriminated unions                                     │
│  • Type guards                                              │
│  • Compile-time type safety                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              LAYER 2: TRANSITION MATRIX                     │
│                                                             │
│  • VALID_TRANSITIONS matrix                                 │
│  • transitionTo() validates                                 │
│  • Invalid transitions blocked                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              LAYER 3: ACTION MATRIX                         │
│                                                             │
│  • ACTION_ALLOWED matrix                                    │
│  • canPerformAction() validates                             │
│  • Invalid actions blocked                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              LAYER 4: CONSTRAINT VALIDATION                 │
│                                                             │
│  • Rate limits                                              │
│  • Cooldowns                                                │
│  • Mastery thresholds                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              LAYER 5: UI BLOCKING                           │
│                                                             │
│  • Components check canPerformAction()                      │
│  • Buttons disabled if not allowed                          │
│  • User-friendly error messages                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Store Relationships

```
                    ┌──────────────────┐
                    │  STATE MACHINE   │
                    │      STORE       │
                    │                  │
                    │ • Current State  │
                    │ • Transitions    │
                    │ • Actions       │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   SESSION    │    │    LESSON    │    │  PROGRESS    │
│    STORE     │    │    STORE     │    │    STORE     │
│              │    │              │    │              │
│ • Session ID │    │ • Screen ID  │    │ • Attempts   │
│ • Metadata   │    │ • UI State   │    │ • Mastery    │
│              │    │              │    │ • Time       │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
                    ┌──────────────┐
                    │ CONSTRAINT   │
                    │    STORE     │
                    │              │
                    │ • Rate Limit │
                    │ • Cooldown   │
                    │ • Mastery    │
                    └──────────────┘
```

---

## Summary

**Architecture**: Zustand + React Context + State Machine Layer

**Enforcement**: Multi-layer validation (TypeScript → Store → Hook → Component)

**Server Components**: Initial state from Server, updates in Client

**Error Handling**: Errors → ERROR state → Retry/Reset

**Transitions**: All go through state machine with validation

See `STATE_MANAGEMENT_ARCHITECTURE.md` for complete documentation.
