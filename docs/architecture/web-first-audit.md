# Web-First Design Audit

## Executive Summary

**Verdict**: The architecture has **significant violations** of web-first design principles. While documentation claims "web-based service," the implementation and API design reveal **chat-like assumptions** and **backend-first thinking** that don't align with modern web application patterns.

---

## 1. Frontend as First-Class System

### ✅ What's Good

- Frontend architecture document exists
- Frontend responsibilities clearly defined
- Frontend-backend co-design mentioned
- Frontend domain models defined

### ❌ Violations

#### Violation 1: Backend Returns Strings, Not Structured Data

**Evidence**:
```typescript
// backend/core/SessionOrchestrator.ts:211
async processLearnerMessage(
  sessionId: string,
  learnerMessageContent: string
): Promise<string> {  // ❌ Returns plain string
  // ...
  return rawResponse;  // ❌ Just returns text
}
```

**Problem**: Backend returns a plain string, not structured data. Web apps need:
- Progress updates
- Constraint state
- Navigation state
- Metadata

**Impact**: Frontend must parse strings or make additional API calls to get state.

**Web-First Fix**: Return structured response with all needed state.

---

#### Violation 2: Backend Doesn't Know About Screens

**Evidence**:
```typescript
// backend/core/SessionOrchestrator.ts
// Method signature: processLearnerMessage(sessionId, content)
// No screenId parameter
// No screen context
// No screen state returned
```

**Problem**: Backend processes messages without screen context, even though architecture claims "screen-based."

**Impact**: Frontend must track screen state separately, leading to sync issues.

**Web-First Fix**: Backend methods should accept and return screen context.

---

#### Violation 3: No HTTP Response Structure

**Evidence**:
- `SessionOrchestrator.processLearnerMessage()` returns `Promise<string>`
- No HTTP status codes considered
- No error response structure
- No metadata (requestId, timestamp) in return value

**Problem**: Backend code assumes CLI usage (returns strings), not HTTP responses.

**Impact**: API layer must wrap backend responses, creating unnecessary abstraction.

**Web-First Fix**: Backend should return structured response objects suitable for HTTP.

---

#### Violation 4: Frontend Directory Doesn't Exist

**Evidence**:
- `frontend/` directory doesn't exist
- No frontend code
- Frontend structure only documented

**Problem**: Frontend treated as "future work," not first-class.

**Impact**: Backend designed without frontend constraints, leading to mismatches.

**Web-First Fix**: Frontend and backend should be developed together.

---

## 2. Chat-Like Interaction Assumptions

### ❌ Major Violations

#### Violation 5: "Send Message" API Endpoint

**Evidence**:
```typescript
// api-contracts.md:115
POST /sessions/{sessionId}/messages
{
  "content": "I'm trying to solve 2x + 5 = 13..."
}
```

**Problem**: This is a **chat API**, not a lesson API. Web users don't "send messages"—they:
- Submit answers
- Request hints
- Complete lessons
- Navigate screens

**Impact**: API design assumes chat interface, not structured learning.

**Web-First Fix**: Use lesson-focused APIs (`submitAnswer`, `requestHint`, `completeLesson`).

---

#### Violation 6: Message-Centric Backend Logic

**Evidence**:
```typescript
// backend/core/SessionOrchestrator.ts
async processLearnerMessage(
  sessionId: string,
  learnerMessageContent: string  // ❌ Just message content
): Promise<string>
```

**Problem**: Backend processes "messages," not "interactions" or "answers." This assumes:
- Free-form text input
- Chat-like conversation
- No structured actions

**Impact**: Doesn't support structured lesson interactions (submit answer, request hint).

**Web-First Fix**: Backend should process structured interactions, not free-form messages.

---

#### Violation 7: Message History as Conversation Thread

**Evidence**:
```typescript
// backend/core/SessionOrchestrator.ts:75
const messageHistory = await this.storageAdapter.loadMessages(
  session.messageIds
);
```

**Problem**: Treats interaction history as "messages" (chat-like), not structured interactions within screens.

**Impact**: Can't track screen-specific progress, can't enforce screen constraints.

**Web-First Fix**: Track interactions per screen, not messages per session.

---

#### Violation 8: Response Returns "Message Content"

**Evidence**:
```typescript
// backend/core/SessionOrchestrator.ts:211
return rawResponse;  // ❌ Just returns instructor message text
```

**Problem**: Returns instructor response as plain text, like a chat bot. Web apps need:
- Progress updates
- Constraint state
- Navigation state
- Screen unlock status

**Impact**: Frontend must make separate API calls to get state updates.

**Web-First Fix**: Return structured response with all needed state.

---

#### Violation 9: User Flow Describes "Question & Feedback Loop"

**Evidence**:
```markdown
# user-flow.md:229
Question & Feedback Loop:
1. Learner submits attempt
   ↓
2. Instructor provides guidance (SSE stream)
   ↓
3. Learner revises and resubmits
```

**Problem**: Describes chat-like back-and-forth, not structured lesson progression.

**Impact**: Flow assumes free-form conversation, not structured learning.

**Web-First Fix**: Describe structured lesson flow, not chat loops.

---

## 3. CLI/Backend Assumptions Leaking into UX

### ❌ Major Violations

#### Violation 10: Backend Method Signature Assumes CLI

**Evidence**:
```typescript
// backend/core/SessionOrchestrator.ts:47
async processLearnerMessage(
  sessionId: string,
  learnerMessageContent: string  // ❌ Just string input
): Promise<string>  // ❌ Just string output
```

**Problem**: This signature assumes:
- CLI tool (string in, string out)
- No HTTP context
- No request metadata
- No response metadata

**Impact**: API layer must wrap this for HTTP, creating unnecessary abstraction.

**Web-First Fix**: Backend should accept HTTP request context, return HTTP response structure.

---

#### Violation 11: No Request Context

**Evidence**:
- Backend methods don't accept request metadata
- No user agent, IP, or browser info
- No request ID for tracing
- No authentication context

**Problem**: Backend designed as library, not web service.

**Impact**: Can't implement web-specific features (rate limiting per IP, browser detection, tracing).

**Web-First Fix**: Backend should accept request context object.

---

#### Violation 12: Error Handling Assumes CLI

**Evidence**:
```typescript
// backend/core/SessionOrchestrator.ts:55
throw new Error(`Session not found: ${sessionId}`);
```

**Problem**: Throws generic errors, not HTTP-aware errors. Web apps need:
- HTTP status codes
- Error codes for frontend handling
- User-friendly messages
- Error metadata

**Impact**: API layer must catch and convert errors, creating unnecessary abstraction.

**Web-First Fix**: Backend should throw HTTP-aware errors with status codes.

---

#### Violation 13: No Streaming Support in Backend

**Evidence**:
```typescript
// backend/core/SessionOrchestrator.ts:114
const llmResponse = await this.llmAdapter.generate({
  prompt: fullPrompt,
});
rawResponse = llmResponse.content;  // ❌ Waits for complete response
```

**Problem**: Backend waits for complete LLM response before returning. Web apps need streaming for:
- Better perceived performance
- Progressive rendering
- Real-time feedback

**Impact**: Frontend must wait for complete response, poor UX.

**Web-First Fix**: Backend should support streaming responses.

---

#### Violation 14: File System Assumptions

**Evidence**:
```typescript
// backend/core/PromptAssembler.ts:20
constructor(promptConfigPath: string = 'config/prompts') {
  this.promptConfigPath = promptConfigPath;
}

private async loadPromptFile(filePath: string): Promise<string> {
  // TODO: Read file from config/prompts/ directory
}
```

**Problem**: Assumes file system access. Web services should:
- Load config from environment variables
- Use configuration service
- Support hot-reloading
- Not depend on file paths

**Impact**: Hard to deploy in containerized environments, can't hot-reload config.

**Web-First Fix**: Use configuration service, not file system.

---

#### Violation 15: Synchronous Processing Assumption

**Evidence**:
```typescript
// backend/core/SessionOrchestrator.ts
// All processing is synchronous
// No async job queue
// No background processing
```

**Problem**: Assumes request waits for all processing. Web apps need:
- Async job processing
- Background tasks
- Queue for heavy operations
- Non-blocking responses

**Impact**: Long-running operations block HTTP requests, poor scalability.

**Web-First Fix**: Use async job queue for heavy operations.

---

## 4. Missing Web-Specific Considerations

### ❌ Critical Missing Pieces

#### Violation 16: No CORS Configuration

**Evidence**: No CORS mentioned anywhere in architecture.

**Problem**: Web apps need CORS headers for cross-origin requests.

**Impact**: Frontend can't make API calls from browser.

**Web-First Fix**: Design CORS strategy, configure headers.

---

#### Violation 17: No Cookie/Session Management

**Evidence**: Authentication mentions "Bearer token" but no session management.

**Problem**: Web apps need:
- Cookie-based sessions
- CSRF protection
- Session expiration
- Refresh tokens

**Impact**: Security vulnerabilities, poor UX (no "remember me").

**Web-First Fix**: Design session management strategy.

---

#### Violation 18: No Browser State Management

**Evidence**: No consideration for:
- Browser back/forward buttons
- Page refresh
- Tab closing
- Browser history

**Problem**: Web apps must handle browser navigation.

**Impact**: Poor UX (lose state on refresh, broken back button).

**Web-First Fix**: Design browser state management (URL state, history API).

---

#### Violation 19: No Offline Support

**Evidence**: No offline strategy mentioned.

**Problem**: Web apps should work offline:
- Service workers
- Local storage
- Offline queue
- Sync on reconnect

**Impact**: Poor UX (can't use offline, lose work).

**Web-First Fix**: Design offline-first strategy.

---

#### Violation 20: No Loading States

**Evidence**: Backend doesn't return loading/progress state.

**Problem**: Web apps need loading indicators for:
- Long-running operations
- Progress tracking
- User feedback

**Impact**: Poor UX (no feedback during long operations).

**Web-First Fix**: Return progress state in responses.

---

#### Violation 21: No Error Recovery

**Evidence**: Errors just throw, no recovery strategy.

**Problem**: Web apps need:
- Retry logic
- Error boundaries
- Graceful degradation
- User-friendly error messages

**Impact**: Poor UX (errors crash app, no recovery).

**Web-First Fix**: Design error recovery strategy.

---

#### Violation 22: No Rate Limiting Per User

**Evidence**: Rate limiting mentioned but not designed per user/IP.

**Problem**: Web apps need rate limiting:
- Per user (prevent abuse)
- Per IP (prevent DDoS)
- Per endpoint (different limits)
- With clear error messages

**Impact**: Security vulnerabilities, poor abuse prevention.

**Web-First Fix**: Design rate limiting strategy.

---

#### Violation 23: No Pagination

**Evidence**: API contracts don't mention pagination for lists.

**Problem**: Web apps need pagination for:
- Message history
- Session lists
- Screen lists
- Large datasets

**Impact**: Poor performance (loading all data at once).

**Web-First Fix**: Design pagination strategy.

---

#### Violation 24: No Caching Strategy

**Evidence**: No caching mentioned.

**Problem**: Web apps need caching for:
- Static assets
- API responses
- Session data
- Progress data

**Impact**: Poor performance (repeated API calls).

**Web-First Fix**: Design caching strategy.

---

#### Violation 25: No WebSocket/SSE Connection Management

**Evidence**: SSE mentioned but no connection management strategy.

**Problem**: Web apps need:
- Connection pooling
- Reconnection logic
- Heartbeat/ping
- Connection state tracking

**Impact**: Poor reliability (connections drop, no recovery).

**Web-First Fix**: Design SSE connection management.

---

## 5. API Design Violations

### ❌ Chat-Like API Patterns

#### Violation 26: Message Endpoints Exist

**Evidence**:
```typescript
// api-contracts.md
POST /sessions/{sessionId}/messages  // ❌ Chat endpoint
GET /sessions/{sessionId}/messages    // ❌ Chat endpoint
```

**Problem**: These are chat APIs, not lesson APIs. Should be:
- `POST /lessons/{screenId}/submit`
- `POST /lessons/{screenId}/hint`
- `POST /lessons/{screenId}/complete`

**Impact**: API design doesn't match claimed "screen-based" architecture.

---

#### Violation 27: Two Conflicting API Designs

**Evidence**:
- `api-contracts.md`: Message-based (chat-like)
- `api-contracts-lesson-focused.md`: Lesson-focused (screen-based)

**Problem**: Two different API designs, no decision on which to use.

**Impact**: Confusion, inconsistent implementation.

---

#### Violation 28: API Returns Full Message Objects

**Evidence**:
```json
// api-contracts.md:140
{
  "learnerMessage": { /* full message object */ },
  "instructorMessage": { /* full message object */ }
}
```

**Problem**: Returns full message objects (chat-like), not structured lesson state.

**Impact**: Frontend must extract needed data from message objects.

**Web-First Fix**: Return structured lesson state, not message objects.

---

## Summary: Web-First Violations

### Critical Violations (Must Fix)

1. **Backend returns strings** (Violation 1, 8)
2. **Chat-like API endpoints** (Violation 5, 26)
3. **Message-centric backend logic** (Violation 6, 7)
4. **No HTTP response structure** (Violation 3)
5. **No CORS configuration** (Violation 16)
6. **No session management** (Violation 17)
7. **No browser state management** (Violation 18)
8. **No streaming support** (Violation 13)

### High Priority Violations

9. **Backend doesn't know about screens** (Violation 2)
10. **CLI-like method signatures** (Violation 10)
11. **No request context** (Violation 11)
12. **No error recovery** (Violation 21)
13. **No rate limiting per user** (Violation 22)
14. **No pagination** (Violation 23)

### Medium Priority Violations

15. **File system assumptions** (Violation 14)
16. **Synchronous processing** (Violation 15)
17. **No offline support** (Violation 19)
18. **No loading states** (Violation 20)
19. **No caching strategy** (Violation 24)
20. **No SSE connection management** (Violation 25)

---

## Recommendations

### Immediate Fixes

1. **Remove chat APIs**: Delete `POST /sessions/{id}/messages`, use lesson-focused APIs
2. **Fix backend signatures**: Return structured responses, not strings
3. **Add screen context**: Backend methods should accept/return screen state
4. **Design CORS strategy**: Configure CORS headers
5. **Design session management**: Cookie-based sessions, CSRF protection

### Architecture Changes

1. **Unify API design**: Choose one API contract (lesson-focused)
2. **Add HTTP layer**: Backend should return HTTP-aware responses
3. **Add request context**: Backend should accept request metadata
4. **Add streaming support**: Backend should support SSE streaming
5. **Add browser state**: Design URL state, history API usage

### Missing Web Features

1. **Error handling**: User-friendly errors, retry logic
2. **Rate limiting**: Per user/IP, with clear messages
3. **Pagination**: For all list endpoints
4. **Caching**: For static assets, API responses
5. **Offline support**: Service workers, local storage

---

## Conclusion

**The architecture claims "web-based service" but violates fundamental web-first principles:**

- ❌ Backend designed as CLI tool (string in/out)
- ❌ Chat-like APIs instead of lesson-focused
- ❌ No web-specific considerations (CORS, sessions, browser state)
- ❌ Missing critical web features (pagination, caching, offline)

**The architecture needs significant refactoring to truly support a web-based service.**
