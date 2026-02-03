# User Experience Under Failure Conditions Audit

## Executive Summary

**Critical Finding**: User experience under failure conditions is **poorly defined** and **inconsistently handled**. Error states exist in models but recovery mechanisms are **not implemented**. Users will experience **confusing errors**, **lost progress**, and **unclear recovery paths** when failures occur.

---

## Scenario 1: AI Response Delayed or Fails

### Documented Behavior

**User Flow** (`user-flow.md:565`):
```
- API request fails → Retry with exponential backoff
- Timeout → Show error, allow retry
```

**Session Orchestrator** (`session-orchestrator.md:347`):
```
### LLM Failure
- Retry with exponential backoff
- Fallback to cached response if available
- Return safe default guidance message
```

**Frontend Domain Models** (`frontend-domain-models.md:35`):
```typescript
| 'error'             // Error state, can retry
```

### Actual Implementation

**Backend Code** (`SessionOrchestrator.ts:119`):
```typescript
} catch (error) {
  // TODO: Handle LLM errors
  // TODO: Retry with exponential backoff if transient error
  // TODO: Return safe fallback response if persistent error
  throw error;  // ❌ JUST THROWS, NO HANDLING
}
```

**Frontend Code** (Documented):
```typescript
// docs/architecture/frontend-structure.md:558
onError: (error) => {
  // Handle error, rollback
  lessonStateStore.transitionState('error');
}
// ❌ Rollback logic not implemented
```

---

### What the User Sees

#### Case 1A: LLM Call Times Out (No Timeout Set)

**What Happens**:
1. User submits answer
2. Frontend shows "Submitting..." state
3. Backend calls LLM (no timeout)
4. LLM takes 60+ seconds (or hangs)
5. Frontend waits indefinitely
6. **User sees**: Frozen UI, no feedback, no way to cancel

**Where Experience Breaks**:
- ❌ No timeout detection
- ❌ No loading indicator timeout
- ❌ No way to cancel
- ❌ No error message
- ❌ UI frozen indefinitely

---

#### Case 1B: LLM Call Fails Immediately

**What Happens**:
1. User submits answer
2. Backend calls LLM
3. LLM API returns error (network, rate limit, etc.)
4. Backend throws error (no handling)
5. Frontend receives error response
6. **User sees**: Generic error message, no context, no recovery path

**Where Experience Breaks**:
- ❌ Error message exposes technical details ("LLM_ERROR", "502")
- ❌ No user-friendly explanation
- ❌ No retry button
- ❌ No fallback response
- ❌ Progress may be lost

---

#### Case 1C: LLM Response Delayed (Slow Network)

**What Happens**:
1. User submits answer
2. Frontend shows "Submitting..." state
3. Backend calls LLM
4. LLM takes 15 seconds (slow but not failed)
5. Frontend shows loading spinner
6. **User sees**: Long wait with no progress indication

**Where Experience Breaks**:
- ❌ No progress indication
- ❌ No estimated time
- ❌ No way to cancel
- ❌ User doesn't know if it's working or broken

---

### What the System Does

**Backend**:
```typescript
// SessionOrchestrator.ts:119
catch (error) {
  throw error;  // ❌ Just throws, no handling
}
```

**Frontend** (Documented):
```typescript
// frontend-structure.md:558
onError: (error) => {
  lessonStateStore.transitionState('error');
  // ❌ No retry logic
  // ❌ No fallback
  // ❌ No user notification
}
```

**System Behavior**:
- ❌ No retry logic implemented
- ❌ No exponential backoff
- ❌ No timeout handling
- ❌ No fallback response
- ❌ No error recovery

---

### Where the Experience Breaks

1. **No Timeout**: User waits indefinitely
2. **No Error Handling**: Generic errors, no context
3. **No Retry**: User must manually retry
4. **No Fallback**: No safe response when LLM fails
5. **No Progress**: No indication of what's happening
6. **No Cancellation**: Can't cancel stuck requests
7. **Progress Loss**: May lose progress on error

---

## Scenario 2: Validator Blocks Instructor Output

### Documented Behavior

**Response Validator** (`response-validator.md:126`):
```
### Step 1: Critical Checks (Fail-Fast)
If any critical check fails → REJECT IMMEDIATELY

### Step 2: Style and Teaching Checks
If any high-severity check fails → REJECT AND REGENERATE

### Step 3: Quality Checks
If medium-severity checks fail → REQUEST REGENERATION (up to 2 retries)
```

**Session Orchestrator** (`session-orchestrator.md:353`):
```
### Validation Failure
- Retry with adjusted prompt
- Use fallback instructions
- Return safe response that maintains character
```

### Actual Implementation

**Backend Code** (`SessionOrchestrator.ts:136`):
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

**Response Validator** (`ResponseValidator.ts:44`):
```typescript
validate(...): ValidationResult {
  const violations: ValidationViolation[] = [];
  // TODO: All validation checks
  return { isValid: true, violations: [] };  // ❌ ALWAYS RETURNS TRUE
}
```

---

### What the User Sees

#### Case 2A: Validator Should Reject (But Doesn't)

**What Happens**:
1. User submits answer
2. LLM generates response with direct answer
3. Validator checks (all TODOs, not implemented)
4. Validator returns `{ isValid: true }` (always)
5. Response sent to user
6. **User sees**: Direct answer (teaching rule violated)

**Where Experience Breaks**:
- ❌ Validation not implemented
- ❌ Bad responses get through
- ❌ Teaching quality degraded
- ❌ User gets answer without learning

---

#### Case 2B: Validator Rejects (If Implemented)

**What Happens**:
1. User submits answer
2. LLM generates response
3. Validator rejects (CRITICAL violation)
4. Backend tries fallback prompt
5. `assembleFallbackPrompt()` throws `NotImplementedError`
6. Backend throws error
7. **User sees**: Error message, no response, no recovery

**Where Experience Breaks**:
- ❌ Fallback not implemented
- ❌ Error instead of safe response
- ❌ No retry mechanism
- ❌ User gets no feedback
- ❌ Progress may be lost

---

#### Case 2C: Validator Regenerates (If Implemented)

**What Happens**:
1. User submits answer
2. LLM generates response
3. Validator rejects (HIGH severity)
4. Backend tries to regenerate
5. `assembleFallbackPrompt()` throws `NotImplementedError`
6. Backend throws error
7. **User sees**: Error after long wait, no response

**Where Experience Breaks**:
- ❌ Regeneration not implemented
- ❌ Error instead of retry
- ❌ Long wait with no result
- ❌ No feedback about what happened

---

### What the System Does

**Backend**:
```typescript
// ResponseValidator.ts:44
validate(...): ValidationResult {
  // TODO: All checks
  return { isValid: true };  // ❌ Always passes
}

// SessionOrchestrator.ts:139
const fallbackPrompt = await this.promptAssembler.assembleFallbackPrompt(...);
// ❌ Throws NotImplementedError
```

**System Behavior**:
- ❌ Validation not implemented (always passes)
- ❌ Fallback not implemented (throws error)
- ❌ Regeneration not implemented (throws error)
- ❌ No safe fallback response
- ❌ Errors thrown instead of graceful handling

---

### Where the Experience Breaks

1. **No Validation**: Bad responses get through
2. **No Fallback**: Errors thrown instead of safe response
3. **No Regeneration**: Can't retry with adjusted prompt
4. **No User Feedback**: User doesn't know why response failed
5. **Long Waits**: User waits for response that never comes
6. **Progress Loss**: May lose progress on validation failure

---

## Scenario 3: User Tries to Skip Learning Steps

### Documented Behavior

**User Flow** (`user-flow.md:572`):
```
- Prerequisites not met → Disable navigation, show requirements
```

**Frontend Domain Models** (`frontend-domain-models.md:38`):
```typescript
interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  canSkip: boolean;
  lockedScreens: string[];
  lockedReason?: string;
}
```

**API Contracts** (`api-contracts-lesson-focused.md:201`):
```
- SCREEN_LOCKED: Screen is locked (prerequisites not met)
```

### Actual Implementation

**Frontend** (Documented):
```typescript
// frontend-domain-models.md:500
function canNavigateToScreen(...): boolean {
  if (lessonState.navigationState.lockedScreens.includes(targetScreenId)) {
    return false;  // ✅ Prevents navigation
  }
}
// ❌ But navigation prevention not enforced everywhere
```

**Backend**:
```typescript
// No screen unlock validation in SessionOrchestrator
// Screen state not tracked in Session model
```

---

### What the User Sees

#### Case 3A: User Clicks "Next Screen" (Locked)

**What Happens**:
1. User on screen 2 (guided practice)
2. User clicks "Next" button
3. Frontend checks `canGoForward` (false)
4. Frontend disables button or shows message
5. **User sees**: Disabled button or "Screen locked" message

**Where Experience Breaks**:
- ⚠️ **Partially works**: Frontend can prevent navigation
- ❌ But if user bypasses frontend (direct URL), backend doesn't validate
- ❌ No clear explanation of why locked
- ❌ No progress toward unlocking

---

#### Case 3B: User Directly Navigates to Locked Screen (URL)

**What Happens**:
1. User types URL: `/lessons/sess_123/screen_005`
2. Frontend loads screen
3. Frontend calls `GET /lessons/screen_005/state`
4. Backend returns screen state (may not check prerequisites)
5. **User sees**: Screen content, but may be locked

**Where Experience Breaks**:
- ❌ Backend doesn't validate prerequisites on GET
- ❌ User can see locked screen content
- ❌ No clear "locked" state
- ❌ Confusing UX (can see but can't interact)

---

#### Case 3C: User Tries to Complete Screen Early

**What Happens**:
1. User on screen 2
2. User hasn't met mastery threshold
3. User clicks "Complete" button
4. Frontend calls `POST /lessons/screen_002/complete`
5. Backend validates requirements (not met)
6. Backend returns error: `REQUIREMENTS_NOT_MET`
7. **User sees**: Error message, no clear explanation

**Where Experience Breaks**:
- ❌ Error message may be technical
- ❌ No clear explanation of what's needed
- ❌ No progress indicator toward completion
- ❌ User doesn't know what to do

---

### What the System Does

**Frontend** (Documented):
```typescript
// frontend-domain-models.md:500
if (lessonState.navigationState.lockedScreens.includes(targetScreenId)) {
  return false;  // ✅ Prevents navigation
}
```

**Backend**:
```typescript
// No screen unlock validation in SessionOrchestrator
// Screen state not in Session model
// Prerequisites not validated on GET requests
```

**System Behavior**:
- ⚠️ Frontend prevents navigation (if implemented)
- ❌ Backend doesn't validate prerequisites
- ❌ No server-side enforcement
- ❌ Direct URL access bypasses frontend checks
- ❌ Error messages may be unclear

---

### Where the Experience Breaks

1. **No Backend Validation**: Direct URL access bypasses checks
2. **Unclear Error Messages**: Technical errors, not user-friendly
3. **No Progress Indicator**: User doesn't know what's needed
4. **Inconsistent Enforcement**: Frontend prevents, backend doesn't
5. **Confusing States**: User can see locked screen content

---

## Scenario 4: Network Interruption Mid-Lesson

### Documented Behavior

**User Flow** (`user-flow.md:565`):
```
- SSE connection drops → Auto-reconnect
- API request fails → Retry with exponential backoff
- Timeout → Show error, allow retry
```

**System Architecture** (`system-architecture.md:165`):
```
- Connection recovery: Handle SSE reconnection on network issues
```

**Frontend Structure** (`frontend-structure.md:498`):
```
- Reconnection logic
- Error handling
```

### Actual Implementation

**Backend**:
```typescript
// No SSE implementation exists
// No reconnection handling
// No state restoration
```

**Frontend** (Documented):
```typescript
// frontend-structure.md:498
// Reconnection logic
// ❌ Only mentioned, not implemented
```

---

### What the User Sees

#### Case 4A: Network Drops During SSE Streaming

**What Happens**:
1. User submits answer
2. SSE stream starts
3. Instructor response streaming: "That's a good start! Why do you..."
4. Network drops
5. SSE connection closes
6. **User sees**: Partial response, no completion, no error message

**Where Experience Breaks**:
- ❌ No reconnection logic
- ❌ Partial response left hanging
- ❌ No error indication
- ❌ No way to resume
- ❌ User doesn't know what happened

---

#### Case 4B: Network Drops During API Request

**What Happens**:
1. User submits answer
2. Frontend sends POST request
3. Network drops mid-request
4. Request times out or fails
5. Frontend receives error
6. **User sees**: Error message, answer lost, must retype

**Where Experience Breaks**:
- ❌ No request retry
- ❌ Answer lost (not saved)
- ❌ User must retype
- ❌ No draft saving
- ❌ Progress may be lost

---

#### Case 4C: Network Intermittent (Slow/Unstable)

**What Happens**:
1. User submits answer
2. Request takes 30 seconds (slow network)
3. User thinks it failed
4. User clicks submit again
5. Both requests complete
6. **User sees**: Duplicate submissions, confusing state

**Where Experience Breaks**:
- ❌ No request deduplication
- ❌ No idempotency keys
- ❌ Duplicate submissions
- ❌ Confusing state
- ❌ Progress counted twice

---

#### Case 4D: Network Recovers After Drop

**What Happens**:
1. User submits answer
2. Network drops
3. Network recovers 10 seconds later
4. SSE doesn't auto-reconnect
5. **User sees**: No response, no indication of recovery

**Where Experience Breaks**:
- ❌ No auto-reconnection
- ❌ No state restoration
- ❌ User must manually retry
- ❌ Progress may be lost
- ❌ No indication that network recovered

---

### What the System Does

**Backend**:
```typescript
// No SSE implementation
// No reconnection handling
// No state restoration
// No request deduplication
```

**Frontend** (Documented):
```typescript
// frontend-structure.md:498
// Reconnection logic
// ❌ Not implemented
```

**System Behavior**:
- ❌ No SSE reconnection
- ❌ No request retry
- ❌ No state restoration
- ❌ No request deduplication
- ❌ No draft saving
- ❌ No offline support

---

### Where the Experience Breaks

1. **No Reconnection**: SSE doesn't auto-reconnect
2. **No Retry**: Failed requests don't retry
3. **No State Restoration**: Can't resume after reconnection
4. **No Draft Saving**: Answers lost on network failure
5. **No Deduplication**: Duplicate submissions possible
6. **No Offline Support**: Can't work offline
7. **No Progress Recovery**: Progress lost on interruption

---

## Summary: Experience Breakdown Points

### Scenario 1: AI Response Delayed or Fails

**What User Sees**:
- ❌ Frozen UI (no timeout)
- ❌ Generic error messages
- ❌ No retry option
- ❌ No progress indication
- ❌ No way to cancel

**What System Does**:
- ❌ Throws error (no handling)
- ❌ No retry logic
- ❌ No timeout
- ❌ No fallback response

**Where Experience Breaks**:
- No timeout → User waits indefinitely
- No error handling → Generic errors, no context
- No retry → User must manually retry
- No fallback → No response when LLM fails

---

### Scenario 2: Validator Blocks Instructor Output

**What User Sees**:
- ❌ Error message (if validation implemented)
- ❌ No response
- ❌ No explanation
- ❌ Long wait with no result

**What System Does**:
- ❌ Validation not implemented (always passes)
- ❌ Fallback not implemented (throws error)
- ❌ Regeneration not implemented (throws error)

**Where Experience Breaks**:
- No validation → Bad responses get through
- No fallback → Errors instead of safe response
- No regeneration → Can't retry with adjusted prompt
- No user feedback → User doesn't know why failed

---

### Scenario 3: User Tries to Skip Learning Steps

**What User Sees**:
- ⚠️ Disabled button (if frontend implemented)
- ❌ Can access via direct URL
- ❌ Unclear error messages
- ❌ No progress indicator

**What System Does**:
- ⚠️ Frontend prevents (if implemented)
- ❌ Backend doesn't validate
- ❌ No server-side enforcement

**Where Experience Breaks**:
- No backend validation → Direct URL bypasses checks
- Unclear errors → Technical messages, not user-friendly
- No progress indicator → User doesn't know what's needed

---

### Scenario 4: Network Interruption Mid-Lesson

**What User Sees**:
- ❌ Partial response (SSE drops)
- ❌ Error message (request fails)
- ❌ Answer lost (not saved)
- ❌ Must retype

**What System Does**:
- ❌ No SSE reconnection
- ❌ No request retry
- ❌ No state restoration
- ❌ No draft saving

**Where Experience Breaks**:
- No reconnection → SSE doesn't auto-reconnect
- No retry → Failed requests don't retry
- No state restoration → Can't resume after reconnection
- No draft saving → Answers lost on failure

---

## Critical UX Gaps

### Gap 1: No Error Recovery Mechanisms

**Missing**:
- No retry logic
- No fallback responses
- No error boundaries
- No graceful degradation

**Impact**: Users see errors with no recovery path.

---

### Gap 2: No Timeout Handling

**Missing**:
- No request timeouts
- No loading indicator timeouts
- No session timeouts
- No way to cancel stuck requests

**Impact**: Users wait indefinitely for responses.

---

### Gap 3: No Network Resilience

**Missing**:
- No SSE reconnection
- No request retry
- No state restoration
- No offline support
- No draft saving

**Impact**: Network issues cause data loss and poor UX.

---

### Gap 4: No User-Friendly Error Messages

**Missing**:
- Technical error codes exposed
- No user-friendly explanations
- No recovery suggestions
- No progress indicators

**Impact**: Users don't understand errors or how to fix them.

---

### Gap 5: No Validation Feedback

**Missing**:
- Validation not implemented
- No fallback when validation fails
- No user feedback about validation
- No explanation of why response failed

**Impact**: Bad responses get through, or errors with no explanation.

---

## Recommendations

### Immediate Fixes (Critical)

1. **Implement Error Handling**:
   - Add retry logic with exponential backoff
   - Add timeout handling
   - Add fallback responses
   - Add error boundaries

2. **Implement Network Resilience**:
   - Add SSE auto-reconnection
   - Add request retry logic
   - Add state restoration
   - Add draft saving

3. **Implement Validation**:
   - Implement validation checks
   - Add fallback prompt assembly
   - Add safe fallback responses
   - Add user-friendly error messages

### Short-term (High Priority)

4. **Add Timeout Handling**:
   - Set request timeouts
   - Set loading indicator timeouts
   - Add cancel functionality
   - Show timeout errors

5. **Improve Error Messages**:
   - User-friendly error messages
   - Recovery suggestions
   - Progress indicators
   - Clear explanations

6. **Add Backend Validation**:
   - Validate prerequisites on GET requests
   - Enforce screen locks server-side
   - Return clear error messages
   - Provide unlock requirements

### Long-term (Medium Priority)

7. **Add Offline Support**:
   - Save drafts locally
   - Queue requests when offline
   - Sync when online
   - Show offline indicator

8. **Add Progress Recovery**:
   - Save progress incrementally
   - Restore progress on reconnect
   - Handle partial responses
   - Resume from checkpoint

---

## Conclusion

**User experience under failure conditions is poor:**

- ❌ **No error recovery**: Users see errors with no recovery path
- ❌ **No timeout handling**: Users wait indefinitely
- ❌ **No network resilience**: Network issues cause data loss
- ❌ **No user-friendly errors**: Technical messages confuse users
- ❌ **No validation feedback**: Bad responses or unclear errors

**Critical actions needed**:
1. Implement error handling and retry logic
2. Add timeout handling and cancellation
3. Implement network resilience (reconnection, retry, state restoration)
4. Add user-friendly error messages
5. Implement validation with fallback responses
