# Frontend vs Backend Responsibility Summary

## Quick Reference Table

| Responsibility | Frontend | Backend | Key Principle |
|----------------|----------|---------|---------------|
| **Lesson Pacing** | • UI flow control<br>• Navigation blocking<br>• Visual feedback | • Authoritative validation<br>• Prerequisite checking<br>• Unlock decisions | Frontend blocks, backend validates |
| **Input Validation** | • Client-side UX validation<br>• Real-time feedback<br>• Format/length checks | • Authoritative validation<br>• Business rules<br>• Security validation | Frontend for UX, backend for security |
| **Session Resumption** | • UI state restoration<br>• Local caching<br>• Optimistic loading | • Authoritative session state<br>• Progress/constraints<br>• Persistence | Frontend restores UI, backend provides truth |
| **Error Recovery** | • User-facing errors<br>• Retry UI<br>• Network error handling | • Structured errors<br>• External retries<br>• Error logging | Frontend for UX, backend for retries |
| **Rate Limiting** | • UI blocking<br>• Countdown timers<br>• Request prevention | • Authoritative enforcement<br>• Rate limit tracking<br>• 429 responses | Frontend prevents, backend enforces |

---

## Detailed Ownership

### 1. Lesson Pacing

**Frontend**:
- ✅ Disables "Next" button when screen locked
- ✅ Shows unlock requirements
- ✅ Prevents navigation to locked screens
- ✅ Updates UI when backend confirms unlock

**Backend**:
- ✅ Validates prerequisites
- ✅ Checks mastery thresholds
- ✅ Returns unlock status (authoritative)
- ✅ Persists screen completion

**Co-Design**: Frontend blocks navigation optimistically, backend validates authoritatively before allowing progression.

---

### 2. Input Validation

**Frontend**:
- ✅ Validates format/length/required (UX)
- ✅ Shows real-time validation errors
- ✅ Disables submit if invalid
- ✅ Prevents unnecessary API calls

**Backend**:
- ✅ Re-validates all input (security)
- ✅ Validates business rules
- ✅ Validates security (prompt injection)
- ✅ Returns structured validation errors

**Co-Design**: Frontend validates for UX, backend validates for security. Both layers validate, different purposes.

---

### 3. Session Resumption

**Frontend**:
- ✅ Restores screen ID from localStorage
- ✅ Restores draft answers
- ✅ Shows UI immediately (optimistic)
- ✅ Syncs with backend on load

**Backend**:
- ✅ Loads session from storage
- ✅ Returns authoritative state
- ✅ Validates session exists
- ✅ Returns progress/constraints

**Co-Design**: Frontend restores UI for immediate UX, backend provides authoritative state. Frontend reconciles local state with backend.

---

### 4. Error Recovery

**Frontend**:
- ✅ Shows user-friendly error messages
- ✅ Provides retry buttons
- ✅ Handles network errors
- ✅ Rolls back optimistic updates

**Backend**:
- ✅ Returns structured error responses
- ✅ Implements retry logic for LLM
- ✅ Logs errors for monitoring
- ✅ Categorizes errors (4xx/5xx)

**Co-Design**: Frontend handles user-facing errors and retry UI, backend handles external retries and provides error context.

---

### 5. Rate Limiting

**Frontend**:
- ✅ Disables buttons when rate limit active
- ✅ Shows countdown timers
- ✅ Prevents excessive requests (optimistic)
- ✅ Updates UI from backend headers

**Backend**:
- ✅ Enforces rate limits authoritatively
- ✅ Tracks request counts
- ✅ Returns 429 errors
- ✅ Returns rate limit headers

**Co-Design**: Frontend prevents excessive requests for UX, backend enforces authoritatively. Backend headers drive frontend UI.

---

## Core Principles

1. **Frontend = UX, Backend = Security**
   - Frontend optimizes user experience
   - Backend ensures security and correctness

2. **Backend is Source of Truth**
   - All authoritative state from backend
   - Frontend can cache optimistically, must sync

3. **Frontend Cannot Bypass Backend**
   - Frontend prevents invalid actions (UX)
   - Backend always validates (security)

4. **Co-Design, Not Duplication**
   - Complementary responsibilities
   - Different layers, different purposes

5. **Optimistic Updates with Reconciliation**
   - Frontend can update optimistically
   - Must reconcile with backend authoritative state

---

## Implementation Checklist

### Frontend Must:
- ✅ Validate client-side (for UX)
- ✅ Sync with backend after optimistic updates
- ✅ Reconcile local state with backend state
- ✅ Handle errors gracefully
- ✅ Never bypass backend validation

### Backend Must:
- ✅ Validate all input (even if frontend validated)
- ✅ Enforce constraints authoritatively
- ✅ Return structured error responses
- ✅ Provide rate limit headers
- ✅ Never trust client-side state

---

See `responsibility-audit.md` for complete documentation.
