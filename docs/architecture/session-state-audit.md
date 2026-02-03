# Session and State Management Audit

## Executive Summary

**Critical Finding**: Session and state management has **fundamental gaps** in persistence, recovery, and state ownership. The system claims backend ownership but lacks mechanisms to enforce it. Recovery scenarios (refresh, tab close, reconnect) are **documented but not implemented**. Partial progress resumption is **undefined**.

---

## 1. Session Truth Ownership

### Documented Ownership

**Backend as Source of Truth** (`system-architecture.md`):
```
BACKEND (Source of Truth)
• Session state (active/paused/completed)
• Screen unlock/completion state
• Learning progress (mastery, concepts)
• Attempt counts, time spent
• Learner memory
• Constraint violations

FRONTEND (Optimistic UI)
• UI state (current screen, form inputs)
• Optimistic progress display
• Client-side constraint checks (for UX)
• SSE connection state
• Temporary UI state (animations, transitions)
```

**Synchronization Strategy**:
```
1. Frontend Optimistic Updates: Update UI immediately
2. Backend Validation: Backend validates and returns authoritative state
3. Conflict Resolution: Frontend reconciles optimistic state with backend response
4. Periodic Sync: Frontend polls or receives updates for state changes
```

### Actual Implementation

**Backend Code**:
```typescript
// backend/core/SessionOrchestrator.ts:95
await this.storageAdapter.updateSession(sessionId, {
  messageIds: updatedMessageIds,
  lastActivityAt: new Date(),
});
// ✅ Updates backend state
```

**Frontend Code** (Documented):
```typescript
// docs/architecture/frontend-structure.md:304
interface SessionStore {
  currentSessionId: string | null;
  session: Session | null;  // ❌ Frontend maintains session copy
  isLoading: boolean;
  error: string | null;
  
  setSession: (session: Session) => void;
  updateSession: (updates: Partial<Session>) => void;  // ❌ Can update without backend
}
```

**Problems Identified**:

#### Problem 1: No Conflict Resolution Mechanism

**Issue**: Frontend can update session state optimistically, but there's no conflict resolution when backend state differs.

**Missing**:
- No version/timestamp comparison
- No conflict detection
- No reconciliation logic
- No rollback mechanism

**Impact**: Frontend and backend state can diverge without detection.

**Evidence**:
```typescript
// docs/architecture/frontend-structure.md:423
// State Synchronization Strategy mentions "conflict resolution"
// But conflictResolver.ts is only mentioned, not implemented
```

---

#### Problem 2: Frontend Can Update Session Without Backend

**Issue**: `SessionStore.updateSession()` can update frontend state without syncing to backend.

**Code**:
```typescript
// docs/architecture/frontend-structure.md:313
updateSession: (updates: Partial<Session>) => void;
// ❌ No backend sync enforced
```

**Impact**: Frontend state can become stale or incorrect.

---

#### Problem 3: No Periodic Sync Implementation

**Issue**: Documentation mentions "Periodic Sync" but no implementation exists.

**Missing**:
- No polling mechanism
- No SSE updates for state changes
- No sync interval
- No sync trigger logic

**Impact**: Frontend state can become stale if backend state changes independently.

---

#### Problem 4: Optimistic Updates Can't Be Rolled Back

**Issue**: Optimistic updates happen, but rollback on error is not guaranteed.

**Code**:
```typescript
// docs/architecture/frontend-structure.md:419
// Error → Rollback
//   └─► Revert Optimistic Update
// ❌ Rollback logic not implemented
```

**Impact**: Failed operations leave frontend in inconsistent state.

---

### Undefined State: Frontend-Backend Divergence

**Scenario**: 
1. Frontend optimistically updates session state
2. Backend rejects update (validation failure)
3. Frontend state is now incorrect
4. No mechanism to detect or fix divergence

**Why It's Risky**: State divergence can cause:
- UI shows incorrect progress
- Navigation to locked screens
- Constraint violations
- Data loss

---

## 2. Refresh, Tab Close, Reconnect Scenarios

### Documented Behavior

**User Flow** (`user-flow.md`):
```
### Session Interruption
- Browser close → Save state, resume on return
- Timeout → Pause session, allow resume
- Error → Save progress, allow retry
```

**System Architecture** (`system-architecture.md`):
```
- Connection recovery: Handle SSE reconnection on network issues
- Session persistence: Save session state, messages, screens
```

### Actual Implementation

**Frontend State Storage**:
```typescript
// docs/architecture/frontend-structure.md:304
interface SessionStore {
  currentSessionId: string | null;
  session: Session | null;
  // ❌ No localStorage/sessionStorage mentioned
  // ❌ No persistence mechanism
}
```

**Backend Persistence**:
```typescript
// backend/core/SessionOrchestrator.ts:95
await this.storageAdapter.updateSession(sessionId, {
  messageIds: updatedMessageIds,
  lastActivityAt: new Date(),
});
// ✅ Backend persists, but frontend doesn't know how to recover
```

**Problems Identified**:

#### Problem 1: No Frontend State Persistence

**Issue**: Frontend state is not persisted to localStorage or sessionStorage.

**Missing**:
- No localStorage persistence
- No sessionStorage persistence
- No state serialization
- No state restoration on page load

**Impact**: 
- Refresh loses all frontend state
- Tab close loses all frontend state
- User must start over

**Evidence**: No mention of localStorage/sessionStorage in any documentation.

---

#### Problem 2: No Session Recovery Mechanism

**Issue**: Even if backend has session state, frontend doesn't know how to recover it.

**Missing**:
- No "resume session" API endpoint
- No session recovery flow
- No state restoration logic
- No "continue where you left off" feature

**Impact**: User can't resume interrupted sessions.

---

#### Problem 3: No Session ID Persistence

**Issue**: `currentSessionId` is not persisted, so frontend doesn't know which session to resume.

**Missing**:
- No session ID in localStorage
- No session ID in URL (for deep linking)
- No session ID in cookies
- No way to identify active session on reload

**Impact**: Frontend can't identify session to resume.

---

#### Problem 4: SSE Reconnection Doesn't Restore State

**Issue**: SSE reconnection is mentioned but doesn't restore session state.

**Code**:
```typescript
// docs/architecture/frontend-structure.md:498
// Reconnection logic
// ❌ Only reconnects SSE, doesn't restore session state
```

**Impact**: Reconnection restores streaming but not session context.

---

#### Problem 5: No Timeout Handling

**Issue**: "Timeout → Pause session" is documented but not implemented.

**Missing**:
- No session timeout detection
- No automatic pause on timeout
- No timeout recovery mechanism
- No "session expired" handling

**Impact**: Sessions can become stale without detection.

---

### Undefined State: Refresh During Active Session

**Scenario**:
1. User is on lesson screen, has submitted answer
2. Instructor response is streaming
3. User refreshes page
4. **What happens?**
   - ❓ Does session resume?
   - ❓ Does streaming continue?
   - ❓ Is progress lost?
   - ❓ Which screen does user see?

**Why It's Risky**: User experience is unpredictable.

---

### Undefined State: Tab Close During Submission

**Scenario**:
1. User submits answer
2. Backend is processing
3. User closes tab
4. **What happens?**
   - ❓ Is submission saved?
   - ❓ Is progress updated?
   - ❓ Can user resume?

**Why It's Risky**: Data loss possible.

---

### Undefined State: Multiple Tabs

**Scenario**:
1. User opens session in Tab A
2. User opens same session in Tab B
3. User interacts in Tab A
4. **What happens in Tab B?**
   - ❓ Does Tab B update?
   - ❓ Do tabs conflict?
   - ❓ Which tab is authoritative?

**Why It's Risky**: State conflicts, data corruption.

---

## 3. Partial Progress Resumption

### Documented Behavior

**System Architecture** (`system-architecture.md`):
```
- Screen unlock/completion state: Authoritative screen unlock/completion state
- Progress tracking: Track learning progress, mastery, attempts
- Session persistence: Save session state, messages, screens
```

**Frontend Domain Models** (`frontend-domain-models.md`):
```typescript
interface ScreenProgressUI {
  screenId: string;
  currentAttempt: number;
  maxAttempts: number;
  timeSpent: number;  // Seconds spent on screen (client-tracked)
  minTimeRequired: number;
  score: number | null;
  masteryThreshold: number;
  canProceed: boolean;
  progressPercentage: number;
}
```

### Actual Implementation

**Backend Progress Tracking**:
```typescript
// backend/core/types.ts:27
export interface Session {
  id: string;
  sessionState: SessionState;
  messageIds: string[];
  startedAt: Date;
  lastActivityAt: Date;
  endedAt: Date | null;
  // ❌ No screen progress tracking
  // ❌ No attempt counts
  // ❌ No time spent tracking
}
```

**Frontend Progress Tracking**:
```typescript
// docs/architecture/frontend-domain-models.md:110
interface ScreenProgressUI {
  timeSpent: number;  // Seconds spent on screen (client-tracked)
  // ❌ Client-tracked, not persisted
  // ❌ Lost on refresh
}
```

**Problems Identified**:

#### Problem 1: Screen Progress Not Persisted

**Issue**: Screen progress (attempts, time spent, scores) is tracked but not persisted.

**Missing**:
- No screen progress in backend Session model
- No screen progress persistence
- No screen progress recovery
- No partial progress tracking

**Impact**: 
- Progress lost on refresh
- Can't resume partial progress
- Can't track progress across sessions

---

#### Problem 2: Time Spent Is Client-Tracked Only

**Issue**: `timeSpent` is tracked client-side but not synced to backend.

**Code**:
```typescript
// docs/architecture/frontend-domain-models.md:114
timeSpent: number;  // Seconds spent on screen (client-tracked)
// ❌ Not persisted to backend
```

**Impact**: 
- Time tracking lost on refresh
- Backend can't validate minimum time requirements
- Progress calculations incorrect

---

#### Problem 3: No Screen State Persistence

**Issue**: Screen state (active, completed, locked) is not persisted.

**Missing**:
- No screen state in Session model
- No screen state persistence
- No screen state recovery
- No "current screen" tracking

**Impact**: 
- Can't resume on specific screen
- Can't track which screens are completed
- Can't determine where to resume

---

#### Problem 4: No Partial Attempt Persistence

**Issue**: Partial attempts (user typed answer but didn't submit) are not saved.

**Missing**:
- No draft answer saving
- No partial attempt tracking
- No auto-save mechanism
- No recovery of unsaved work

**Impact**: 
- User loses work on refresh
- Must retype answers
- Poor user experience

---

#### Problem 5: No Progress Checkpointing

**Issue**: Progress is only saved on completion, not incrementally.

**Missing**:
- No checkpoint system
- No incremental progress saves
- No progress snapshots
- No rollback to checkpoint

**Impact**: 
- Progress lost if session interrupted
- Can't resume from checkpoint
- Must restart from beginning

---

### Undefined State: Partial Screen Completion

**Scenario**:
1. User starts screen
2. User spends 30 seconds (of 60 required)
3. User submits answer (attempt 1 of 3)
4. User refreshes page
5. **What happens?**
   - ❓ Does time spent reset?
   - ❓ Does attempt count reset?
   - ❓ Can user resume at attempt 2?
   - ❓ Is 30 seconds counted?

**Why It's Risky**: Progress can be lost or incorrectly calculated.

---

### Undefined State: Mid-Stream Refresh

**Scenario**:
1. User submits answer
2. Instructor response is streaming
3. User refreshes page
4. **What happens?**
   - ❓ Is answer submission saved?
   - ❓ Is partial response saved?
   - ❓ Can user see complete response?
   - ❓ Does streaming resume?

**Why It's Risky**: Data loss, inconsistent state.

---

## 4. Undefined or Risky States

### State 1: Session State Transitions

**Defined States**: `'active' | 'paused' | 'completed' | 'abandoned'`

**Undefined Transitions**:
- ❓ How does `active` → `paused` happen? (automatic? manual?)
- ❓ How does `paused` → `active` happen? (resume? restart?)
- ❓ When does `active` → `abandoned` happen? (timeout? manual?)
- ❓ Can `completed` → `active` happen? (restart session?)

**Risky**: Unclear state machine, unpredictable behavior.

---

### State 2: Screen State Transitions

**Defined States** (from `user-flow.md`): `'locked' | 'unlocked' | 'active' | 'completed' | 'blocked'`

**Undefined Transitions**:
- ❓ How does `unlocked` → `active` happen? (user clicks? automatic?)
- ❓ How does `active` → `completed` happen? (mastery? manual?)
- ❓ How does `blocked` → `active` happen? (constraint resolved? manual?)
- ❓ Can `completed` → `active` happen? (retry? review?)

**Risky**: Unclear screen lifecycle, navigation issues.

---

### State 3: UI State Transitions

**Defined States** (from `frontend-domain-models.md`): `'idle' | 'loading' | 'ready' | 'interacting' | 'submitting' | 'streaming' | 'processing' | 'error' | 'blocked'`

**Undefined Transitions**:
- ❓ What happens if `streaming` → `error`? (recover? retry?)
- ❓ What happens if `submitting` → `error`? (rollback? retry?)
- ❓ Can `error` → `streaming` happen? (retry streaming?)
- ❓ What happens if `processing` → `error`? (recover state?)

**Risky**: Error recovery unclear, state machine incomplete.

---

### State 4: Constraint State

**Defined States**: `'active' | 'warning' | 'blocking' | 'satisfied' | 'expired'`

**Undefined Behavior**:
- ❓ How are constraints initialized? (on screen start? on load?)
- ❓ How are constraints updated? (real-time? on sync?)
- ❓ What happens if constraint expires mid-action? (allow? block?)
- ❓ Can constraints conflict? (multiple blocking constraints?)

**Risky**: Constraint enforcement unpredictable.

---

### State 5: Sync State

**Defined States** (from `frontend-domain-models.md`): `isSynced`, `pendingChanges`, `syncError`

**Undefined Behavior**:
- ❓ How is `isSynced` determined? (timestamp? version? comparison?)
- ❓ What happens if `syncError` occurs? (retry? notify? rollback?)
- ❓ How are `pendingChanges` tracked? (queue? diff? timestamp?)
- ❓ What happens if sync fails? (lose changes? queue? retry?)

**Risky**: State synchronization unreliable.

---

### State 6: SSE Connection State

**Defined States**: Connected, Disconnected, Reconnecting, Error

**Undefined Behavior**:
- ❓ What happens if SSE disconnects during streaming? (resume? restart?)
- ❓ What happens if SSE reconnects? (resume stream? restart?)
- ❓ What happens if multiple SSE connections? (conflict? queue?)
- ❓ What happens if SSE error? (retry? fallback? notify?)

**Risky**: Streaming unreliable, data loss.

---

### State 7: Optimistic Update State

**Defined Concept**: Frontend updates optimistically, syncs with backend

**Undefined Behavior**:
- ❓ What happens if optimistic update conflicts with backend? (override? merge? reject?)
- ❓ What happens if optimistic update succeeds but backend fails? (rollback? retry?)
- ❓ What happens if multiple optimistic updates? (queue? batch? conflict?)
- ❓ What happens if optimistic update is stale? (detect? reject? update?)

**Risky**: State divergence, data corruption.

---

### State 8: Session Lifecycle State

**Defined States**: Created, Started, Active, Paused, Completed, Abandoned

**Undefined Behavior**:
- ❓ What happens if session is created but never started? (cleanup? timeout?)
- ❓ What happens if session is paused indefinitely? (expire? cleanup?)
- ❓ What happens if session is abandoned? (can resume? cleanup?)
- ❓ What happens if session expires? (auto-complete? auto-abandon?)

**Risky**: Resource leaks, stale sessions.

---

## Summary: Critical Gaps

### 1. Session Truth Ownership: ⚠️ **CLAIMED BUT NOT ENFORCED**
- Backend claims ownership but no conflict resolution
- Frontend can update without backend sync
- No periodic sync implementation
- Optimistic updates can't be rolled back

### 2. Refresh/Tab Close/Reconnect: ❌ **NOT IMPLEMENTED**
- No frontend state persistence
- No session recovery mechanism
- No session ID persistence
- SSE reconnection doesn't restore state
- No timeout handling

### 3. Partial Progress Resumption: ❌ **UNDEFINED**
- Screen progress not persisted
- Time spent client-tracked only
- No screen state persistence
- No partial attempt persistence
- No progress checkpointing

### 4. Undefined States: ❌ **8 CRITICAL STATES UNDEFINED**
- Session state transitions
- Screen state transitions
- UI state transitions
- Constraint state
- Sync state
- SSE connection state
- Optimistic update state
- Session lifecycle state

---

## Recommendations

### Immediate Fixes (Critical)

1. **Implement Session Recovery**:
   - Persist session ID to localStorage
   - Add "resume session" API endpoint
   - Restore session state on page load
   - Handle refresh/reconnect scenarios

2. **Implement Conflict Resolution**:
   - Add version/timestamp to session state
   - Compare frontend/backend state on sync
   - Resolve conflicts (backend wins for learning state)
   - Rollback optimistic updates on conflict

3. **Implement Progress Persistence**:
   - Add screen progress to backend Session model
   - Persist attempts, time spent, scores
   - Save progress incrementally (not just on completion)
   - Restore progress on session resume

4. **Define State Machines**:
   - Document all state transitions
   - Implement state transition validation
   - Handle error states explicitly
   - Add state recovery mechanisms

### Short-term (High Priority)

5. **Frontend State Persistence**:
   - Persist critical state to localStorage
   - Serialize/deserialize state
   - Restore state on page load
   - Handle state migration

6. **Periodic Sync**:
   - Implement polling or SSE updates
   - Sync state periodically
   - Detect and resolve conflicts
   - Notify user of state changes

7. **Timeout Handling**:
   - Detect session timeout
   - Auto-pause on timeout
   - Allow resume after timeout
   - Clean up expired sessions

### Long-term (Medium Priority)

8. **Multi-Tab Support**:
   - Detect multiple tabs
   - Sync state across tabs
   - Handle tab conflicts
   - Notify user of conflicts

9. **Checkpoint System**:
   - Save progress checkpoints
   - Allow rollback to checkpoint
   - Resume from checkpoint
   - Incremental progress saves

10. **Error Recovery**:
    - Define error states
    - Implement error recovery
    - Retry failed operations
    - Notify user of errors

---

## Conclusion

**Session and state management has fundamental gaps:**

- ⚠️ **Session truth**: Claimed but not enforced
- ❌ **Recovery**: Not implemented
- ❌ **Partial progress**: Undefined
- ❌ **State machines**: Incomplete

**The system cannot reliably handle:**
- Page refresh
- Tab close
- Network reconnection
- Partial progress
- State conflicts
- Error recovery

**Critical actions needed**:
1. Implement session recovery
2. Add conflict resolution
3. Persist progress
4. Define state machines
5. Handle all edge cases
