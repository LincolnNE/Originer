# Failure UX Paths Audit

## Executive Summary

**Critical Finding**: All four failure scenarios have **critical UX gaps**. Failures are either **silent**, **unrecoverable**, or **misleading**. Users cannot detect failures, cannot recover from them, and can proceed incorrectly without knowing.

---

## Scenario 1: Backend Timeout

### Current Implementation

**API Client** (`frontend/services/api/client.ts:38`):
```typescript
const response = await fetch(url, {
  method,
  headers: this.headers,
  body: body ? JSON.stringify(body) : undefined,
  ...options,  // ❌ No timeout option passed
});
// ❌ No timeout configured
// ❌ No AbortController
// ❌ No timeout detection
```

**Backend** (`backend/core/SessionOrchestrator.ts:120`):
```typescript
catch (error) {
  // TODO: Handle LLM errors
  // TODO: Retry with exponential backoff if transient error
  throw error;  // ❌ Just throws, no timeout handling
}
```

### Failure Visibility

**Is the failure visible to the user?**

❌ **NO** - Timeout is **silent**:
- No timeout configured (request waits indefinitely)
- No timeout error thrown
- No UI feedback about timeout
- Loading state persists forever
- User sees: **Frozen UI, no indication of failure**

**Evidence**:
- `ApiClient.request()` has no timeout parameter
- No `AbortController` usage
- No timeout error handling
- Error boundaries only catch thrown errors (timeout never throws)

### Recovery Guidance

**Does the UI guide recovery?**

❌ **NO** - No recovery path:
- No timeout detection → No error state
- No retry button (error never occurs)
- No cancel button
- No "Request taking too long" message
- User cannot recover (must refresh page)

**Evidence**:
- Error boundaries exist but never catch timeout (timeout never throws)
- `TIMEOUT_ERROR` exists in state machine but never reached
- No UI component handles timeout state

### Incorrect Proceeding Risk

**Can the user proceed incorrectly?**

⚠️ **YES** - User can proceed incorrectly:
- User may think request succeeded (no error shown)
- User may refresh and resubmit (duplicate submission)
- User may navigate away (loses progress)
- User may assume system is broken (abandons session)

**Silent Failure Risk**: **CRITICAL**
- Timeout never detected → User waits indefinitely
- No error thrown → Error boundaries never triggered
- No user feedback → User doesn't know what happened
- Progress may be lost → User must restart

---

## Scenario 2: Validator Rejection

### Current Implementation

**Response Validator** (`backend/core/ResponseValidator.ts:44`):
```typescript
validate(...): ValidationResult {
  const violations: ValidationViolation[] = [];
  // TODO: All validation checks
  return { isValid: true, violations: [] };  // ❌ ALWAYS RETURNS TRUE
}
```

**Session Orchestrator** (`backend/core/SessionOrchestrator.ts:136`):
```typescript
if (!validationResult.isValid) {
  if (validationResult.action === 'REGENERATE' || validationResult.action === 'RETRY') {
    const fallbackPrompt = await this.promptAssembler.assembleFallbackPrompt(...);
    // ❌ assembleFallbackPrompt() throws NotImplementedError
  }
  
  if (!validationResult.isValid && validationResult.action === 'REJECT') {
    rawResponse = this.generateSafeFallbackResponse(learnerMessageContent);
    // ✅ Has fallback, but validation always returns isValid: true
  }
}
```

**API Route** (`src/routes/lessons.ts:225`):
```typescript
catch (error: any) {
  request.log.error(error);
  return reply.code(500).send({
    success: false,
    error: {
      code: 'PROCESSING_ERROR',
      message: error.message || 'Failed to process answer',
    },
  });
}
```

### Failure Visibility

**Is the failure visible to the user?**

**Case 2A: Validator Not Implemented (Current State)**

❌ **NO** - Failure is **silent**:
- Validator always returns `isValid: true`
- Bad responses get through
- User sees: **Invalid response (direct answer, wrong style, etc.)**
- No indication that validation failed

**Case 2B: Validator Implemented (Future State)**

⚠️ **PARTIAL** - Failure is **visible but unclear**:
- Validator rejects response
- `assembleFallbackPrompt()` throws `NotImplementedError`
- Backend throws error
- Frontend receives `PROCESSING_ERROR`
- User sees: **Generic error message ("Failed to process answer")**
- No explanation of validation failure
- No indication that response was rejected

**Evidence**:
- Validator always passes (not implemented)
- If implemented, fallback throws error
- Error message is generic (`PROCESSING_ERROR`)
- No validation-specific error codes
- No user-friendly explanation

### Recovery Guidance

**Does the UI guide recovery?**

**Case 2A: Validator Not Implemented**

❌ **NO** - No recovery needed (failure silent):
- User doesn't know validation failed
- User proceeds with invalid response
- No recovery path (user doesn't know there's a problem)

**Case 2B: Validator Implemented**

⚠️ **PARTIAL** - Recovery path exists but unclear:
- Error boundary shows error message
- Retry button available (`retryFromError()`)
- But: No explanation of why validation failed
- But: No guidance on what to do differently
- But: Retry may fail again (same response)

**Evidence**:
- Error boundaries exist (`app/lessons/[sessionId]/[screenId]/error.tsx`)
- `retryFromError()` exists in state machine
- But error message is generic
- No validation-specific recovery guidance
- No explanation of violations

### Incorrect Proceeding Risk

**Can the user proceed incorrectly?**

**Case 2A: Validator Not Implemented**

✅ **YES** - User proceeds with invalid response:
- User receives direct answer (should be guidance)
- User receives wrong style response
- User doesn't know response is invalid
- User learns incorrectly

**Case 2B: Validator Implemented**

⚠️ **YES** - User can proceed incorrectly:
- User sees generic error
- User clicks retry (same answer)
- Validation fails again (same reason)
- User doesn't know what to change
- User may abandon session

**Silent Failure Risk**: **CRITICAL** (Case 2A), **HIGH** (Case 2B)
- Case 2A: Invalid responses get through → User learns incorrectly
- Case 2B: Generic errors → User doesn't understand failure → Cannot recover

---

## Scenario 3: Session Desync

### Current Implementation

**Session Store** (`frontend/state/stores/sessionStore.ts:28`):
```typescript
updateSession: (updates) => set((state) => ({
  session: state.session ? { ...state.session, ...updates } : null,
})),
// ❌ Updates frontend state without backend sync
// ❌ No conflict detection
// ❌ No reconciliation logic
```

**Session Hook** (`frontend/state/hooks/useSession.ts:28`):
```typescript
const loadSession = async (sessionId: string) => {
  setLoading(true);
  setError(null);
  try {
    const response = await sessionsApi.getSession(sessionId);
    setSession(response.session);
    // ❌ No comparison with existing state
    // ❌ No conflict detection
    // ❌ No reconciliation
  } catch (err: any) {
    setError(err.message || 'Failed to load session');
  }
};
```

**Backend** (`backend/core/SessionOrchestrator.ts:187`):
```typescript
await this.storageAdapter.updateSession(sessionId, {
  messageIds: finalMessageIds,
  lastActivityAt: new Date(),
});
// ✅ Backend updates state
// ❌ But frontend doesn't sync
// ❌ No version/timestamp comparison
```

### Failure Visibility

**Is the failure visible to the user?**

❌ **NO** - Desync is **silent**:
- No conflict detection → No error thrown
- No comparison with backend → No divergence detected
- Frontend and backend can diverge without user knowing
- User sees: **Incorrect UI state (wrong progress, wrong screen, etc.)**
- No indication that state is out of sync

**Evidence**:
- No version/timestamp in session state
- No conflict detection logic
- No reconciliation mechanism
- Frontend can update without backend sync
- No periodic sync to detect divergence

### Recovery Guidance

**Does the UI guide recovery?**

❌ **NO** - No recovery path:
- Desync never detected → No error state
- No sync mechanism → Cannot recover
- No "State out of sync" message
- User cannot recover (must refresh, loses state)

**Evidence**:
- No conflict resolution logic
- No sync mechanism
- No reconciliation UI
- No way to detect or fix desync

### Incorrect Proceeding Risk

**Can the user proceed incorrectly?**

✅ **YES** - User can proceed incorrectly:
- Frontend shows wrong progress → User thinks they're further along
- Frontend shows unlocked screen → User navigates to locked screen
- Frontend shows wrong attempt count → User submits too many times
- Backend rejects (state mismatch) → User sees error, doesn't understand why

**Silent Failure Risk**: **CRITICAL**
- Desync never detected → User proceeds with wrong state
- No error thrown → Error boundaries never triggered
- No user feedback → User doesn't know state is wrong
- Backend may reject actions → User sees confusing errors

**Example Desync Scenarios**:

1. **Optimistic Update Divergence**:
   - User submits answer
   - Frontend optimistically updates progress (attempts: 2)
   - Backend rejects (constraint violation)
   - Frontend doesn't rollback
   - Frontend shows attempts: 2, backend has attempts: 1
   - User sees wrong progress

2. **Multiple Tab Conflict**:
   - User opens session in Tab A
   - User opens same session in Tab B
   - User submits in Tab A (backend updates)
   - Tab B still shows old state
   - Tab B shows wrong progress

3. **Backend State Change**:
   - User on screen 2
   - Backend unlocks screen 3 (admin action)
   - Frontend doesn't sync
   - Frontend still shows screen 3 locked
   - User can't navigate (but backend allows it)

---

## Scenario 4: Page Refresh Mid-Lesson

### Current Implementation

**Session Store** (`frontend/state/stores/sessionStore.ts`):
```typescript
export const useSessionStore = create<SessionStore>((set) => ({
  currentSessionId: null,  // ❌ Not persisted
  session: null,  // ❌ Not persisted
  // ❌ No localStorage/sessionStorage
  // ❌ No persistence mechanism
}));
```

**Session Hook** (`frontend/state/hooks/useSession.ts`):
```typescript
const loadSession = async (sessionId: string) => {
  // ❌ No check for existing session on page load
  // ❌ No restoration from localStorage
  // ❌ No "resume session" logic
};
```

**Page Component** (`frontend/app/lessons/[sessionId]/[screenId]/page.tsx`):
```typescript
export default function LessonScreenPage({ params }: LessonScreenPageProps) {
  const { sessionId, screenId } = params;
  // ❌ No useEffect to restore session on mount
  // ❌ No check for session state persistence
  // ❌ No recovery logic
  return null; // Placeholder - no JSX yet
}
```

### Failure Visibility

**Is the failure visible to the user?**

⚠️ **PARTIAL** - Failure is **visible but confusing**:
- User refreshes page
- Frontend state is lost (not persisted)
- Page loads with no session state
- User sees: **Blank page or error (depending on implementation)**
- No indication that session was lost
- No "Resume session" option

**Evidence**:
- No localStorage persistence
- No sessionStorage persistence
- No session ID in URL (for deep linking)
- No restoration logic
- Page component doesn't restore state on mount

### Recovery Guidance

**Does the UI guide recovery?**

❌ **NO** - No recovery path:
- No session restoration → User must start over
- No "Resume session" button
- No indication that session exists in backend
- User loses all progress

**Evidence**:
- No session recovery mechanism
- No "resume session" API endpoint
- No restoration UI
- No way to recover session state

### Incorrect Proceeding Risk

**Can the user proceed incorrectly?**

✅ **YES** - User can proceed incorrectly:
- User refreshes during submission
- Frontend state lost
- User doesn't know if submission succeeded
- User may resubmit (duplicate)
- User may start new session (loses progress)

**Silent Failure Risk**: **CRITICAL**
- State lost on refresh → User loses progress
- No restoration → User must restart
- No indication of lost state → User doesn't know what happened
- Backend may have saved progress → User doesn't know

**Example Refresh Scenarios**:

1. **Refresh During Submission**:
   - User submits answer
   - Backend processing (5 seconds)
   - User refreshes page
   - Frontend state lost
   - User doesn't know if submission succeeded
   - User may resubmit (duplicate) or abandon

2. **Refresh During Streaming**:
   - User submits answer
   - SSE streaming instructor response
   - User refreshes page
   - SSE connection lost
   - Frontend state lost
   - User loses partial response
   - User must resubmit

3. **Refresh After Progress**:
   - User completes screen 1 (progress saved to backend)
   - User refreshes page
   - Frontend state lost
   - User doesn't know progress was saved
   - User may restart session (loses progress)

---

## Summary: Silent Failure Risks

### Critical Silent Failures

1. **Backend Timeout**:
   - ❌ Timeout never detected
   - ❌ No error thrown
   - ❌ User waits indefinitely
   - ❌ No recovery path

2. **Session Desync**:
   - ❌ Desync never detected
   - ❌ No conflict detection
   - ❌ User proceeds with wrong state
   - ❌ No recovery path

3. **Page Refresh**:
   - ⚠️ State lost (visible but confusing)
   - ❌ No restoration mechanism
   - ❌ User loses progress
   - ❌ No recovery path

### High-Risk Silent Failures

4. **Validator Rejection (Current)**:
   - ❌ Validator always passes (not implemented)
   - ❌ Invalid responses get through
   - ❌ User learns incorrectly
   - ❌ No indication of failure

5. **Validator Rejection (Future)**:
   - ⚠️ Generic error message
   - ⚠️ No explanation of failure
   - ⚠️ User doesn't understand why
   - ⚠️ Cannot recover effectively

---

## Recommendations

### Immediate Fixes (Critical)

1. **Implement Timeout Detection**:
   - Add `AbortController` to API client
   - Set timeout (30 seconds for LLM calls)
   - Throw `TIMEOUT_ERROR` on timeout
   - Show timeout UI with retry button

2. **Implement Session Restoration**:
   - Persist session ID to localStorage
   - Restore session on page load
   - Add "Resume session" API endpoint
   - Show "Resuming session..." UI

3. **Implement Conflict Detection**:
   - Add version/timestamp to session state
   - Compare frontend/backend state on sync
   - Detect conflicts
   - Show "State out of sync" UI with sync button

4. **Implement Validator Feedback**:
   - Show validation-specific error messages
   - Explain why validation failed
   - Guide user on how to proceed
   - Show retry with explanation

### Short-term (High Priority)

5. **Add Progress Persistence**:
   - Save progress incrementally
   - Restore progress on refresh
   - Show "Progress saved" indicator

6. **Add Request Deduplication**:
   - Add idempotency keys
   - Prevent duplicate submissions
   - Show "Already submitted" message

7. **Add Network Resilience**:
   - Auto-retry failed requests
   - Show "Retrying..." indicator
   - Queue requests when offline

### Long-term (Medium Priority)

8. **Add Offline Support**:
   - Save drafts locally
   - Queue requests when offline
   - Sync when online

9. **Add State Synchronization**:
   - Periodic sync with backend
   - Real-time updates via SSE
   - Conflict resolution UI

---

## Conclusion

**All four failure scenarios have critical UX gaps:**

- ❌ **Backend Timeout**: Silent failure, no recovery
- ❌ **Validator Rejection**: Silent failure (current) or unclear (future)
- ❌ **Session Desync**: Silent failure, no recovery
- ❌ **Page Refresh**: State loss, no recovery

**Critical actions needed**:
1. Implement timeout detection and handling
2. Implement session restoration on refresh
3. Implement conflict detection and resolution
4. Implement validator feedback and recovery guidance
5. Add progress persistence and recovery mechanisms
