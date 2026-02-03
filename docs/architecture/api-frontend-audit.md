# API Contracts Frontend Audit

## Executive Summary

**Critical Finding**: API contracts have **fundamental misalignments** with lesson-based UX, **leak AI internals** through metadata fields, and have **unstable response formats** that will cause frontend hacks. Two conflicting API designs exist, creating confusion and requiring frontend workarounds.

---

## 1. APIs Alignment with Lesson-Based UX

### Problem: Two Conflicting API Designs

**Design 1: Chat-Based** (`api-contracts.md`):
```
POST /sessions/{sessionId}/messages
{
  "content": "I'm trying to solve 2x + 5 = 13..."
}
```

**Design 2: Lesson-Based** (`api-contracts-lesson-focused.md`):
```
POST /lessons/start
POST /lessons/{screenId}/submit
POST /lessons/{screenId}/hint
POST /lessons/{screenId}/complete
```

**Impact**: Frontend doesn't know which API to use. Two different patterns require different implementations.

---

### Misalignment 1: Chat API Doesn't Match Lesson Flow

**Chat API** (`api-contracts.md:115`):
```json
POST /sessions/{sessionId}/messages
{
  "content": "I'm trying to solve 2x + 5 = 13..."
}
```

**Lesson Flow** (`user-flow.md:Step 10`):
```
Step 10: Guided Practice Screen
- User reads problem
- User submits answer (structured action)
- Instructor provides guidance
- User revises and resubmits
```

**Problem**: Chat API is generic "send message", but lesson flow needs structured "submit answer" action.

**Frontend Hack Required**: Frontend must:
- Wrap lesson actions in generic message format
- Parse responses to extract lesson-specific data
- Track screen state separately
- Implement lesson logic on top of chat API

---

### Misalignment 2: No Screen Context in Chat API

**Chat API Response** (`api-contracts.md:152`):
```json
{
  "instructorMessage": {
    "content": "...",
    "messageType": "guidance"
  }
}
```

**Lesson API Response** (`api-contracts-lesson-focused.md:268`):
```json
{
  "feedback": {
    "content": "...",
    "type": "guidance"
  },
  "progress": {
    "attempts": 1,
    "masteryScore": 40,
    "canProceed": false
  },
  "constraints": {
    "canSubmitAgain": true,
    "nextSubmissionAllowedAt": "...",
    "remainingAttempts": 4
  }
}
```

**Problem**: Chat API doesn't return screen context, progress, or constraints needed for lesson UX.

**Frontend Hack Required**: Frontend must:
- Make separate API calls to get progress
- Track constraints client-side
- Poll for state updates
- Reconstruct lesson state from messages

---

### Misalignment 3: No Structured Actions

**Chat API**: Generic "send message"

**Lesson Flow Needs**:
- Submit answer
- Request hint
- Complete lesson
- Start screen

**Problem**: Chat API forces all actions into generic message format.

**Frontend Hack Required**: Frontend must:
- Encode action type in message content
- Parse action type from responses
- Handle different action types differently
- Maintain action state separately

---

### Misalignment 4: No Progression Control

**Chat API**: Returns messages, no progression info

**Lesson Flow Needs**:
- Can proceed to next screen?
- What are unlock requirements?
- What's the mastery score?
- What's the next screen?

**Problem**: Chat API doesn't provide progression data.

**Frontend Hack Required**: Frontend must:
- Call separate endpoints for progression
- Track progression client-side
- Guess when to unlock next screen
- Implement progression logic in frontend

---

## 2. Endpoints That Leak AI Internals

### Leak 1: `teachingMetadata` Exposes Internal Tracking

**API Response** (`api-contracts.md:159`):
```json
{
  "instructorMessage": {
    "teachingMetadata": {
      "isLeadingQuestion": false,
      "revealedInformation": [],
      "learnerStruggleLevel": "moderate",
      "correctionNeeded": false,
      "conceptIntroduced": "Linear equations",
      "misconceptionAddressed": null
    }
  }
}
```

**Problem**: Exposes internal prompt engineering and tracking logic.

**Why It's a Leak**:
- `isLeadingQuestion`: Internal validation flag
- `revealedInformation`: Tracks what concepts were directly stated (for prompt engineering)
- `learnerStruggleLevel`: Internal assessment
- `correctionNeeded`: Internal teaching logic flag

**Frontend Impact**: 
- Frontend doesn't need this data
- Exposes system internals
- Creates coupling to internal logic
- Makes API harder to evolve

**Frontend Hack**: Frontend must ignore these fields or use them for UI hacks.

---

### Leak 2: `revealedInformation` Exposes Prompt Engineering

**API Response** (`api-contracts-lesson-focused.md:272`):
```json
{
  "feedback": {
    "revealedInformation": []
  }
}
```

**Problem**: Tracks what concepts were directly stated, which is internal prompt engineering concern.

**Why It's a Leak**:
- Used internally to prevent giving direct answers
- Exposes teaching rule enforcement logic
- Not needed for frontend UX
- Creates coupling to internal validation

**Frontend Impact**: Frontend must handle this field even though it's not needed.

---

### Leak 3: `messageType` Classification Exposes Internal Logic

**API Response** (`api-contracts.md:157`):
```json
{
  "instructorMessage": {
    "messageType": "guidance"
  }
}
```

**Problem**: Exposes internal message classification logic.

**Why It's a Leak**:
- Used internally for prompt assembly
- Exposes how backend classifies messages
- Frontend doesn't need to know classification
- Creates coupling to internal logic

**Frontend Impact**: Frontend must handle different message types, creating complexity.

**Better Design**: Frontend should only care about `type: 'guidance' | 'correction' | 'encouragement' | 'hint'` (user-facing), not internal `messageType`.

---

### Leak 4: `memoryUpdates` Exposes Internal Memory Logic

**API Response** (`api-contracts-lesson-focused.md:567`):
```json
{
  "memoryUpdates": {
    "conceptsIntroduced": [],
    "conceptsPracticed": ["Linear equations"],
    "conceptsMastered": ["Subtraction property of equality"],
    "progressMarkers": ["Can solve single-variable linear equations"]
  }
}
```

**Problem**: Exposes internal learner memory updates.

**Why It's a Leak**:
- Internal memory management concern
- Frontend doesn't need to know what was updated
- Creates coupling to internal memory structure
- Makes API harder to evolve

**Frontend Impact**: Frontend must handle memory update structure even though it's not needed for UX.

**Better Design**: Return user-facing summary: `"whatYouLearned"`, `"keyTakeaways"`, `"nextSteps"`.

---

### Leak 5: Error Code `VALIDATION_FAILED` Exposes Internal Validation

**Error Response** (`api-contracts.md:221`):
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Instructor response failed validation (retry automatically)"
  }
}
```

**Problem**: Exposes that backend validates instructor responses.

**Why It's a Leak**:
- Internal validation concern
- Frontend doesn't need to know validation failed
- Exposes that instructor is AI-generated
- Creates coupling to internal validation logic

**Frontend Impact**: Frontend must handle validation failures, exposing AI internals to users.

**Better Design**: Return generic `"PROCESSING_ERROR"` or `"RETRY_REQUIRED"` without exposing validation.

---

## 3. Response Format Stability and Predictability

### Problem 1: Inconsistent Response Structures

**Chat API Response** (`api-contracts.md:140`):
```json
{
  "data": {
    "learnerMessage": { ... },
    "instructorMessage": { ... },
    "session": { ... }
  }
}
```

**Lesson API Response** (`api-contracts-lesson-focused.md:94`):
```json
{
  "data": {
    "lesson": { ... },
    "progress": { ... },
    "navigation": { ... }
  }
}
```

**Problem**: Different endpoints return different structures, making frontend parsing unpredictable.

**Frontend Hack**: Frontend must:
- Handle different response shapes
- Type-check response structure
- Maintain separate parsers for each endpoint
- Handle missing fields gracefully

---

### Problem 2: Optional Fields Create Uncertainty

**Response** (`api-contracts-lesson-focused.md:268`):
```json
{
  "feedback": {
    "isCorrect": null,  // ❌ Can be null, true, or false
    "revealedInformation": []  // ❌ Optional, might be missing
  }
}
```

**Problem**: Optional fields make frontend code defensive and complex.

**Frontend Hack**: Frontend must:
- Check for null/undefined everywhere
- Provide default values
- Handle missing fields
- Type guard all optional fields

**Better Design**: Always return fields with consistent types, use `null` only when semantically meaningful.

---

### Problem 3: SSE Event Formats Inconsistent

**Chat API SSE** (`api-contracts.md:184`):
```
event: message_start
data: {"messageId": "...", "sessionId": "..."}

event: content_chunk
data: {"chunk": "..."}

event: message_complete
data: {"messageId": "...", "content": "...", "messageType": "..."}
```

**Lesson API SSE** (`api-contracts-lesson-focused.md:300`):
```
event: interaction_started
data: {"interactionId": "...", "screenId": "..."}

event: feedback_chunk
data: {"chunk": "..."}

event: feedback_complete
data: {"interactionId": "...", "feedback": {...}}
```

**Problem**: Different event names and data structures for similar concepts.

**Frontend Hack**: Frontend must:
- Handle two different SSE formats
- Map between event types
- Parse different data structures
- Maintain separate SSE handlers

---

### Problem 4: No Response Versioning

**Problem**: No API version in responses, making evolution risky.

**Missing**:
- No `apiVersion` field
- No versioning strategy
- No deprecation warnings
- No migration path

**Frontend Impact**: 
- Breaking changes break frontend
- No way to detect API changes
- Must handle all versions simultaneously
- Can't plan migrations

---

### Problem 5: Error Format Inconsistency

**Chat API Error** (`api-contracts.md:32`):
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "...",
    "details": { ... }
  }
}
```

**Lesson API Error** (`api-contracts-lesson-focused.md:44`):
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "...",
    "details": { ... }
  }
}
```

**Problem**: Same format, but error codes differ between APIs.

**Frontend Hack**: Frontend must:
- Handle different error code sets
- Map error codes to user messages
- Handle unknown error codes
- Maintain error code mappings

---

## 4. APIs That Cause Frontend Hacks

### Hack 1: Client-Tracked Fields Can Be Manipulated

**Request** (`api-contracts-lesson-focused.md:227`):
```json
{
  "answer": "...",
  "attemptNumber": 1,  // ❌ CLIENT-TRACKED
  "timeSpent": 45,     // ❌ CLIENT-TRACKED
  "clientTimestamp": "2026-02-02T10:32:45Z"  // ❌ CLIENT-TRACKED
}
```

**Problem**: Frontend can manipulate these fields to bypass constraints.

**Frontend Hack**: Frontend must:
- Trust client-tracked values (risky)
- Or ignore them and track server-side (redundant)
- Or validate client values (defensive)

**Better Design**: Backend should track these, frontend sends only user input.

---

### Hack 2: No Idempotency Keys

**Request**: No idempotency key in any endpoint

**Problem**: Duplicate requests can cause:
- Double submissions
- Duplicate progress updates
- Race conditions
- Inconsistent state

**Frontend Hack**: Frontend must:
- Prevent duplicate submissions manually
- Track pending requests
- Handle retries carefully
- Implement request deduplication

**Better Design**: Add `idempotencyKey` to all mutation endpoints.

---

### Hack 3: No Request IDs for Correlation

**Problem**: No request ID in requests, only in responses.

**Frontend Hack**: Frontend must:
- Generate request IDs client-side
- Correlate requests/responses manually
- Handle out-of-order responses
- Track request state separately

**Better Design**: Allow frontend to send `requestId` in requests for correlation.

---

### Hack 4: Inconsistent Pagination

**Chat API** (`api-contracts.md:238`):
```
?limit=50&before=msg_123&after=msg_456
```

**Lesson API**: No pagination mentioned

**Problem**: Different pagination strategies, some endpoints have none.

**Frontend Hack**: Frontend must:
- Handle different pagination formats
- Implement pagination logic per endpoint
- Handle endpoints without pagination
- Manage pagination state separately

---

### Hack 5: No Caching Headers

**Problem**: No `ETag`, `Last-Modified`, or `Cache-Control` headers mentioned.

**Frontend Hack**: Frontend must:
- Implement custom caching logic
- Poll for updates manually
- Handle stale data
- No way to optimize requests

**Better Design**: Add HTTP caching headers for GET endpoints.

---

### Hack 6: No Partial Updates

**Problem**: Must send full objects, no PATCH support.

**Frontend Hack**: Frontend must:
- Send full objects every time
- Track previous state
- Merge updates manually
- Handle conflicts

**Better Design**: Support PATCH for partial updates.

---

### Hack 7: No Batch Operations

**Problem**: Must make individual API calls for multiple operations.

**Frontend Hack**: Frontend must:
- Make multiple sequential requests
- Handle partial failures
- Implement batching logic
- Manage request queues

**Better Design**: Support batch endpoints for common operations.

---

### Hack 8: SSE Reconnection Doesn't Restore State

**Problem**: SSE reconnects but doesn't restore session state.

**Frontend Hack**: Frontend must:
- Poll for state after reconnection
- Restore state manually
- Handle state conflicts
- Implement state sync logic

**Better Design**: SSE reconnection should include state restoration.

---

## Top 5 APIs That Cause Frontend Hacks

### 1. **POST /sessions/{sessionId}/messages** (Chat API)

**Why It's a Hack**:
- Generic "send message" doesn't match lesson flow
- No screen context in response
- No progression data
- Forces frontend to implement lesson logic

**Frontend Hacks Required**:
- Wrap lesson actions in message format
- Parse responses to extract lesson data
- Track screen state separately
- Make separate calls for progress

**Severity**: **CRITICAL** (fundamental misalignment)

---

### 2. **POST /lessons/{screenId}/submit** (Client-Tracked Fields)

**Why It's a Hack**:
- `attemptNumber`, `timeSpent`, `clientTimestamp` are client-tracked
- Frontend can manipulate these to bypass constraints
- Backend must trust client values (risky)

**Frontend Hacks Required**:
- Trust client values (security risk)
- Or ignore and track server-side (redundant)
- Or validate client values (defensive)

**Severity**: **HIGH** (security risk, constraint bypass)

---

### 3. **GET /sessions/{sessionId}/messages** (No Screen Context)

**Why It's a Hack**:
- Returns messages but no screen context
- Frontend must reconstruct lesson state from messages
- No progression or constraint data

**Frontend Hacks Required**:
- Parse messages to extract screen state
- Call separate endpoints for progress
- Track constraints client-side
- Implement state reconstruction logic

**Severity**: **HIGH** (requires complex frontend logic)

---

### 4. **All Endpoints** (No Idempotency)

**Why It's a Hack**:
- No idempotency keys
- Duplicate requests cause double submissions
- Race conditions possible

**Frontend Hacks Required**:
- Generate idempotency keys client-side
- Track pending requests
- Prevent duplicate submissions
- Handle retries carefully

**Severity**: **MEDIUM** (causes bugs, not security)

---

### 5. **SSE Streaming** (No State Restoration)

**Why It's a Hack**:
- SSE reconnects but doesn't restore state
- Frontend must poll for state after reconnection
- State can be stale or inconsistent

**Frontend Hacks Required**:
- Poll for state after reconnection
- Restore state manually
- Handle state conflicts
- Implement state sync logic

**Severity**: **MEDIUM** (poor UX, state issues)

---

## Summary: Critical Issues

### 1. API Alignment: ❌ **MISALIGNED**
- Two conflicting API designs (chat vs lesson)
- Chat API doesn't match lesson flow
- No screen context in chat API
- No structured actions

### 2. AI Internals Leakage: ❌ **EXPOSES INTERNALS**
- `teachingMetadata` exposes internal tracking
- `revealedInformation` exposes prompt engineering
- `messageType` exposes classification logic
- `memoryUpdates` exposes memory structure
- `VALIDATION_FAILED` exposes validation logic

### 3. Response Format Stability: ❌ **UNSTABLE**
- Inconsistent response structures
- Optional fields create uncertainty
- SSE event formats inconsistent
- No response versioning
- Error format inconsistency

### 4. Frontend Hacks Required: ❌ **MANY HACKS NEEDED**
- Client-tracked fields can be manipulated
- No idempotency keys
- No request IDs for correlation
- Inconsistent pagination
- No caching headers
- No partial updates
- No batch operations
- SSE doesn't restore state

---

## Recommendations

### Immediate Fixes (Critical)

1. **Choose One API Design**:
   - Remove chat API (`/sessions/{id}/messages`)
   - Use lesson-focused APIs only
   - Align all endpoints with lesson flow

2. **Remove AI Internals**:
   - Remove `teachingMetadata` from responses
   - Remove `revealedInformation` (internal only)
   - Remove `messageType` (use user-facing `type`)
   - Remove `memoryUpdates` (return user-facing summary)
   - Change `VALIDATION_FAILED` to generic error

3. **Standardize Response Formats**:
   - Consistent structure across endpoints
   - Always return required fields (no optional)
   - Standardize SSE event formats
   - Add API versioning

### Short-term (High Priority)

4. **Fix Client-Tracked Fields**:
   - Backend tracks `attemptNumber`, `timeSpent`
   - Frontend sends only user input
   - Backend validates and returns authoritative values

5. **Add Idempotency**:
   - Add `idempotencyKey` to all mutation endpoints
   - Return same response for duplicate keys
   - Document idempotency behavior

6. **Add Request Correlation**:
   - Allow `requestId` in requests
   - Return `requestId` in responses
   - Enable request/response correlation

### Long-term (Medium Priority)

7. **Add Caching**:
   - Add `ETag` headers for GET endpoints
   - Add `Cache-Control` headers
   - Support conditional requests

8. **Add Partial Updates**:
   - Support PATCH for partial updates
   - Reduce payload size
   - Enable optimistic updates

9. **Add Batch Operations**:
   - Support batch endpoints
   - Reduce request count
   - Improve performance

---

## Conclusion

**API contracts have fundamental issues:**

- ❌ **Misaligned**: Chat API doesn't match lesson flow
- ❌ **Leaks internals**: Exposes AI implementation details
- ❌ **Unstable**: Inconsistent formats, no versioning
- ❌ **Requires hacks**: Many frontend workarounds needed

**Critical actions needed**:
1. Remove chat API, use lesson-focused APIs only
2. Remove AI internals from responses
3. Standardize response formats
4. Fix client-tracked fields (backend tracks)
5. Add idempotency and request correlation
