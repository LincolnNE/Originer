# Frontend vs Backend Responsibility Audit

## Overview

**Purpose**: Define clear ownership boundaries between frontend and backend for key system responsibilities.

**Principle**: Frontend provides UX and immediate feedback, backend provides authoritative validation and security.

---

## Responsibility Matrix

| Responsibility | Frontend Ownership | Backend Ownership | Rationale |
|---------------|-------------------|-------------------|-----------|
| **Lesson Pacing** | **UI Flow Control** | **Authoritative Validation** | Frontend controls navigation UX (disable buttons, show warnings). Backend validates prerequisites/mastery before allowing progression. Frontend cannot bypass backend validation. |
| **Input Validation** | **Client-Side UX Validation** | **Authoritative Business Validation** | Frontend validates format/length/required fields for immediate feedback. Backend validates business rules, security, and data integrity. Backend is final authority. |
| **Session Resumption** | **UI State Restoration** | **Authoritative Session State** | Frontend restores UI state (screen ID, draft answers) from localStorage. Backend provides authoritative session state (progress, constraints, screen unlock status). Frontend syncs with backend on load. |
| **Error Recovery** | **User-Facing Error Handling** | **Error Response & Retry Logic** | Frontend shows user-friendly errors, provides retry UI, handles network errors. Backend returns structured error responses, handles retries for external services (LLM), provides error context. |
| **Rate Limiting User Actions** | **UI Blocking & Prevention** | **Authoritative Enforcement** | Frontend blocks UI actions, shows countdown timers, prevents excessive requests. Backend enforces rate limits authoritatively, returns 429 errors, tracks request counts. Backend cannot be bypassed. |

---

## Detailed Responsibility Breakdown

### 1. Lesson Pacing

#### Frontend Responsibilities

**Owns**:
- UI navigation controls (disable "Next" button, show unlock requirements)
- Navigation state management (current screen ID, available screens list)
- Visual feedback (progress bars, unlock indicators)
- Optimistic navigation prevention (block before API call)

**Does**:
- Disables "Next" button when screen locked
- Shows unlock requirements ("Complete 2 more attempts to unlock")
- Prevents navigation to locked screens (URL manipulation protection)
- Updates UI when backend confirms unlock

**Does NOT**:
- Make final decision on screen unlock (backend is authoritative)
- Bypass backend validation (always calls API before navigation)
- Cache unlock status indefinitely (syncs with backend)

**Rationale**: Frontend provides immediate UX feedback and prevents invalid navigation attempts. User cannot proceed without backend validation.

---

#### Backend Responsibilities

**Owns**:
- Authoritative screen unlock status
- Prerequisite validation (screens that must be completed)
- Mastery threshold validation (score required to proceed)
- Screen completion state

**Does**:
- Validates prerequisites on navigation requests
- Checks mastery thresholds before unlocking next screen
- Returns unlock status in API responses
- Persists screen completion state

**Does NOT**:
- Control UI rendering (frontend decides what to show)
- Enforce UI-level blocking (frontend handles that)

**Rationale**: Backend is the source of truth for learning progress. Prevents cheating and ensures pedagogical integrity.

---

#### Co-Design Pattern

```
User clicks "Next" button
  ↓
Frontend: Check local unlock status (optimistic)
  ↓
Frontend: If locked, show requirements, block navigation
Frontend: If unlocked (optimistic), call API
  ↓
Backend: Validate prerequisites, mastery, constraints
  ↓
Backend: Return unlock status (authoritative)
  ↓
Frontend: If backend says locked, update UI, show requirements
Frontend: If backend says unlocked, navigate to next screen
```

**Key Point**: Frontend can optimistically show unlock status, but backend validation is always required before actual navigation.

---

### 2. Input Validation

#### Frontend Responsibilities

**Owns**:
- Client-side format validation (length, pattern, required fields)
- Real-time validation feedback (inline errors as user types)
- Input state management (enabled/disabled, validation errors)
- UX validation (prevent submission of obviously invalid input)

**Does**:
- Validates answer length (min/max characters)
- Validates required fields (not empty)
- Validates format (regex patterns, if applicable)
- Shows validation errors immediately
- Disables submit button if input invalid

**Does NOT**:
- Enforce business rules (backend does this)
- Validate against learning constraints (backend does this)
- Make final decision on validity (backend is authoritative)

**Rationale**: Frontend provides immediate feedback for better UX. Prevents unnecessary API calls for obviously invalid input.

---

#### Backend Responsibilities

**Owns**:
- Authoritative input validation
- Business rule validation (learning-specific rules)
- Security validation (prompt injection prevention, sanitization)
- Data integrity validation (type checking, schema validation)

**Does**:
- Validates input format (re-validates even if frontend validated)
- Validates business rules (answer relevance, learning constraints)
- Validates security (prompt injection detection, malicious input)
- Returns validation errors with specific codes

**Does NOT**:
- Provide real-time validation (frontend handles that)
- Control UI error display (frontend formats errors for UX)

**Rationale**: Backend is the security boundary. All input must be validated server-side, regardless of frontend validation.

---

#### Co-Design Pattern

```
User types answer
  ↓
Frontend: Real-time validation (format, length, required)
  ↓
Frontend: Show inline errors if invalid, disable submit button
  ↓
User clicks "Submit"
  ↓
Frontend: Re-validate client-side (double-check)
  ↓
Frontend: If invalid, show error, prevent API call
Frontend: If valid, call API
  ↓
Backend: Validate format, business rules, security
  ↓
Backend: If invalid, return 422 with error details
Backend: If valid, process answer
  ↓
Frontend: If backend error, show error message
Frontend: If success, proceed with submission
```

**Key Point**: Frontend validation is for UX, backend validation is for security and correctness. Backend always validates, even if frontend already did.

---

### 3. Session Resumption

#### Frontend Responsibilities

**Owns**:
- UI state restoration (screen ID, draft answers, UI state)
- Local storage management (localStorage/sessionStorage)
- Optimistic state loading (show UI immediately, sync with backend)
- UI state persistence (preserve UI state across refreshes)

**Does**:
- Restores screen ID from localStorage on page load
- Restores draft answers (if user was typing)
- Restores UI state (which screen was visible)
- Calls backend API to sync authoritative state
- Reconciles local state with backend state

**Does NOT**:
- Store authoritative progress (backend owns this)
- Store constraints (backend owns this)
- Store instructor responses (backend owns this)
- Make decisions based solely on local state (always syncs with backend)

**Rationale**: Frontend provides seamless UX by restoring UI state immediately. User sees familiar state while backend state loads.

---

#### Backend Responsibilities

**Owns**:
- Authoritative session state (session ID, status, metadata)
- Authoritative screen state (screen completion, unlock status)
- Authoritative progress (attempts, mastery scores, time spent)
- Authoritative constraints (rate limits, cooldowns, max attempts)
- Session persistence (database/storage)

**Does**:
- Loads session from storage on API calls
- Returns current session state in API responses
- Validates session exists and is active
- Returns screen unlock status
- Returns progress and constraints

**Does NOT**:
- Restore UI state (frontend handles that)
- Manage localStorage (frontend handles that)
- Cache session state indefinitely (stateless HTTP, loads on each request)

**Rationale**: Backend is the source of truth. All learning state must be loaded from backend, not trusted from frontend.

---

#### Co-Design Pattern

```
User refreshes page
  ↓
Frontend: Load screen ID from localStorage
Frontend: Load draft answer from localStorage (if exists)
Frontend: Show UI immediately (optimistic)
  ↓
Frontend: Call GET /api/v1/sessions/:sessionId
  ↓
Backend: Load session from storage
Backend: Return authoritative state (progress, constraints, unlock status)
  ↓
Frontend: Reconcile local state with backend state
  ↓
Frontend: If backend says different screen, navigate to correct screen
Frontend: If backend says screen locked, update UI, show requirements
Frontend: If backend progress differs, update progress display
Frontend: If draft answer conflicts, show backend's last submitted answer
```

**Key Point**: Frontend restores UI for immediate UX, but backend state always wins. Frontend reconciles and updates UI based on backend response.

---

### 4. Error Recovery

#### Frontend Responsibilities

**Owns**:
- User-facing error messages (formatted for UX)
- Error UI (error banners, retry buttons, error states)
- Network error handling (offline detection, retry UI)
- Optimistic update rollback (revert UI on error)
- Error state management (error state in state machine)

**Does**:
- Shows user-friendly error messages ("Something went wrong, please try again")
- Provides retry buttons for recoverable errors
- Handles network errors (offline, timeout, connection refused)
- Rolls back optimistic updates on error
- Transitions to ERROR state in state machine

**Does NOT**:
- Retry external service calls (backend handles LLM retries)
- Make decisions about error severity (backend provides error codes)
- Cache error responses indefinitely (errors are transient)

**Rationale**: Frontend provides user-friendly error handling and recovery options. User should understand what went wrong and how to fix it.

---

#### Backend Responsibilities

**Owns**:
- Structured error responses (error codes, messages, context)
- Retry logic for external services (LLM adapter retries)
- Error logging and monitoring
- Error categorization (client errors vs server errors)
- Error recovery for transient failures

**Does**:
- Returns structured error responses (error code, message, details)
- Implements retry logic for LLM calls (exponential backoff)
- Logs errors for monitoring and debugging
- Categorizes errors (4xx client errors, 5xx server errors)
- Handles transient failures (retry with backoff)

**Does NOT**:
- Format error messages for UX (frontend formats messages)
- Show error UI (frontend handles UI)
- Handle network errors (frontend detects network issues)

**Rationale**: Backend provides structured error information and handles retries for external services. Frontend formats errors for users.

---

#### Co-Design Pattern

```
User submits answer
  ↓
Frontend: Optimistic update (disable submit, show loading)
Frontend: Call API
  ↓
Network error / API error
  ↓
Backend: Returns error response (if API reached)
Backend: Implements retry logic for LLM (if applicable)
  ↓
Frontend: Receives error (or detects network error)
  ↓
Frontend: Transition to ERROR state
Frontend: Show error message (formatted for UX)
Frontend: Show retry button
Frontend: Roll back optimistic update (re-enable submit)
  ↓
User clicks retry
  ↓
Frontend: Call API again
  ↓
Backend: Process request (or retry LLM if needed)
  ↓
Frontend: If success, proceed with submission
Frontend: If error persists, show error again
```

**Key Point**: Frontend handles user-facing errors and retry UI. Backend handles retries for external services and provides structured error information.

---

### 5. Rate Limiting User Actions

#### Frontend Responsibilities

**Owns**:
- UI blocking (disable buttons when rate limit active)
- Countdown timers (show time remaining until next action allowed)
- Request prevention (prevent API calls if rate limit would be exceeded)
- Visual feedback (show rate limit warnings, countdown displays)
- Client-side rate limit tracking (approximate, for UX)

**Does**:
- Disables submit button when cooldown active
- Shows countdown timer ("10 seconds until you can submit again")
- Tracks request timestamps locally (approximate rate limit tracking)
- Prevents API calls if rate limit would be exceeded (optimistic)
- Shows warnings when approaching rate limit ("2 requests remaining this minute")

**Does NOT**:
- Enforce rate limits authoritatively (backend does this)
- Trust client-side rate limit tracking (backend is authoritative)
- Bypass backend validation (always calls API, backend enforces)

**Rationale**: Frontend provides immediate UX feedback and prevents unnecessary API calls. User sees clear feedback about rate limits.

---

#### Backend Responsibilities

**Owns**:
- Authoritative rate limit enforcement
- Rate limit tracking (request counts, timestamps)
- Rate limit configuration (limits per endpoint, per user)
- Rate limit error responses (429 Too Many Requests)
- Rate limit headers (X-RateLimit-* headers)

**Does**:
- Tracks request counts per user/session
- Enforces rate limits (blocks requests exceeding limits)
- Returns 429 error when rate limit exceeded
- Returns rate limit headers (remaining requests, reset time)
- Logs rate limit violations for monitoring

**Does NOT**:
- Control UI button states (frontend handles that)
- Show countdown timers (frontend handles that)
- Trust client-side rate limit tracking (backend is authoritative)

**Rationale**: Backend is the security boundary. Rate limits must be enforced server-side to prevent abuse. Frontend cannot bypass backend enforcement.

---

#### Co-Design Pattern

```
User submits answer
  ↓
Frontend: Check local rate limit tracking (optimistic)
Frontend: If rate limit would be exceeded, block UI, show countdown
Frontend: If rate limit OK (optimistic), call API
  ↓
Backend: Check authoritative rate limit tracking
  ↓
Backend: If rate limit exceeded, return 429 with headers
Backend: If rate limit OK, process request, return rate limit headers
  ↓
Frontend: If 429 error, update UI, show countdown from headers
Frontend: If success, update local rate limit tracking from headers
Frontend: Update countdown timer based on reset time from headers
```

**Key Point**: Frontend prevents excessive requests for UX, but backend enforces authoritatively. Backend rate limit headers drive frontend UI updates.

---

## Summary Table

| Responsibility | Frontend Role | Backend Role | Key Principle |
|----------------|---------------|--------------|---------------|
| **Lesson Pacing** | UI flow control, navigation blocking | Authoritative validation, unlock decisions | Frontend blocks, backend validates |
| **Input Validation** | UX validation, immediate feedback | Authoritative validation, security | Frontend for UX, backend for security |
| **Session Resumption** | UI state restoration, local caching | Authoritative session state | Frontend restores UI, backend provides truth |
| **Error Recovery** | User-facing errors, retry UI | Structured errors, external retries | Frontend for UX, backend for retries |
| **Rate Limiting** | UI blocking, countdown timers | Authoritative enforcement, tracking | Frontend prevents, backend enforces |

---

## Key Principles

### 1. Frontend Provides UX, Backend Provides Security

**Rule**: Frontend can optimize UX (immediate feedback, optimistic updates), but backend is always the security boundary.

**Example**: Frontend can disable submit button based on local rate limit tracking, but backend always validates and enforces rate limits authoritatively.

---

### 2. Backend is Source of Truth

**Rule**: All authoritative state (progress, constraints, unlock status) comes from backend. Frontend can cache optimistically, but must sync with backend.

**Example**: Frontend can show optimistic unlock status, but backend validation is required before actual navigation.

---

### 3. Frontend Cannot Bypass Backend

**Rule**: Frontend can prevent invalid actions (UX), but cannot make final decisions. Backend always validates.

**Example**: Frontend can block navigation to locked screens, but backend validates on API call and returns authoritative unlock status.

---

### 4. Co-Design, Not Duplication

**Rule**: Frontend and backend have complementary responsibilities, not duplicate responsibilities.

**Example**: Frontend validates input format (UX), backend validates business rules (security). Both validate, but different layers.

---

### 5. Optimistic Updates with Reconciliation

**Rule**: Frontend can optimistically update UI for immediate feedback, but must reconcile with backend authoritative state.

**Example**: Frontend can optimistically increment attempt count, but backend response provides authoritative count and frontend reconciles.

---

## Implementation Guidelines

### Frontend Implementation

1. **Always validate client-side** (for UX), but never trust client-side validation alone
2. **Always sync with backend** after optimistic updates
3. **Always reconcile** local state with backend authoritative state
4. **Always handle errors** gracefully (show user-friendly messages)
5. **Never bypass backend** validation (always call API before making decisions)

### Backend Implementation

1. **Always validate** all input, even if frontend already validated
2. **Always enforce** constraints authoritatively (rate limits, prerequisites)
3. **Always return** structured error responses with error codes
4. **Always provide** rate limit headers in responses
5. **Never trust** client-side state (always load from storage)

---

## Conclusion

This responsibility audit defines clear ownership boundaries:

- **Frontend**: UX, immediate feedback, optimistic updates, UI state
- **Backend**: Security, authoritative validation, business rules, persistence

Both layers work together to provide a secure, user-friendly learning experience. Frontend optimizes UX, backend ensures security and correctness.
