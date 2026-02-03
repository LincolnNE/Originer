# Data Flow Documentation

This document describes how data flows through the ORIGINER backend system.

## Architecture Overview

```
HTTP Request
    ↓
Route Handler (routes/lessons.ts, routes/sessions.ts)
    ↓
SessionOrchestrator (core/SessionOrchestrator.ts)
    ├─→ PromptAssembler (core/PromptAssembler.ts) → LLMAdapter
    ├─→ ResponseValidator (core/ResponseValidator.ts)
    └─→ StorageAdapter (adapters/storage/)
    ↓
HTTP Response
```

## Service Initialization

**File**: `src/services/index.ts`

Services are created in dependency order:
1. `StorageAdapter` - Data persistence
2. `LLMAdapter` - LLM provider abstraction
3. `PromptAssembler` - Prompt construction
4. `ResponseValidator` - Response validation
5. `SessionOrchestrator` - Orchestrates all services

**Data Flow**:
```
createServices()
  → StorageAdapter (created)
  → LLMAdapter (created)
  → PromptAssembler (created, uses StorageAdapter indirectly)
  → ResponseValidator (created)
  → SessionOrchestrator (created, uses all above)
```

## Lesson Endpoints

### POST /api/v1/lessons/start

**Data Flow**:
```
HTTP Request (sessionId, screenId, screenType)
  ↓
Route Handler (routes/lessons.ts)
  ↓
StorageAdapter.loadSession(sessionId)  [STATELESS: Load from storage]
  ↓
Validate prerequisites (placeholder)
  ↓
Load screen definition (placeholder)
  ↓
HTTP Response (lesson content, progress, constraints)
```

**Key Points**:
- Stateless: Session loaded from storage on each request
- No SessionOrchestrator used (just metadata loading)
- Placeholders for screen definition and prerequisites

---

### POST /api/v1/lessons/:screenId/submit

**Data Flow**:
```
HTTP Request (sessionId, answer)
  ↓
Route Handler (routes/lessons.ts)
  ↓
StorageAdapter.loadSession(sessionId)  [STATELESS]
  ↓
SessionOrchestrator.processLearnerMessage(sessionId, answer)
  ├─→ StorageAdapter.loadSession() [Internal]
  ├─→ StorageAdapter.loadInstructorProfile()
  ├─→ StorageAdapter.loadLearnerMemory()
  ├─→ StorageAdapter.loadMessages()
  │
  ├─→ PromptAssembler.assemblePrompt()
  │     ├─→ Load system prompts from files
  │     ├─→ Format learner context
  │     ├─→ Format session context
  │     └─→ Combine into full prompt
  │
  ├─→ LLMAdapter.generate(prompt)
  │     └─→ Call LLM provider (Ollama, OpenAI, etc.)
  │
  ├─→ ResponseValidator.validate(response)
  │     ├─→ Check for direct answers
  │     ├─→ Check for verification questions
  │     ├─→ Check style consistency
  │     └─→ Check safety constraints
  │
  ├─→ StorageAdapter.saveMessage(instructorMessage)
  ├─→ StorageAdapter.updateSession()
  └─→ StorageAdapter.saveLearnerMemory()
  ↓
HTTP Response (feedback, progress, constraints)
```

**Key Points**:
- **Core Logic**: All AI logic happens in `SessionOrchestrator`
- **PromptAssembler**: Used internally by SessionOrchestrator
- **ResponseValidator**: Used internally by SessionOrchestrator
- **Stateless**: All state loaded from storage, no in-memory state

---

### POST /api/v1/lessons/:screenId/hint

**Data Flow**:
```
HTTP Request (sessionId, hintLevel)
  ↓
Route Handler (routes/lessons.ts)
  ↓
StorageAdapter.loadSession(sessionId)  [STATELESS]
  ↓
Generate hint (placeholder - would use SessionOrchestrator with hint context)
  ↓
HTTP Response (hint content)
```

---

### POST /api/v1/lessons/:screenId/complete

**Data Flow**:
```
HTTP Request (sessionId)
  ↓
Route Handler (routes/lessons.ts)
  ↓
StorageAdapter.loadSession(sessionId)  [STATELESS]
  ↓
Validate completion requirements (placeholder)
  ↓
StorageAdapter.updateSession() (mark screen complete)
  ↓
HTTP Response (completion status, next screen)
```

## Session Endpoints

### POST /api/v1/sessions

**Data Flow**:
```
HTTP Request (learnerId, instructorProfileId, subject, topic, learningObjective)
  ↓
Route Handler (routes/sessions.ts)
  ↓
StorageAdapter.saveSession() (placeholder)
  ↓
HTTP Response (session data)
```

### GET /api/v1/sessions/:sessionId

**Data Flow**:
```
HTTP Request (sessionId)
  ↓
Route Handler (routes/sessions.ts)
  ↓
StorageAdapter.loadSession(sessionId)  [STATELESS]
  ↓
HTTP Response (session data)
```

## Response Validation Middleware

**File**: `src/middleware/response-validation.ts`

**Purpose**: Optional additional validation layer at HTTP boundary.

**Data Flow**:
```
Instructor Response
  ↓
ResponseValidator.validate()
  ├─→ Check violations
  └─→ Return validation result
  ↓
HTTP Response (validated or rejected)
```

**Note**: ResponseValidator is already used internally by SessionOrchestrator. This middleware provides an additional validation layer if needed.

## Key Design Principles

1. **Stateless HTTP Layer**: Every request loads state from storage
2. **Service Composition**: SessionOrchestrator composes PromptAssembler, ResponseValidator, and adapters
3. **Separation of Concerns**: 
   - Routes handle HTTP concerns
   - SessionOrchestrator handles business logic
   - PromptAssembler handles prompt construction
   - ResponseValidator handles validation
4. **No Frontend Assumptions**: Backend returns JSON, framework-agnostic

## Placeholders

Current implementation uses placeholders for:
- Screen definition loading
- Prerequisite validation
- Progress calculation
- Constraint enforcement
- Hint generation
- Completion validation

These will be implemented as core logic is completed.
