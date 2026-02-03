# ORIGINER System Architecture

## Overview

ORIGINER is a **web-based AI Instructor platform** designed specifically for education. The architecture prioritizes learning integrity, constraint enforcement, and pedagogical effectiveness over generic SaaS patterns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WEB BROWSER                                    │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    FRONTEND (Active Learning Interface)              │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │   Lesson     │  │   Progress   │  │  Constraint   │             │  │
│  │  │   Screens    │  │ Visualization │  │  Enforcement │             │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │  │
│  │         │                 │                  │                       │  │
│  │         └─────────────────┼──────────────────┘                       │  │
│  │                           │                                            │  │
│  │                  ┌───────▼────────┐                                    │  │
│  │                  │  State Manager │                                    │  │
│  │                  │  (UI State)     │                                    │  │
│  │                  └───────┬────────┘                                    │  │
│  │                           │                                            │  │
│  │                  ┌────────▼─────────┐                                  │  │
│  │                  │  API Client      │                                  │  │
│  │                  │  + SSE Handler   │                                  │  │
│  │                  └────────┬─────────┘                                  │  │
│  │                           │                                            │  │
│  └───────────────────────────┼──────────────────────────────────────────┘  │
│                               │                                            │
│                               │ HTTPS                                      │
│                               │ REST + SSE                                 │
│                               │                                            │
└───────────────────────────────┼────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API SERVER                                  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         API Layer                                    │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │   Session     │  │   Screen     │  │   Message    │             │  │
│  │  │   Endpoints   │  │  Endpoints   │  │  Endpoints   │             │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │  │
│  │         │                 │                  │                       │  │
│  │         └─────────────────┼──────────────────┘                       │  │
│  │                           │                                            │  │
│  │                  ┌────────▼─────────┐                                  │  │
│  │                  │  Request         │                                  │  │
│  │                  │  Validator       │                                  │  │
│  │                  │  (Constraints)   │                                  │  │
│  │                  └────────┬─────────┘                                  │  │
│  └───────────────────────────┼──────────────────────────────────────────┘  │
│                               │                                            │
│                               ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Service Layer                                     │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │         Session Orchestrator (Core Learning Engine)           │   │  │
│  │  ├──────────────────────────────────────────────────────────────┤   │  │
│  │  │                                                               │   │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │  │
│  │  │  │   Context     │  │    Prompt    │  │   Response   │     │   │  │
│  │  │  │   Loader      │─▶│  Assembler   │─▶│  Validator   │     │   │  │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘     │   │  │
│  │  │         │                 │                  │               │   │  │
│  │  │         ▼                 ▼                  ▼               │   │  │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │  │
│  │  │  │   Storage    │  │   Prompt      │  │   Memory      │   │   │  │
│  │  │  │   Adapter    │  │   Config      │  │   Updater     │   │   │  │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │  │
│  │  │                                                               │   │  │
│  │  │         ┌─────────────────────────────────────┐             │   │  │
│  │  │         │         LLM Adapter                 │             │   │  │
│  │  │         │    (Ollama / Local Inference)       │             │   │  │
│  │  │         └─────────────────────────────────────┘             │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │                                                                       │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │         Screen Manager (Learning Flow Control)                │   │  │
│  │  ├──────────────────────────────────────────────────────────────┤   │  │
│  │  │  • Screen unlock validation                                  │   │  │
│  │  │  • Prerequisite checking                                     │   │  │
│  │  │  • Progress tracking                                          │   │  │
│  │  │  • Constraint enforcement                                     │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  │                                                                       │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │         Constraint Enforcer (Anti-Gaming)                    │   │  │
│  │  ├──────────────────────────────────────────────────────────────┤   │  │
│  │  │  • Rate limiting                                             │   │  │
│  │  │  • Time-based constraints                                    │   │  │
│  │  │  • Attempt tracking                                          │   │  │
│  │  │  • Cooldown enforcement                                      │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                               │                                            │
│                               ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Domain Layer                                      │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │  Instructor  │  │   Learner    │  │    Screen     │             │  │
│  │  │   Domain     │  │   Domain    │  │    Domain     │             │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                               │                                            │
│                               ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Adapter Layer                                      │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │   Storage    │  │   Memory     │  │     LLM      │             │  │
│  │  │   Adapter    │  │   Adapter    │  │   Adapter    │             │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                               │                                            │
│                               ▼                                            │
└───────────────────────────────┼────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌───────────┐  ┌───────────┐  ┌───────────┐
        │  Storage  │  │  Memory   │  │    LLM    │
        │  (Local)  │  │  (Local)   │  │ (Ollama)  │
        └───────────┘  └───────────┘  └───────────┘
```

## Responsibility Boundaries

### Frontend Responsibilities

#### 1. Learning Interface Presentation
- **Render lesson screens**: Display concept introduction, practice, assessment screens
- **Visualize progress**: Show mastery levels, concept maps, learning trajectory
- **Display constraints**: Show time requirements, attempt limits, unlock conditions
- **UI feedback**: Immediate visual feedback for learner actions

#### 2. Client-Side Constraint Enforcement (First Line of Defense)
- **Input validation**: Validate learner input before submission
- **Rate limiting UI**: Disable buttons, show cooldown timers
- **Time tracking**: Track time spent on screens locally
- **Attempt counting**: Count attempts client-side for immediate feedback
- **Navigation control**: Disable navigation to locked screens

#### 3. UI State Management
- **Screen state**: Track which screen is active, unlocked, completed
- **Progress display**: Maintain UI state for progress visualization
- **Form state**: Manage form inputs and interactions
- **Optimistic updates**: Update UI optimistically before server confirmation

#### 4. Real-Time Response Handling
- **SSE connection management**: Maintain SSE connection for streaming responses
- **Chunk rendering**: Render instructor response chunks as they arrive
- **Connection recovery**: Handle SSE reconnection on network issues
- **Stream state**: Track streaming state (starting, streaming, complete)

#### 5. Learning Flow Control (UI Level)
- **Screen transitions**: Handle UI transitions between screens
- **Navigation logic**: Determine which screens are accessible
- **Prerequisite visualization**: Show prerequisite relationships
- **Completion detection**: Detect when screen objectives are met (UI level)

**Boundary**: Frontend enforces constraints for **immediate UX**, but backend is **source of truth** for learning state.

---

### Backend Responsibilities

#### 1. Learning State Authority (Source of Truth)
- **Session state**: Own session lifecycle and state transitions
- **Screen state**: Authoritative screen unlock/completion state
- **Progress tracking**: Track learning progress, mastery, attempts
- **Memory management**: Maintain learner memory and instructor profiles

#### 2. Pedagogical Logic
- **Screen unlock validation**: Validate prerequisites before unlocking screens
- **Mastery assessment**: Determine if learner has achieved mastery
- **Learning path**: Determine next screens based on progress
- **Adaptive difficulty**: Adjust difficulty based on learner performance

#### 3. Constraint Enforcement (Authoritative)
- **Server-side rate limiting**: Enforce rate limits at API level
- **Time validation**: Verify minimum time spent on screens
- **Attempt validation**: Verify attempt limits and cooldowns
- **Prerequisite validation**: Verify prerequisites are met

#### 4. Instructor Response Generation
- **Prompt assembly**: Build prompts with context, memory, history
- **LLM orchestration**: Call LLM adapter, handle streaming
- **Response validation**: Validate instructor responses meet teaching rules
- **Memory updates**: Extract learning insights and update memory

#### 5. Data Persistence
- **Session persistence**: Save session state, messages, screens
- **Memory persistence**: Persist learner memory across sessions
- **Profile persistence**: Store instructor profiles and teaching styles

**Boundary**: Backend owns **learning truth**; frontend provides **immediate UX** but defers to backend for validation.

---

## Session State Ownership

### Shared State Model

Both frontend and backend maintain state, but with **clear ownership**:

```
┌─────────────────────────────────────────────────────────────┐
│                    STATE OWNERSHIP                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  BACKEND (Source of Truth)                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • Session state (active/paused/completed)             │  │
│  │ • Screen unlock/completion state                      │  │
│  │ • Learning progress (mastery, concepts)               │  │
│  │ • Attempt counts, time spent                          │  │
│  │ • Learner memory                                      │  │
│  │ • Constraint violations                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                   │
│                          │ Sync                              │
│                          │                                   │
│  FRONTEND (Optimistic UI)                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ • UI state (current screen, form inputs)              │  │
│  │ • Optimistic progress display                         │  │
│  │ • Client-side constraint checks (for UX)             │  │
│  │ • SSE connection state                                │  │
│  │ • Temporary UI state (animations, transitions)       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Synchronization Strategy

1. **Frontend Optimistic Updates**: Update UI immediately for responsiveness
2. **Backend Validation**: Backend validates and returns authoritative state
3. **Conflict Resolution**: Frontend reconciles optimistic state with backend response
4. **Periodic Sync**: Frontend polls or receives updates for state changes

### State Sync Flow

```
Frontend Action
    │
    ├─► Optimistic UI Update (immediate)
    │
    └─► API Request ──► Backend Validation
                           │
                           ├─► Update Backend State
                           │
                           └─► Return Authoritative State
                                    │
                                    └─► Frontend Reconciliation
```

---

## Real-Time Communication: SSE vs WebSocket

### Decision: **Server-Sent Events (SSE)**

### Rationale

#### Why SSE for ORIGINER:

1. **One-Way Streaming**: Instructor responses stream from server to client
   - No need for bidirectional real-time communication
   - Frontend uses REST for actions (submit interaction, start screen)
   - SSE perfect for streaming LLM responses

2. **Educational Context**: 
   - Learners don't need real-time bidirectional chat
   - Structured lesson screens with clear actions
   - Responses are generated, not collaborative

3. **Simplicity**:
   - HTTP-based, easier to debug
   - Automatic reconnection handling
   - No protocol overhead
   - Works through firewalls/proxies easily

4. **Resource Efficiency**:
   - Lower server overhead than WebSocket
   - Simpler connection management
   - Better for local/offline-first deployment

5. **Browser Support**:
   - Excellent browser support
   - Simple JavaScript API
   - No additional libraries needed

#### When WebSocket Would Be Needed:

- Real-time collaborative editing
- Multi-user real-time interactions
- Bidirectional streaming requirements
- Gaming or real-time competition

**None of these apply to ORIGINER's educational use case.**

### SSE Implementation Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    SSE Communication Flow                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. POST /sessions/{id}/screens/{id}/interactions    │  │
│  │     { content: "learner answer", stream: true }       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  Backend                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  2. Validate request                                  │  │
│  │  3. Start SSE stream                                  │  │
│  │  4. Call LLM adapter (streaming)                      │  │
│  │  5. Stream chunks via SSE:                           │  │
│  │     event: content_chunk                              │  │
│  │     data: {"chunk": "..."}                            │  │
│  │  6. Send completion event                             │  │
│  │     event: message_complete                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  Frontend                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  7. Render chunks as they arrive                      │  │
│  │  8. Update UI on completion                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### SSE Event Types

```typescript
// Instructor response streaming
event: message_start
data: { messageId: string, sessionId: string }

event: content_chunk
data: { chunk: string }

event: message_complete
data: { 
  messageId: string,
  content: string,
  messageType: string,
  timestamp: string
}

// Screen state updates
event: screen_progress
data: { 
  screenId: string,
  progress: ScreenProgress
}

event: screen_unlocked
data: { 
  screenId: string,
  reason: string
}

// Session updates
event: session_updated
data: { 
  sessionId: string,
  state: SessionState,
  lastActivityAt: string
}

// Errors
event: error
data: { 
  code: string,
  message: string
}
```

---

## Educational Product Patterns (Not Generic SaaS)

### 1. Learning-First Architecture

**Not**: Generic CRUD operations
**Instead**: Learning flow operations (unlock screen, demonstrate mastery, progress)

**Example**:
```typescript
// NOT: POST /api/screens/{id}
// INSTEAD: POST /sessions/{id}/screens/{id}/start
//          POST /sessions/{id}/screens/{id}/interactions
//          GET /sessions/{id}/screens/{id}/unlock-status
```

### 2. Constraint-Driven Design

**Not**: Open API with rate limits
**Instead**: Learning constraints enforced at multiple layers

**Example**:
- Frontend: Disable "Next" button until mastery achieved
- API: Validate mastery before unlocking next screen
- Orchestrator: Verify against learner memory

### 3. Screen-Based Progression

**Not**: Free-form chat or message threads
**Instead**: Structured lesson screens with prerequisites

**Example**:
```
Concept Introduction → Guided Practice → Independent Practice → Assessment
     (locked)            (unlocked)         (locked)            (locked)
```

### 4. Memory-Aware Responses

**Not**: Stateless request/response
**Instead**: Context-aware responses using learner memory

**Example**:
- Instructor remembers what learner struggled with
- Avoids repeating concepts already mastered
- Builds on prior knowledge

### 5. Pedagogical Validation

**Not**: Generic input validation
**Instead**: Teaching rule validation

**Example**:
- Instructor never gives direct answers
- Responses must guide, not tell
- Maintains teaching character consistency

---

## Key Architectural Decisions

### 1. Frontend Contains Learning Logic
**Decision**: Frontend understands learning domain (prerequisites, mastery, progression)
**Rationale**: Enables immediate UX feedback without waiting for backend

### 2. Backend Owns Learning Truth
**Decision**: Backend is authoritative source for all learning state
**Rationale**: Prevents gaming, ensures integrity, enables persistence

### 3. Multi-Layer Constraint Enforcement
**Decision**: Constraints enforced at UI, API, and orchestrator layers
**Rationale**: Defense in depth against prompt abuse and gaming

### 4. SSE for Streaming
**Decision**: Use SSE instead of WebSocket for real-time communication
**Rationale**: One-way streaming fits educational use case, simpler, more efficient

### 5. Screen-Based Architecture
**Decision**: Organize around lesson screens, not messages
**Rationale**: Matches educational structure, enables progression control

### 6. Shared Domain Models
**Decision**: Frontend and backend share TypeScript types
**Rationale**: Ensures consistency, reduces bugs, enables type safety

---

## Data Flow Examples

### Example 1: Starting a Lesson Screen

```
1. Frontend: User clicks "Start Practice Screen"
   └─► Check client-side: Is screen unlocked? (optimistic)
   
2. Frontend: POST /sessions/{id}/screens/{id}/start
   └─► Backend: Validate prerequisites
       └─► Check learner memory
       └─► Verify previous screens completed
       └─► Return screen state
       
3. Frontend: Update UI with screen content
   └─► Start timer (client-side)
   └─► Enable interaction forms
```

### Example 2: Submitting Screen Interaction

```
1. Frontend: User submits answer
   └─► Validate input (client-side)
   └─► Check cooldown timer (client-side)
   └─► Disable submit button
   
2. Frontend: POST /sessions/{id}/screens/{id}/interactions?stream=true
   └─► Backend: Validate constraint (server-side)
       └─► Check rate limit
       └─► Verify screen is active
       └─► Check cooldown period
       
3. Backend: Start SSE stream
   └─► Call Session Orchestrator
       └─► Assemble prompt with context
       └─► Call LLM adapter (streaming)
       └─► Stream chunks via SSE
       
4. Frontend: Receive chunks
   └─► Render instructor response incrementally
   
5. Backend: Complete response
   └─► Validate teaching rules
   └─► Update learner memory
   └─► Update screen progress
   └─► Send completion event
   
6. Frontend: Update progress display
   └─► Check if screen can be completed
   └─► Update unlock status for next screens
```

---

## Summary

**Frontend**: Active learning interface with learning logic, immediate UX, optimistic updates
**Backend**: Source of truth for learning state, pedagogical logic, constraint enforcement
**State**: Shared with clear ownership - backend authoritative, frontend optimistic
**Communication**: SSE for one-way streaming of instructor responses
**Architecture**: Education-first, not generic SaaS patterns
