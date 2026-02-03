# JSX Implementation Decision

## Decision: **NO-GO**

**Status**: ❌ **NOT SAFE** to begin JSX implementation

**Date**: 2026-02-02

---

## Executive Summary

Based on comprehensive audits of frontend architecture, state management, failure modes, and responsibility boundaries, the system has **critical gaps** that would make JSX implementation **risky and likely to fail**. Three fundamental blockers must be resolved before UI implementation can safely proceed.

---

## Rationale

### Why NO-GO?

1. **Silent Failures**: All failure scenarios (timeout, desync, refresh, validator rejection) result in **silent failures** with no recovery paths. Users cannot detect failures, cannot recover, and can proceed incorrectly.

2. **State Loss**: Page refresh loses all frontend state. No persistence, no restoration, no recovery. Users lose progress on every refresh.

3. **Unenforced Architecture**: State machine exists but is not enforced. Transitions only log warnings, retry bypasses validation. Developers will bypass it, leading to chat app degradation.

4. **Missing Recovery Mechanisms**: No timeout detection, no conflict resolution, no session restoration, no error recovery. System cannot handle basic web scenarios.

5. **Unclear Ownership**: Frontend trusts backend for authoritative data, but backend has TODOs. Duplicated logic, unclear boundaries. Developers will make incorrect assumptions.

**Risk**: JSX implementation will result in:
- Broken user experience (frozen UI, lost progress, silent failures)
- Chat app degradation (developers bypass state machine)
- Unrecoverable errors (no recovery mechanisms)
- Data loss (no persistence, no restoration)

---

## Critical Blockers (Must Fix First)

### Blocker 1: Timeout Detection & Handling

**Severity**: 🔴 **CRITICAL**

**Problem**:
- No timeout configured in API client
- Requests wait indefinitely
- No `AbortController` usage
- No timeout error thrown
- Error boundaries never triggered
- User sees frozen UI with no indication of failure

**Impact**:
- User submits answer → Request hangs → UI frozen forever
- No way to cancel or retry
- User must refresh (loses progress)
- Silent failure (no error thrown)

**Evidence**:
```typescript
// frontend/services/api/client.ts:38
const response = await fetch(url, {
  method,
  headers: this.headers,
  body: body ? JSON.stringify(body) : undefined,
  ...options,  // ❌ No timeout option
});
// ❌ No AbortController
// ❌ No timeout detection
```

**Required Fix**:
1. Add `AbortController` to API client
2. Set timeout (30 seconds for LLM calls, 10 seconds for others)
3. Throw `TIMEOUT_ERROR` on timeout
4. Show timeout UI with retry button
5. Update error boundaries to handle timeout

**Why This Must Be Fixed First**:
- Without timeout handling, every API call can hang indefinitely
- Users will experience frozen UI on first failure
- No recovery path → Users abandon session
- **Cannot implement JSX safely without this**

---

### Blocker 2: Session Restoration on Refresh

**Severity**: 🔴 **CRITICAL**

**Problem**:
- No localStorage/sessionStorage persistence
- No session ID persistence
- No session restoration on page load
- No "resume session" API endpoint
- Page refresh loses all frontend state
- User must start over on every refresh

**Impact**:
- User refreshes during lesson → All state lost
- User refreshes during submission → Doesn't know if succeeded
- User refreshes during streaming → Loses partial response
- No way to recover session state
- User loses progress on every refresh

**Evidence**:
```typescript
// frontend/state/stores/sessionStore.ts
export const useSessionStore = create<SessionStore>((set) => ({
  currentSessionId: null,  // ❌ Not persisted
  session: null,  // ❌ Not persisted
  // ❌ No localStorage/sessionStorage
}));
```

**Required Fix**:
1. Persist session ID to localStorage on session creation
2. Persist critical state (currentScreenId, progress) to localStorage
3. Restore session on page load (`useEffect` in root layout)
4. Add "resume session" API endpoint (or use existing GET endpoint)
5. Show "Resuming session..." UI during restoration
6. Handle restoration errors gracefully

**Why This Must Be Fixed First**:
- Page refresh is common in web apps
- Without restoration, users lose progress on every refresh
- No recovery path → Users abandon session
- **Cannot implement JSX safely without this**

---

### Blocker 3: Conflict Detection for Session Desync

**Severity**: 🔴 **CRITICAL**

**Problem**:
- No version/timestamp in session state
- No conflict detection logic
- No reconciliation mechanism
- Frontend can update without backend sync
- Frontend and backend can diverge silently
- User proceeds with wrong state

**Impact**:
- Frontend shows wrong progress → User thinks they're further along
- Frontend shows unlocked screen → User navigates to locked screen
- Frontend shows wrong attempt count → User submits too many times
- Backend rejects (state mismatch) → User sees confusing error
- Silent failure (no error thrown)

**Evidence**:
```typescript
// frontend/state/stores/sessionStore.ts:28
updateSession: (updates) => set((state) => ({
  session: state.session ? { ...state.session, ...updates } : null,
})),
// ❌ Updates frontend state without backend sync
// ❌ No conflict detection
// ❌ No reconciliation logic
```

**Required Fix**:
1. Add `version` or `lastUpdatedAt` timestamp to session state
2. Compare frontend/backend state on sync operations
3. Detect conflicts (frontend state differs from backend)
4. Show "State out of sync" UI with sync button
5. Implement reconciliation logic (backend wins for learning state)
6. Rollback optimistic updates on conflict

**Why This Must Be Fixed First**:
- Without conflict detection, frontend and backend can diverge
- Users proceed with wrong state → Confusing errors
- No recovery path → Users don't understand failures
- **Cannot implement JSX safely without this**

---

## Why These Three?

### These Are the Most Critical Silent Failures

1. **Timeout**: Silent failure → Frozen UI → No recovery
2. **Refresh**: Silent failure → State loss → No recovery
3. **Desync**: Silent failure → Wrong state → No recovery

### These Block Basic Web Scenarios

- **Timeout**: Every API call can hang → Common web scenario
- **Refresh**: Every user will refresh → Common web scenario
- **Desync**: Every optimistic update can diverge → Common web scenario

### These Have No Workarounds

- **Timeout**: Cannot work around → Must detect and handle
- **Refresh**: Cannot work around → Must restore state
- **Desync**: Cannot work around → Must detect and resolve

### These Would Break JSX Implementation

- **Timeout**: JSX would show frozen UI → Broken UX
- **Refresh**: JSX would lose state → Broken UX
- **Desync**: JSX would show wrong state → Broken UX

---

## What About Other Issues?

### State Machine Enforcement

**Status**: ⚠️ **HIGH PRIORITY** (but not blocker)

**Why Not Blocker**:
- State machine exists and is documented
- Can be enforced during JSX implementation
- Developers can follow patterns if documented
- Less critical than silent failures

**When to Fix**: During JSX implementation (enforce in components)

---

### Validator Rejection

**Status**: ⚠️ **HIGH PRIORITY** (but not blocker)

**Why Not Blocker**:
- Validator not implemented (always passes)
- Can implement validator feedback during JSX
- Less critical than silent failures
- Can show generic errors initially

**When to Fix**: During JSX implementation (add error handling)

---

### Request Deduplication

**Status**: 🟡 **MEDIUM PRIORITY** (not blocker)

**Why Not Blocker**:
- Can be added during JSX implementation
- Less critical than silent failures
- Can prevent with UI (disable button during request)

**When to Fix**: During JSX implementation (add request tracking)

---

## Implementation Order

### Phase 1: Fix Critical Blockers (REQUIRED)

1. **Timeout Detection & Handling** (1-2 days)
   - Add `AbortController` to API client
   - Set timeouts
   - Throw `TIMEOUT_ERROR`
   - Update error boundaries
   - Test timeout scenarios

2. **Session Restoration on Refresh** (1-2 days)
   - Add localStorage persistence
   - Add restoration logic
   - Add "resume session" flow
   - Test refresh scenarios

3. **Conflict Detection for Desync** (1-2 days)
   - Add version/timestamp to session
   - Add conflict detection
   - Add reconciliation logic
   - Test desync scenarios

**Total**: 3-6 days

### Phase 2: Begin JSX Implementation (AFTER Phase 1)

Once all three blockers are fixed:
- Implement route JSX
- Implement component JSX
- Enforce state machine in components
- Add error handling
- Test failure scenarios

---

## Success Criteria

Before JSX implementation can begin, all three blockers must meet these criteria:

### Blocker 1: Timeout Detection & Handling

✅ **Success Criteria**:
- API client has timeout configured
- Timeout throws `TIMEOUT_ERROR`
- Error boundaries catch timeout
- UI shows timeout message with retry button
- User can retry after timeout
- Test: Submit answer → Simulate timeout → Verify recovery

### Blocker 2: Session Restoration on Refresh

✅ **Success Criteria**:
- Session ID persisted to localStorage
- Critical state persisted to localStorage
- Session restored on page load
- UI shows "Resuming session..." during restoration
- User can continue where they left off
- Test: Start session → Refresh → Verify restoration

### Blocker 3: Conflict Detection for Desync

✅ **Success Criteria**:
- Session state has version/timestamp
- Conflict detection logic implemented
- UI shows "State out of sync" message
- User can sync state
- Optimistic updates rollback on conflict
- Test: Optimistic update → Backend rejects → Verify rollback

---

## Conclusion

**Decision**: ❌ **NO-GO**

**Rationale**: Three critical silent failures (timeout, refresh, desync) must be fixed before JSX implementation can safely proceed. These failures have no recovery paths and would break user experience.

**Next Steps**:
1. Fix Blocker 1: Timeout Detection & Handling
2. Fix Blocker 2: Session Restoration on Refresh
3. Fix Blocker 3: Conflict Detection for Desync
4. Verify all success criteria met
5. **Then** begin JSX implementation

**Estimated Time**: 3-6 days to fix blockers, then JSX implementation can proceed safely.

---

**Decision Date**: 2026-02-02  
**Decision Maker**: AI Assistant (based on comprehensive audits)  
**Review Required**: Yes (user should review and confirm)
