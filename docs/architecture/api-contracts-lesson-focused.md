# ORIGINER Lesson-Focused API Contracts

## Overview

This API contract is designed for a **web-based AI Instructor experience** where the frontend controls pacing and lesson flow. APIs are lesson-focused, not chat-based.

**Key Principles**:
- Frontend controls when to start, submit, request help, and complete
- Backend validates constraints and provides instructor responses
- SSE streaming for instructor feedback
- Clear progression control

---

## Base URL

```
https://api.originer.com/v1
```

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <token>
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-02-02T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2026-02-02T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Core Lesson APIs

### 1. Start Lesson

**POST** `/lessons/start`

**Purpose**: Start a new lesson screen within a session. Frontend controls when to start based on prerequisites and user readiness. Returns lesson content and initial state.

#### Request Body

```json
{
  "sessionId": "sess_abc123",
  "screenId": "screen_002",
  "screenType": "guided_practice",
  "clientTimestamp": "2026-02-02T10:32:00Z"
}
```

#### Request Schema

```typescript
interface StartLessonRequest {
  sessionId: string;              // Active session ID
  screenId: string;               // Screen to start
  screenType: LessonScreenType;   // Type of screen
  clientTimestamp: string;        // ISO 8601 timestamp (for pacing control)
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "lesson": {
      "screenId": "screen_002",
      "sessionId": "sess_abc123",
      "screenType": "guided_practice",
      "concept": "Linear Equations",
      "learningObjective": "Practice solving linear equations with guidance",
      "content": {
        "problem": "Solve for x: 2x + 5 = 13",
        "instructions": "Think about what operation you need to perform first.",
        "hintsAvailable": 3,
        "maxAttempts": 5
      },
      "constraints": {
        "minTimeOnScreen": 60,
        "requiredAttempts": 1,
        "masteryThreshold": 80,
        "cooldownBetweenAttempts": 10,
        "rateLimitPerMinute": 6
      },
      "state": "active",
      "startedAt": "2026-02-02T10:32:00Z"
    },
    "progress": {
      "attempts": 0,
      "timeSpent": 0,
      "canProceed": false,
      "masteryScore": null
    },
    "navigation": {
      "canGoBack": true,
      "canGoForward": false,
      "nextScreenId": "screen_003",
      "nextScreenUnlocked": false,
      "unlockRequirements": [
        {
          "type": "mastery",
          "description": "Achieve mastery score of 80%",
          "currentValue": 0,
          "requiredValue": 80
        },
        {
          "type": "attempts",
          "description": "Complete at least 1 attempt",
          "currentValue": 0,
          "requiredValue": 1
        }
      ]
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:32:00Z",
    "requestId": "req_abc123"
  }
}
```

#### Response Schema

```typescript
interface StartLessonResponse {
  lesson: {
    screenId: string;
    sessionId: string;
    screenType: LessonScreenType;
    concept: string;
    learningObjective: string;
    content: LessonContent;
    constraints: LearningConstraints;
    state: 'active';
    startedAt: string;
  };
  progress: {
    attempts: number;
    timeSpent: number;
    canProceed: boolean;
    masteryScore: number | null;
  };
  navigation: {
    canGoBack: boolean;
    canGoForward: boolean;
    nextScreenId: string | null;
    nextScreenUnlocked: boolean;
    unlockRequirements: UnlockRequirement[];
  };
}

interface LessonContent {
  problem: string;
  instructions: string;
  hintsAvailable: number;
  maxAttempts: number;
  additionalContext?: string;
}

interface UnlockRequirement {
  type: 'mastery' | 'attempts' | 'time' | 'prerequisite';
  description: string;
  currentValue: number | string;
  requiredValue: number | string;
}
```

#### Error Codes

- `SESSION_NOT_FOUND`: Session ID not found
- `SESSION_NOT_ACTIVE`: Session is not in active state
- `SCREEN_NOT_FOUND`: Screen ID not found
- `SCREEN_LOCKED`: Screen is locked (prerequisites not met)
- `SCREEN_ALREADY_STARTED`: Screen is already active
- `CONSTRAINT_VIOLATION`: Screen constraints not met (e.g., cooldown period)
- `INVALID_SCREEN_TYPE`: Invalid screen type for this context

---

### 2. Submit Answer

**POST** `/lessons/{screenId}/submit`

**Purpose**: Submit a learner's answer or response. Frontend controls when submission happens (after validation, cooldown checks). Returns instructor feedback via SSE stream.

#### Path Parameters

- `screenId` (string, required): Current lesson screen ID

#### Request Body

```json
{
  "sessionId": "sess_abc123",
  "answer": "I think I need to subtract 5 from both sides first.",
  "attemptNumber": 1,
  "timeSpent": 45,
  "clientTimestamp": "2026-02-02T10:32:45Z",
  "stream": true
}
```

#### Request Schema

```typescript
interface SubmitAnswerRequest {
  sessionId: string;
  answer: string;                 // Learner's answer/response
  attemptNumber: number;          // Current attempt number (frontend-tracked)
  timeSpent: number;             // Seconds spent on this attempt (frontend-tracked)
  clientTimestamp: string;        // ISO 8601 timestamp
  stream?: boolean;               // Enable SSE streaming (default: true)
  metadata?: {                    // Optional metadata
    isComplete?: boolean;         // Is this a complete solution?
    workShown?: string;           // Work shown (for math problems)
  };
}
```

#### Query Parameters

- `stream` (boolean, optional): Enable Server-Sent Events streaming (default: true)

#### Response (200 OK) - Non-Streaming

```json
{
  "success": true,
  "data": {
    "interaction": {
      "id": "interaction_001",
      "screenId": "screen_002",
      "sessionId": "sess_abc123",
      "attemptNumber": 1,
      "timestamp": "2026-02-02T10:32:45Z"
    },
    "feedback": {
      "content": "That's a good start! Why do you think subtracting 5 from both sides helps?",
      "type": "guidance",
      "isCorrect": null,
      "revealedInformation": []
    },
    "progress": {
      "attempts": 1,
      "masteryScore": 40,
      "canProceed": false,
      "timeSpent": 45
    },
    "constraints": {
      "canSubmitAgain": true,
      "nextSubmissionAllowedAt": "2026-02-02T10:33:00Z",
      "remainingAttempts": 4,
      "hintsRemaining": 3
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:32:45Z",
    "requestId": "req_abc123"
  }
}
```

#### Response (200 OK) - Streaming (SSE)

**Content-Type**: `text/event-stream`

When `stream=true`, the response uses Server-Sent Events:

```
event: interaction_started
data: {"interactionId": "interaction_001", "screenId": "screen_002"}

event: feedback_chunk
data: {"chunk": "That's a good start! "}

event: feedback_chunk
data: {"chunk": "Why do you think subtracting 5 from both sides helps?"}

event: feedback_complete
data: {
  "interactionId": "interaction_001",
  "feedback": {
    "content": "That's a good start! Why do you think subtracting 5 from both sides helps?",
    "type": "guidance",
    "isCorrect": null,
    "revealedInformation": []
  }
}

event: progress_updated
data: {
  "progress": {
    "attempts": 1,
    "masteryScore": 40,
    "canProceed": false,
    "timeSpent": 45
  }
}

event: constraints_updated
data: {
  "constraints": {
    "canSubmitAgain": true,
    "nextSubmissionAllowedAt": "2026-02-02T10:33:00Z",
    "remainingAttempts": 4,
    "hintsRemaining": 3
  }
}
```

#### Response Schema

```typescript
interface SubmitAnswerResponse {
  interaction: {
    id: string;
    screenId: string;
    sessionId: string;
    attemptNumber: number;
    timestamp: string;
  };
  feedback: {
    content: string;
    type: 'guidance' | 'correction' | 'encouragement' | 'hint';
    isCorrect: boolean | null;        // null = guidance, true/false = assessment
    revealedInformation: string[];    // Concepts directly stated (for tracking)
  };
  progress: {
    attempts: number;
    masteryScore: number;             // 0-100
    canProceed: boolean;
    timeSpent: number;
  };
  constraints: {
    canSubmitAgain: boolean;
    nextSubmissionAllowedAt: string | null;  // ISO 8601 timestamp
    remainingAttempts: number;
    hintsRemaining: number;
  };
}
```

#### Error Codes

- `SCREEN_NOT_ACTIVE`: Screen is not currently active
- `RATE_LIMIT_EXCEEDED`: Too many submissions (cooldown active)
- `MAX_ATTEMPTS_REACHED`: Maximum attempts for this screen reached
- `CONSTRAINT_VIOLATION`: Submission violates constraints (e.g., min time not met)
- `INVALID_ANSWER`: Answer format is invalid
- `SESSION_NOT_FOUND`: Session ID not found

---

### 3. Request Hint

**POST** `/lessons/{screenId}/hint`

**Purpose**: Request a hint when stuck. Frontend controls hint availability and limits. Returns progressive hints (more revealing if multiple requests).

#### Path Parameters

- `screenId` (string, required): Current lesson screen ID

#### Request Body

```json
{
  "sessionId": "sess_abc123",
  "hintLevel": 1,
  "context": "I'm stuck on the first step.",
  "clientTimestamp": "2026-02-02T10:33:30Z",
  "stream": true
}
```

#### Request Schema

```typescript
interface RequestHintRequest {
  sessionId: string;
  hintLevel: number;              // 1 = subtle, 2 = moderate, 3 = direct
  context?: string;              // Optional context about what learner is stuck on
  clientTimestamp: string;
  stream?: boolean;               // Enable SSE streaming (default: true)
}
```

#### Response (200 OK) - Non-Streaming

```json
{
  "success": true,
  "data": {
    "hint": {
      "id": "hint_001",
      "screenId": "screen_002",
      "hintLevel": 1,
      "content": "Think about what happens when you perform the same operation on both sides of an equation.",
      "type": "leading_question",
      "revealedInformation": ["operations on both sides"]
    },
    "hintsRemaining": 2,
    "canRequestMore": true,
    "nextHintLevel": 2
  },
  "meta": {
    "timestamp": "2026-02-02T10:33:30Z",
    "requestId": "req_abc123"
  }
}
```

#### Response (200 OK) - Streaming (SSE)

**Content-Type**: `text/event-stream`

```
event: hint_started
data: {"hintId": "hint_001", "hintLevel": 1}

event: hint_chunk
data: {"chunk": "Think about what happens "}

event: hint_chunk
data: {"chunk": "when you perform the same operation "}

event: hint_chunk
data: {"chunk": "on both sides of an equation."}

event: hint_complete
data: {
  "hintId": "hint_001",
  "hint": {
    "content": "Think about what happens when you perform the same operation on both sides of an equation.",
    "type": "leading_question",
    "revealedInformation": ["operations on both sides"]
  },
  "hintsRemaining": 2,
  "canRequestMore": true
}
```

#### Response Schema

```typescript
interface RequestHintResponse {
  hint: {
    id: string;
    screenId: string;
    hintLevel: number;
    content: string;
    type: 'leading_question' | 'scaffold' | 'example' | 'direct_hint';
    revealedInformation: string[];  // Concepts revealed (for tracking)
  };
  hintsRemaining: number;
  canRequestMore: boolean;
  nextHintLevel: number | null;     // Next hint level if available
}
```

#### Error Codes

- `SCREEN_NOT_ACTIVE`: Screen is not currently active
- `NO_HINTS_AVAILABLE`: No hints remaining for this screen
- `HINT_LIMIT_REACHED`: Maximum hints already requested
- `INVALID_HINT_LEVEL`: Invalid hint level
- `SESSION_NOT_FOUND`: Session ID not found

---

### 4. Complete Lesson

**POST** `/lessons/{screenId}/complete`

**Purpose**: Mark a lesson screen as complete. Frontend controls when to complete (after mastery achieved, requirements met). Backend validates completion requirements.

#### Path Parameters

- `screenId` (string, required): Lesson screen ID to complete

#### Request Body

```json
{
  "sessionId": "sess_abc123",
  "finalAnswer": "x = 4",
  "totalTimeSpent": 180,
  "totalAttempts": 3,
  "clientTimestamp": "2026-02-02T10:35:00Z"
}
```

#### Request Schema

```typescript
interface CompleteLessonRequest {
  sessionId: string;
  finalAnswer?: string;           // Final answer if applicable
  totalTimeSpent: number;         // Total seconds spent on screen
  totalAttempts: number;          // Total attempts made
  clientTimestamp: string;
  metadata?: {
    conceptsDemonstrated: string[];  // Concepts learner demonstrated
    selfAssessment?: 'confident' | 'somewhat_confident' | 'uncertain';
  };
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "completion": {
      "screenId": "screen_002",
      "sessionId": "sess_abc123",
      "completedAt": "2026-02-02T10:35:00Z",
      "masteryAchieved": true,
      "masteryScore": 85
    },
    "progress": {
      "attempts": 3,
      "timeSpent": 180,
      "masteryScore": 85,
      "conceptsDemonstrated": [
        "Subtraction property of equality",
        "Isolating variables"
      ]
    },
    "navigation": {
      "nextScreenId": "screen_003",
      "nextScreenUnlocked": true,
      "canProceed": true
    },
    "memoryUpdates": {
      "conceptsIntroduced": [],
      "conceptsPracticed": ["Linear equations"],
      "conceptsMastered": ["Subtraction property of equality"],
      "progressMarkers": ["Can solve single-variable linear equations"]
    },
    "summary": {
      "whatYouLearned": "You learned to solve linear equations by isolating the variable.",
      "keyTakeaways": [
        "Subtract the same value from both sides",
        "Isolate the variable step by step"
      ],
      "nextSteps": "Practice with equations containing fractions"
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:35:00Z",
    "requestId": "req_abc123"
  }
}
```

#### Response Schema

```typescript
interface CompleteLessonResponse {
  completion: {
    screenId: string;
    sessionId: string;
    completedAt: string;
    masteryAchieved: boolean;
    masteryScore: number;
  };
  progress: {
    attempts: number;
    timeSpent: number;
    masteryScore: number;
    conceptsDemonstrated: string[];
  };
  navigation: {
    nextScreenId: string | null;
    nextScreenUnlocked: boolean;
    canProceed: boolean;
  };
  memoryUpdates: {
    conceptsIntroduced: string[];
    conceptsPracticed: string[];
    conceptsMastered: string[];
    progressMarkers: string[];
  };
  summary: {
    whatYouLearned: string;
    keyTakeaways: string[];
    nextSteps: string;
  };
}
```

#### Error Codes

- `SCREEN_NOT_ACTIVE`: Screen is not currently active
- `REQUIREMENTS_NOT_MET`: Completion requirements not met (mastery, attempts, time)
- `CANNOT_COMPLETE`: Screen cannot be completed yet
- `SESSION_NOT_FOUND`: Session ID not found
- `ALREADY_COMPLETED`: Screen is already completed

---

## Supporting Endpoints

### Get Lesson State

**GET** `/lessons/{screenId}/state`

**Purpose**: Get current lesson state and progress. Frontend can poll this to sync state.

#### Response

```json
{
  "success": true,
  "data": {
    "screenId": "screen_002",
    "state": "active",
    "progress": {
      "attempts": 2,
      "masteryScore": 60,
      "canProceed": false,
      "timeSpent": 120
    },
    "constraints": {
      "canSubmit": true,
      "nextSubmissionAllowedAt": null,
      "remainingAttempts": 3,
      "hintsRemaining": 2
    },
    "navigation": {
      "canGoBack": true,
      "canGoForward": false,
      "nextScreenUnlocked": false
    }
  }
}
```

---

### List Available Lessons

**GET** `/sessions/{sessionId}/lessons`

**Purpose**: List all lesson screens for a session with their unlock status.

#### Response

```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "screenId": "screen_001",
        "screenType": "concept_introduction",
        "state": "completed",
        "concept": "Linear Equations",
        "unlocked": true
      },
      {
        "screenId": "screen_002",
        "screenType": "guided_practice",
        "state": "active",
        "concept": "Linear Equations",
        "unlocked": true
      },
      {
        "screenId": "screen_003",
        "screenType": "independent_practice",
        "state": "locked",
        "concept": "Linear Equations",
        "unlocked": false,
        "unlockRequirements": [
          {
            "type": "prerequisite",
            "description": "Complete guided practice",
            "currentValue": "in_progress",
            "requiredValue": "completed"
          }
        ]
      }
    ]
  }
}
```

---

## Frontend Pacing Control

### How Frontend Controls Pacing

1. **Start Timing**: Frontend decides when to call `startLesson` based on:
   - Prerequisites met (from `unlockRequirements`)
   - User readiness (UI state)
   - Navigation flow

2. **Submission Timing**: Frontend controls when to call `submitAnswer`:
   - After input validation
   - After cooldown period (check `nextSubmissionAllowedAt`)
   - After minimum time spent (client-tracked)

3. **Hint Timing**: Frontend controls when to call `requestHint`:
   - Based on `hintsRemaining`
   - After learner indicates being stuck
   - Respecting hint limits

4. **Completion Timing**: Frontend controls when to call `completeLesson`:
   - After `canProceed` is true
   - After mastery achieved
   - After user confirms completion

### Client-Side Validation

Frontend should validate before API calls:
- Check constraints locally (cooldown, attempts, time)
- Validate input format
- Check unlock requirements
- Verify screen state

Backend validates again (source of truth), but frontend validation provides immediate UX feedback.

---

## SSE Event Types

### For `submitAnswer`:

- `interaction_started`: Interaction processing started
- `feedback_chunk`: Chunk of instructor feedback
- `feedback_complete`: Complete feedback message
- `progress_updated`: Progress state updated
- `constraints_updated`: Constraint state updated
- `error`: Error occurred

### For `requestHint`:

- `hint_started`: Hint generation started
- `hint_chunk`: Chunk of hint content
- `hint_complete`: Complete hint message
- `error`: Error occurred

---

## Design Decisions

### 1. Lesson-Focused APIs
**Why**: Matches educational structure, not chat interface
**Benefit**: Clear progression, better constraint enforcement

### 2. Frontend Controls Pacing
**Why**: Better UX, immediate feedback, optimistic updates
**Implementation**: Frontend validates, backend authorizes

### 3. SSE Streaming
**Why**: Real-time instructor feedback, better perceived performance
**Pattern**: REST for actions, SSE for responses

### 4. Explicit Constraints
**Why**: Prevent gaming, ensure learning integrity
**Response**: Always return constraint state

### 5. Progress Tracking
**Why**: Frontend needs progress for UI, backend needs for validation
**Pattern**: Return progress in every response

---

## Summary

**startLesson**: Begin a lesson screen, get content and constraints
**submitAnswer**: Submit answer, get instructor feedback (SSE)
**requestHint**: Request help when stuck, get progressive hints (SSE)
**completeLesson**: Complete lesson, get summary and unlock next

All APIs support frontend pacing control while backend validates constraints and provides instructor guidance.
