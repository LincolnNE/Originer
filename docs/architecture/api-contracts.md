# ORIGINER REST API Contracts

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

## Endpoints

### 1. Start Session

**POST** `/sessions`

Creates a new teaching session between an instructor and learner.

#### Request Body

```json
{
  "instructorId": "inst_123",
  "instructorProfileId": "profile_456",
  "learnerId": "learner_789",
  "subject": "Mathematics",
  "topic": "Linear Equations",
  "learningObjective": "Solve linear equations with one variable"
}
```

#### Response (201 Created)

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "sess_abc123",
      "instructorId": "inst_123",
      "learnerId": "learner_789",
      "instructorProfileId": "profile_456",
      "subject": "Mathematics",
      "topic": "Linear Equations",
      "learningObjective": "Solve linear equations with one variable",
      "state": "active",
      "startedAt": "2026-02-02T10:30:00Z",
      "lastActivityAt": "2026-02-02T10:30:00Z",
      "messageCount": 0
    },
    "learnerContext": {
      "learnedConcepts": [
        {
          "concept": "Basic arithmetic",
          "masteryLevel": "mastered"
        }
      ],
      "strengths": ["Problem-solving"],
      "weaknesses": ["Algebraic manipulation"]
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

#### Error Codes

- `INVALID_INSTRUCTOR`: Instructor ID not found
- `INVALID_PROFILE`: Instructor profile not found
- `INVALID_LEARNER`: Learner ID not found
- `ACTIVE_SESSION_EXISTS`: Learner already has an active session
- `MISSING_REQUIRED_FIELD`: Required field missing

---

### 2. Send Message

**POST** `/sessions/{sessionId}/messages`

Sends a learner message and receives an instructor response. Supports both standard and streaming responses.

#### Path Parameters

- `sessionId` (string, required): Session identifier

#### Request Body

```json
{
  "content": "I'm trying to solve 2x + 5 = 13, but I'm not sure where to start.",
  "stream": false
}
```

#### Query Parameters

- `stream` (boolean, optional): Enable Server-Sent Events streaming (default: false)

#### Response (200 OK) - Non-Streaming

```json
{
  "success": true,
  "data": {
    "learnerMessage": {
      "id": "msg_learner_001",
      "sessionId": "sess_abc123",
      "role": "learner",
      "content": "I'm trying to solve 2x + 5 = 13, but I'm not sure where to start.",
      "messageType": "question",
      "timestamp": "2026-02-02T10:31:00Z"
    },
    "instructorMessage": {
      "id": "msg_instructor_001",
      "sessionId": "sess_abc123",
      "role": "instructor",
      "content": "I see you're working on solving 2x + 5 = 13. What's your goal when solving an equation like this? What are you trying to find?\n\nThink about what operation you could do to both sides of the equation to get x by itself. What happens if you subtract the same number from both sides?\n\nCan you walk me through what you've tried so far?",
      "messageType": "guidance",
      "timestamp": "2026-02-02T10:31:05Z",
      "teachingMetadata": {
        "isLeadingQuestion": false,
        "revealedInformation": []
      }
    },
    "session": {
      "id": "sess_abc123",
      "state": "active",
      "lastActivityAt": "2026-02-02T10:31:05Z",
      "messageCount": 2
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:31:05Z",
    "requestId": "req_abc123"
  }
}
```

#### Response (200 OK) - Streaming

**Content-Type**: `text/event-stream`

When `stream=true`, the response uses Server-Sent Events (SSE):

```
event: message_start
data: {"messageId": "msg_instructor_001", "sessionId": "sess_abc123"}

event: content_chunk
data: {"chunk": "I see you're working on solving 2x + 5 = 13. "}

event: content_chunk
data: {"chunk": "What's your goal when solving an equation like this? "}

event: content_chunk
data: {"chunk": "What are you trying to find?\n\n"}

event: content_chunk
data: {"chunk": "Think about what operation you could do to both sides..."}

event: message_complete
data: {
  "messageId": "msg_instructor_001",
  "content": "I see you're working on solving 2x + 5 = 13. What's your goal when solving an equation like this? What are you trying to find?\n\nThink about what operation you could do to both sides of the equation to get x by itself. What happens if you subtract the same number from both sides?\n\nCan you walk me through what you've tried so far?",
  "messageType": "guidance",
  "timestamp": "2026-02-02T10:31:05Z"
}

event: session_updated
data: {
  "sessionId": "sess_abc123",
  "lastActivityAt": "2026-02-02T10:31:05Z",
  "messageCount": 2
}
```

#### Error Codes

- `SESSION_NOT_FOUND`: Session ID not found
- `SESSION_NOT_ACTIVE`: Session is not in active state
- `INVALID_MESSAGE`: Message content is empty or invalid
- `VALIDATION_FAILED`: Instructor response failed validation (retry automatically)
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

### 3. Get Session Messages

**GET** `/sessions/{sessionId}/messages`

Retrieves all messages for a session.

#### Path Parameters

- `sessionId` (string, required): Session identifier

#### Query Parameters

- `limit` (integer, optional): Maximum number of messages to return (default: 50, max: 100)
- `before` (string, optional): Message ID to fetch messages before (for pagination)
- `after` (string, optional): Message ID to fetch messages after (for pagination)

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_learner_001",
        "sessionId": "sess_abc123",
        "role": "learner",
        "content": "I'm trying to solve 2x + 5 = 13...",
        "messageType": "question",
        "timestamp": "2026-02-02T10:31:00Z"
      },
      {
        "id": "msg_instructor_001",
        "sessionId": "sess_abc123",
        "role": "instructor",
        "content": "I see you're working on solving...",
        "messageType": "guidance",
        "timestamp": "2026-02-02T10:31:05Z",
        "teachingMetadata": {
          "isLeadingQuestion": false,
          "revealedInformation": []
        }
      }
    ],
    "pagination": {
      "hasMore": false,
      "totalCount": 2
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:32:00Z",
    "requestId": "req_abc123"
  }
}
```

---

### 4. End Session

**PATCH** `/sessions/{sessionId}/end`

Ends an active session and generates a session summary.

#### Path Parameters

- `sessionId` (string, required): Session identifier

#### Request Body (optional)

```json
{
  "reason": "completed"
}
```

`reason` values: `"completed"`, `"abandoned"`, `"paused"`

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "sess_abc123",
      "state": "completed",
      "startedAt": "2026-02-02T10:30:00Z",
      "endedAt": "2026-02-02T10:45:00Z",
      "durationMinutes": 15,
      "messageCount": 24
    },
    "summary": {
      "keyConcepts": [
        "Linear equations",
        "Isolating variables",
        "Balancing equations"
      ],
      "learnerProgress": "Learner successfully solved linear equations independently",
      "misconceptionsAddressed": [
        "Order of operations in equation solving"
      ],
      "nextSteps": [
        "Practice with equations containing fractions",
        "Explore multi-step equations"
      ]
    },
    "memoryUpdates": {
      "conceptsIntroduced": ["Linear equations"],
      "conceptsPracticed": ["Basic arithmetic"],
      "progressMarkers": ["Can solve single-variable linear equations"]
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:45:00Z",
    "requestId": "req_abc123"
  }
}
```

#### Error Codes

- `SESSION_NOT_FOUND`: Session ID not found
- `SESSION_ALREADY_ENDED`: Session is already ended
- `INVALID_REASON`: Invalid reason value

---

### 5. Get Session

**GET** `/sessions/{sessionId}`

Retrieves session details.

#### Path Parameters

- `sessionId` (string, required): Session identifier

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "sess_abc123",
      "instructorId": "inst_123",
      "learnerId": "learner_789",
      "instructorProfileId": "profile_456",
      "subject": "Mathematics",
      "topic": "Linear Equations",
      "learningObjective": "Solve linear equations with one variable",
      "state": "active",
      "startedAt": "2026-02-02T10:30:00Z",
      "lastActivityAt": "2026-02-02T10:31:05Z",
      "endedAt": null,
      "messageCount": 2
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:32:00Z",
    "requestId": "req_abc123"
  }
}
```

---

### 6. Instructor Dashboard

**GET** `/instructors/{instructorId}/dashboard`

Retrieves dashboard data for an instructor, including session statistics and learner insights.

#### Path Parameters

- `instructorId` (string, required): Instructor identifier

#### Query Parameters

- `timeRange` (string, optional): Time range for statistics (`"7d"`, `"30d"`, `"90d"`, `"all"`, default: `"30d"`)
- `includeLearners` (boolean, optional): Include learner list (default: false)

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "instructor": {
      "id": "inst_123",
      "name": "Math Instructor",
      "activeProfileId": "profile_456"
    },
    "statistics": {
      "totalSessions": 45,
      "activeSessions": 3,
      "completedSessions": 40,
      "totalMessages": 1250,
      "averageSessionDuration": 18.5,
      "averageMessagesPerSession": 27.8
    },
    "recentSessions": [
      {
        "id": "sess_abc123",
        "learnerId": "learner_789",
        "subject": "Mathematics",
        "topic": "Linear Equations",
        "state": "active",
        "startedAt": "2026-02-02T10:30:00Z",
        "messageCount": 12
      }
    ],
    "learnerInsights": [
      {
        "learnerId": "learner_789",
        "totalSessions": 5,
        "lastSessionAt": "2026-02-02T10:30:00Z",
        "progressAreas": ["Algebraic manipulation"],
        "strengths": ["Problem-solving", "Conceptual understanding"]
      }
    ],
    "timeRange": {
      "start": "2026-01-03T00:00:00Z",
      "end": "2026-02-02T23:59:59Z"
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:35:00Z",
    "requestId": "req_abc123"
  }
}
```

#### Error Codes

- `INSTRUCTOR_NOT_FOUND`: Instructor ID not found
- `INVALID_TIME_RANGE`: Invalid time range value

---

### 7. List Instructor Sessions

**GET** `/instructors/{instructorId}/sessions`

Lists all sessions for an instructor.

#### Path Parameters

- `instructorId` (string, required): Instructor identifier

#### Query Parameters

- `state` (string, optional): Filter by session state (`"active"`, `"completed"`, `"paused"`, `"abandoned"`)
- `limit` (integer, optional): Maximum number of sessions (default: 20, max: 100)
- `offset` (integer, optional): Pagination offset (default: 0)

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "sess_abc123",
        "learnerId": "learner_789",
        "subject": "Mathematics",
        "topic": "Linear Equations",
        "state": "active",
        "startedAt": "2026-02-02T10:30:00Z",
        "lastActivityAt": "2026-02-02T10:31:05Z",
        "messageCount": 12
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:36:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Streaming Support

### Server-Sent Events (SSE)

When `stream=true` in the send message request, responses use SSE format:

**Event Types:**
- `message_start`: Instructor message generation started
- `content_chunk`: Chunk of instructor response content
- `message_complete`: Instructor message generation completed
- `session_updated`: Session state updated
- `error`: Error occurred during generation

**Example Client Code (JavaScript):**

```javascript
const eventSource = new EventSource(
  `/sessions/${sessionId}/messages?stream=true`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: "Learner message here",
      stream: true
    })
  }
);

eventSource.addEventListener('content_chunk', (event) => {
  const data = JSON.parse(event.data);
  appendToUI(data.chunk);
});

eventSource.addEventListener('message_complete', (event) => {
  const data = JSON.parse(event.data);
  finalizeMessage(data);
  eventSource.close();
});
```

---

## Rate Limiting

Rate limits are applied per endpoint:

- **Start Session**: 10 requests/minute
- **Send Message**: 30 requests/minute
- **Get Messages**: 60 requests/minute
- **End Session**: 10 requests/minute
- **Dashboard**: 20 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 1641216000
```

---

## Error Codes

### Client Errors (4xx)

- `BAD_REQUEST` (400): Invalid request format
- `UNAUTHORIZED` (401): Missing or invalid authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (e.g., active session exists)
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `VALIDATION_FAILED` (422): Request validation failed

### Server Errors (5xx)

- `INTERNAL_ERROR` (500): Internal server error
- `SERVICE_UNAVAILABLE` (503): Service temporarily unavailable
- `LLM_ERROR` (502): LLM provider error (retry recommended)

---

---

### 8. List Lesson Screens

**GET** `/sessions/{sessionId}/screens`

Retrieves all lesson screens for a session with their current states.

#### Path Parameters

- `sessionId` (string, required): Session identifier

#### Query Parameters

- `includeProgress` (boolean, optional): Include progress details for each screen (default: false)

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "screens": [
      {
        "id": "screen_001",
        "sessionId": "sess_abc123",
        "screenType": "concept_introduction",
        "state": "completed",
        "concept": "Linear Equations",
        "learningObjective": "Understand basic linear equation structure",
        "constraints": {
          "minTimeOnScreen": 60,
          "requiredAttempts": 1,
          "masteryThreshold": 70,
          "prerequisiteScreens": [],
          "maxAttemptsPerScreen": 5,
          "cooldownBetweenAttempts": 10
        },
        "progress": {
          "attempts": 1,
          "bestScore": 85,
          "timeSpent": 120,
          "canProceed": true
        },
        "prerequisiteScreenIds": [],
        "startedAt": "2026-02-02T10:30:00Z",
        "completedAt": "2026-02-02T10:32:00Z"
      },
      {
        "id": "screen_002",
        "sessionId": "sess_abc123",
        "screenType": "guided_practice",
        "state": "active",
        "concept": "Linear Equations",
        "learningObjective": "Practice solving linear equations with guidance",
        "prerequisiteScreenIds": ["screen_001"],
        "startedAt": "2026-02-02T10:32:00Z",
        "completedAt": null
      },
      {
        "id": "screen_003",
        "sessionId": "sess_abc123",
        "screenType": "independent_practice",
        "state": "locked",
        "concept": "Linear Equations",
        "learningObjective": "Solve linear equations independently",
        "prerequisiteScreenIds": ["screen_002"],
        "startedAt": null,
        "completedAt": null
      }
    ]
  },
  "meta": {
    "timestamp": "2026-02-02T10:35:00Z",
    "requestId": "req_abc123"
  }
}
```

---

### 9. Start Lesson Screen

**POST** `/sessions/{sessionId}/screens/{screenId}/start`

Starts a lesson screen. Validates prerequisites and constraints before allowing start.

#### Path Parameters

- `sessionId` (string, required): Session identifier
- `screenId` (string, required): Screen identifier

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "screen": {
      "id": "screen_002",
      "state": "active",
      "startedAt": "2026-02-02T10:32:00Z"
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:32:00Z",
    "requestId": "req_abc123"
  }
}
```

#### Error Codes

- `SCREEN_NOT_FOUND`: Screen ID not found
- `SCREEN_LOCKED`: Screen is locked (prerequisites not met)
- `SCREEN_ALREADY_STARTED`: Screen is already active
- `CONSTRAINT_VIOLATION`: Screen constraints not met (e.g., cooldown period)
- `SESSION_NOT_ACTIVE`: Session is not in active state

---

### 10. Submit Screen Interaction

**POST** `/sessions/{sessionId}/screens/{screenId}/interactions`

Submits a learner interaction within a lesson screen. This is the primary way learners interact with lesson content.

#### Path Parameters

- `sessionId` (string, required): Session identifier
- `screenId` (string, required): Screen identifier

#### Request Body

```json
{
  "interactionType": "answer",
  "content": "I think I need to subtract 5 from both sides first.",
  "metadata": {
    "timeSpent": 45,
    "attemptNumber": 1
  }
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "interaction": {
      "id": "interaction_001",
      "screenId": "screen_002",
      "interactionType": "answer",
      "content": "I think I need to subtract 5 from both sides first.",
      "timestamp": "2026-02-02T10:32:45Z"
    },
    "instructorResponse": {
      "id": "msg_instructor_002",
      "content": "That's a good start! Why do you think subtracting 5 from both sides helps?",
      "messageType": "guidance",
      "teachingMetadata": {
        "isLeadingQuestion": false
      }
    },
    "screenProgress": {
      "attempts": 1,
      "bestScore": 0,
      "timeSpent": 45,
      "canProceed": false
    },
    "constraints": {
      "canSubmitAgain": true,
      "nextSubmissionAllowedAt": "2026-02-02T10:33:00Z",
      "remainingAttempts": 4
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:32:45Z",
    "requestId": "req_abc123"
  }
}
```

#### Error Codes

- `SCREEN_NOT_ACTIVE`: Screen is not currently active
- `RATE_LIMIT_EXCEEDED`: Too many interactions (cooldown period)
- `MAX_ATTEMPTS_REACHED`: Maximum attempts for this screen reached
- `CONSTRAINT_VIOLATION`: Interaction violates screen constraints
- `INVALID_INTERACTION`: Interaction content is invalid

---

### 11. Check Screen Unlock Status

**GET** `/sessions/{sessionId}/screens/{screenId}/unlock-status`

Checks if a screen can be unlocked and why it's locked (if applicable).

#### Path Parameters

- `sessionId` (string, required): Session identifier
- `screenId` (string, required): Screen identifier

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "screenId": "screen_003",
    "canUnlock": false,
    "currentState": "locked",
    "unlockRequirements": {
      "prerequisites": [
        {
          "screenId": "screen_002",
          "screenType": "guided_practice",
          "status": "in_progress",
          "required": "completed"
        }
      ],
      "constraints": {
        "minTimeOnPreviousScreen": 120,
        "timeSpentOnPreviousScreen": 45,
        "met": false
      }
    },
    "estimatedUnlockTime": "2026-02-02T10:34:00Z"
  },
  "meta": {
    "timestamp": "2026-02-02T10:33:00Z",
    "requestId": "req_abc123"
  }
}
```

---

### 12. Get Screen Progress

**GET** `/sessions/{sessionId}/screens/{screenId}/progress`

Retrieves detailed progress information for a specific screen.

#### Path Parameters

- `sessionId` (string, required): Session identifier
- `screenId` (string, required): Screen identifier

#### Response (200 OK)

```json
{
  "success": true,
  "data": {
    "screenId": "screen_002",
    "progress": {
      "attempts": 2,
      "bestScore": 75,
      "timeSpent": 180,
      "conceptsDemonstrated": ["Subtraction property of equality"],
      "misconceptionsAddressed": [],
      "canProceed": false,
      "unlockReason": "Mastery threshold not met (75 < 80)"
    },
    "constraints": {
      "requiredAttempts": 3,
      "masteryThreshold": 80,
      "remainingAttempts": 1
    }
  },
  "meta": {
    "timestamp": "2026-02-02T10:35:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Design Notes

1. **Session-Based**: All message operations require a session ID, ensuring stateful interactions

2. **Screen-Based Architecture**: The system is organized around lesson screens, not just messages. Screens control learning progression and enforce constraints.

3. **Frontend-Backend Co-Design**: APIs support screen-based operations that the frontend uses to control learning flow, visualize progress, and enforce constraints.

4. **Constraint Enforcement**: Constraints are enforced at multiple levels:
   - Frontend: Immediate UI feedback and validation
   - API: Server-side validation before processing
   - Backend: Validation against learner memory and session state

5. **Streaming-Friendly**: SSE support allows real-time response streaming without WebSocket complexity

6. **LLM-Agnostic**: No LLM-specific details in API contracts; abstraction handled internally

7. **Idempotency**: End session and similar operations are idempotent

8. **Pagination**: List endpoints support cursor-based pagination for large datasets

9. **Error Handling**: Consistent error format with codes and details

10. **Metadata**: All responses include request metadata for debugging and tracing
