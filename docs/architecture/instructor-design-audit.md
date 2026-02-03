# AI Instructor Design Audit

## Executive Summary

**Critical Finding**: The AI Instructor design has **fundamental gaps** between documented behavior and actual implementation. Teaching rules are **aspirational** (documented but not enforced), instructor identity stability is **assumed but not guaranteed**, and interruption handling is **frontend-only** with no backend safety mechanisms.

---

## 1. Instructor Identity Stability Across Sessions

### Design Intent

**Documented Behavior**:
- `InstructorProfile` preserves teaching style across sessions
- `Session.instructorProfileId` ensures correct profile is used
- Core identity remains constant (from `instructor_identity.md`)

### Actual Implementation

**Backend Code**:
```typescript
// backend/core/SessionOrchestrator.ts:59
const instructorProfile = await this.storageAdapter.loadInstructorProfile(
  session.instructorProfileId
);
// ✅ Loads profile by ID

// backend/core/PromptAssembler.ts:30
async assemblePrompt(params: {
  instructorProfile: InstructorProfile;
  // ...
}): Promise<string> {
  // TODO: Load instructor-specific prompts
  // Based on instructorProfile.teachingPatterns, guidanceStyle, etc.
  throw new Error('Not implemented');  // ❌ NOT IMPLEMENTED
}
```

**Problems Identified**:

#### Problem 1: Prompt Assembly Not Implemented

**Issue**: `PromptAssembler.assemblePrompt()` throws `NotImplementedError`. Instructor profile data is loaded but never used.

**Impact**: 
- Instructor identity is **not actually applied** to prompts
- All instructors behave identically (only system prompts)
- Teaching style variations are ignored

**Evidence**:
```typescript
// backend/core/PromptAssembler.ts:45
// TODO: Load instructor-specific prompts from config/prompts/instructor/
// Based on instructorProfile.teachingPatterns, guidanceStyle, etc.
// ❌ Never implemented
```

---

#### Problem 2: No Identity Persistence Verification

**Issue**: No mechanism to verify that instructor identity remains consistent across sessions.

**Missing Checks**:
- No validation that `InstructorProfile` hasn't changed mid-session
- No verification that profile loaded matches session's `instructorProfileId`
- No detection of profile corruption or version mismatches

**Impact**: Instructor could change mid-session if profile is updated, breaking consistency.

---

#### Problem 3: Core Identity vs Profile Identity Confusion

**Documented**:
```markdown
# config/prompts/system/instructor_identity.md
## Character Consistency
Maintain this identity throughout every interaction. Your teaching style may vary based on the instructor profile, but your core identity as a patient, guiding instructor remains constant.
```

**Reality**:
- Core identity is hardcoded in `instructor_identity.md`
- Profile identity is supposed to vary but isn't implemented
- No clear boundary between "core identity" and "profile identity"

**Impact**: Confusion about what can vary vs what must remain constant.

---

### Failure Scenario: Identity Drift

**Scenario**: 
1. Session starts with `InstructorProfile` A (Socratic method)
2. Profile A is updated mid-session to use direct instruction
3. Next message uses updated profile
4. Instructor suddenly changes teaching style mid-conversation

**Why It Fails**:
- No session-level profile snapshot
- Profile loaded fresh each time
- No versioning or immutability

**Impact**: Learner experiences inconsistent instructor behavior.

---

## 2. Safe Interruption Handling

### Design Intent

**Documented Behavior** (`realtime-interaction-ux.md`):
- Frontend shows interruption dialog
- User can cancel streaming and submit new answer
- SSE connection closed gracefully

### Actual Implementation

**Frontend Design**:
```typescript
// docs/architecture/realtime-interaction-ux.md:246
function handleSubmitClick() {
  if (streamingState.isStreaming) {
    // Close SSE connection
    await sseClient.close();
    // Submit new answer
    await submitAnswer(newAnswer);
  }
}
```

**Backend Reality**:
```typescript
// backend/core/SessionOrchestrator.ts:114
const llmResponse = await this.llmAdapter.generate({
  prompt: fullPrompt,
});
rawResponse = llmResponse.content;  // ❌ Synchronous, can't be interrupted
```

**Problems Identified**:

#### Problem 1: Backend Can't Be Interrupted

**Issue**: `SessionOrchestrator.processLearnerMessage()` is synchronous and blocking. Once LLM generation starts, it cannot be cancelled.

**Impact**:
- Frontend can close SSE connection, but backend continues processing
- Wasted LLM API calls
- Memory updates may occur for cancelled interactions
- No way to stop mid-generation

**Evidence**:
```typescript
// backend/core/SessionOrchestrator.ts:114
const llmResponse = await this.llmAdapter.generate({
  prompt: fullPrompt,
});  // ❌ No cancellation token, no way to interrupt
```

---

#### Problem 2: No Streaming Support in Backend

**Issue**: Backend uses `llmAdapter.generate()` (synchronous), not `generateStream()`.

**Impact**:
- Can't stream responses incrementally
- Can't cancel mid-stream
- Must wait for complete response before sending anything

**Evidence**:
```typescript
// backend/adapters/llm/types.ts
interface LLMAdapter {
  generate(request: LLMRequest): Promise<LLMResponse>;  // ✅ Synchronous
  generateStream(request: LLMRequest): Promise<AsyncIterable<LLMStreamChunk>>;  // ✅ Exists but not used
}

// backend/core/SessionOrchestrator.ts:114
const llmResponse = await this.llmAdapter.generate({...});  // ❌ Uses synchronous version
```

---

#### Problem 3: Memory Updates Happen Even If Cancelled

**Issue**: Memory is updated after response generation, even if frontend cancels.

**Impact**:
- Cancelled interactions still update learner memory
- Memory becomes inconsistent with actual conversation
- No rollback mechanism

**Evidence**:
```typescript
// backend/core/SessionOrchestrator.ts:192
// Step 7: Update learner memory
const learningInsights = this.analyzeInteraction(...);
const updatedMemory = this.updateLearnerMemory(...);
await this.storageAdapter.saveLearnerMemory(updatedMemory);
// ❌ No check if request was cancelled
```

---

#### Problem 4: No Request Cancellation Token

**Issue**: No mechanism to signal cancellation from frontend to backend.

**Impact**:
- Frontend can close SSE, but backend doesn't know
- Backend continues processing cancelled requests
- Wasted resources

**Missing**: HTTP cancellation token, request ID tracking, cancellation endpoint.

---

### Failure Scenario: Interruption Race Condition

**Scenario**:
1. User submits answer A
2. Backend starts LLM generation (takes 5 seconds)
3. User realizes mistake, clicks submit again (answer B)
4. Frontend closes SSE for answer A
5. Backend completes answer A generation (unaware of cancellation)
6. Backend updates memory with answer A insights
7. Backend starts processing answer B
8. Memory now contains insights from cancelled answer A

**Why It Fails**:
- No cancellation mechanism
- No request deduplication
- Memory updates happen regardless of cancellation

**Impact**: Corrupted learner memory, wasted LLM calls, inconsistent state.

---

## 3. Instructor Power vs Constraints

### Design Intent

**Documented Constraints**:
- Teaching rules (no direct answers, verify understanding, etc.)
- Safety constraints from instructor profile
- Response validation rules

### Actual Implementation

**Validation Code**:
```typescript
// backend/core/ResponseValidator.ts:38
validate(params: {
  response: string;
  session: Session;
  instructorProfile: InstructorProfile;
  learnerMessage: string;
}): ValidationResult {
  const violations: ValidationViolation[] = [];

  // Critical checks (fail-fast)
  // TODO: Check for hallucination (out-of-scope knowledge)
  // TODO: Check for overly confident incorrect explanations
  // TODO: Check safety constraints compliance

  // High-severity checks
  // TODO: Check for instructor style deviation
  // TODO: Check for direct answer giving
  // TODO: Check for system references

  // Medium-severity checks
  // TODO: Check for verification questions
  // TODO: Check response structure

  return { isValid: true, violations: [] };  // ❌ ALWAYS RETURNS TRUE
}
```

**Problems Identified**:

#### Problem 1: All Validation Is TODO (Not Implemented)

**Issue**: Every validation check is marked `TODO` and returns empty violations array.

**Impact**:
- **No teaching rules are enforced**
- Instructor can give direct answers
- No hallucination detection
- No style consistency checking
- No safety constraint enforcement

**Evidence**: All validation methods return `[]`:
```typescript
// backend/core/ResponseValidator.ts:133-267
private checkHallucination(...): ValidationViolation[] {
  // TODO: Extract concepts mentioned in response
  return [];  // ❌ Always returns empty
}

private checkDirectAnswer(...): ValidationViolation[] {
  // TODO: Detect question patterns
  return [];  // ❌ Always returns empty
}
// ... all other checks return []
```

---

#### Problem 2: Instructor Is Overpowered (No Constraints)

**Issue**: With no validation, instructor can:
- Give direct answers (violates Rule 1)
- Skip verification questions (violates Rule 2)
- Provide incorrect information confidently (violates Rule 4)
- Break character (violates Rule 8)
- Ignore teaching style (violates Rule 7)

**Impact**: Instructor behavior is **completely unconstrained**. Only LLM's base training prevents violations, which is unreliable.

---

#### Problem 3: Teaching Rules Are Aspirational, Not Enforced

**Documented Rules** (`teaching_rules.md`):
- Rule 1: Never Give Direct Answers
- Rule 2: Always Verify Understanding
- Rule 3: Use Questions to Guide
- Rule 4: Address Misconceptions Gently
- Rule 5: Build on Prior Knowledge
- Rule 6: Adjust Guidance Level
- Rule 7: Maintain Teaching Style Consistency
- Rule 8: Safety First

**Reality**: All rules are **aspirational** (hoped-for behavior) not **enforced** (guaranteed behavior).

**Impact**: Rules are suggestions to the LLM, not guarantees. LLM can ignore them.

---

#### Problem 4: No Fallback When Validation Fails

**Issue**: Even if validation were implemented, fallback logic is incomplete.

**Code**:
```typescript
// backend/core/SessionOrchestrator.ts:136
if (!validationResult.isValid) {
  if (validationResult.action === 'REGENERATE' || validationResult.action === 'RETRY') {
    const fallbackPrompt = await this.promptAssembler.assembleFallbackPrompt(...);
    // ❌ assembleFallbackPrompt() throws NotImplementedError
  }
}
```

**Impact**: Even if validation worked, failures can't be handled.

---

### Failure Scenario: Instructor Gives Direct Answer

**Scenario**:
1. Learner asks: "What's the answer to 2x + 5 = 13?"
2. Backend calls LLM (no validation)
3. LLM responds: "The answer is x = 4. You subtract 5 from both sides..."
4. ResponseValidator.validate() returns `{ isValid: true }` (all checks are TODO)
5. Response is returned to learner
6. **Teaching rule violated, but no enforcement**

**Why It Fails**:
- No validation implementation
- No detection of direct answers
- No regeneration with corrected prompt

**Impact**: Learner gets answer without learning, violates core teaching principle.

---

## 4. Teaching Rules: Enforceable vs Aspirational

### Analysis of Each Rule

#### Rule 1: Never Give Direct Answers

**Enforceability**: **MEDIUM** (can detect but hard to prevent)

**Detection Methods**:
- Pattern matching for solution formats ("The answer is...", "x = 4")
- Check if response contains final answer before guidance
- Verify guidance questions are present

**Prevention Methods**:
- Regenerate with stronger prompt if detected
- Use fallback response that only asks questions

**Current Status**: ❌ **NOT ENFORCED** (validation not implemented)

---

#### Rule 2: Always Verify Understanding

**Enforceability**: **HIGH** (easy to detect)

**Detection Methods**:
- Check for question marks in response
- Verify questions ask about understanding ("Can you explain...", "What do you think...")
- Flag responses without questions

**Prevention Methods**:
- Regenerate with prompt: "Include a verification question"
- Use fallback that adds verification question

**Current Status**: ❌ **NOT ENFORCED** (validation not implemented)

---

#### Rule 3: Use Questions to Guide

**Enforceability**: **MEDIUM** (can detect but subjective)

**Detection Methods**:
- Count questions in response
- Check for question patterns ("What happens if...", "How does...")
- Verify questions guide thinking, not just verify

**Prevention Methods**:
- Regenerate with prompt emphasizing questions
- Add questions to response if missing

**Current Status**: ❌ **NOT ENFORCED** (validation not implemented)

---

#### Rule 4: Address Misconceptions Gently

**Enforceability**: **LOW** (hard to detect misconceptions)

**Detection Methods**:
- Analyze learner message for incorrect understanding
- Check if instructor response corrects misconception
- Verify correction is gentle (no "that's wrong")

**Prevention Methods**:
- Use correction style from instructor profile
- Regenerate with gentler language if too harsh

**Current Status**: ❌ **NOT ENFORCED** (validation not implemented)

---

#### Rule 5: Build on Prior Knowledge

**Enforceability**: **LOW** (requires context understanding)

**Detection Methods**:
- Check if response references learner memory
- Verify connections to previous concepts
- Check if response assumes prior knowledge appropriately

**Prevention Methods**:
- Include learner memory in prompt (already done)
- Regenerate with explicit prior knowledge references

**Current Status**: ⚠️ **PARTIALLY ENFORCED** (memory included in prompt, but not verified)

---

#### Rule 6: Adjust Guidance Level

**Enforceability**: **LOW** (requires struggle assessment)

**Detection Methods**:
- Analyze learner message for struggle indicators
- Check if guidance level matches struggle
- Verify appropriate scaffolding

**Prevention Methods**:
- Include struggle level in prompt
- Adjust prompt based on struggle assessment

**Current Status**: ⚠️ **PARTIALLY ENFORCED** (struggle assessment in TODO, not implemented)

---

#### Rule 7: Maintain Teaching Style Consistency

**Enforceability**: **MEDIUM** (can detect style deviations)

**Detection Methods**:
- Compare response against instructor profile patterns
- Check for style mismatches (tone, question patterns, correction style)
- Verify consistency with previous responses

**Prevention Methods**:
- Regenerate with stronger style prompts
- Use instructor profile more prominently in prompt

**Current Status**: ❌ **NOT ENFORCED** (profile not used in prompt assembly)

---

#### Rule 8: Safety First

**Enforceability**: **HIGH** (can detect safety violations)

**Detection Methods**:
- Check against safety constraints from instructor profile
- Detect inappropriate content
- Verify content policy compliance

**Prevention Methods**:
- Reject immediately if safety violation
- Use safe fallback response

**Current Status**: ❌ **NOT ENFORCED** (validation not implemented)

---

### Summary: Rule Enforceability

| Rule | Enforceability | Current Status | Can Be Enforced? |
|------|---------------|----------------|------------------|
| 1. No Direct Answers | MEDIUM | ❌ Not Enforced | ✅ Yes (with detection) |
| 2. Verify Understanding | HIGH | ❌ Not Enforced | ✅ Yes (easy) |
| 3. Use Questions | MEDIUM | ❌ Not Enforced | ✅ Yes (with detection) |
| 4. Gentle Corrections | LOW | ❌ Not Enforced | ⚠️ Hard (subjective) |
| 5. Build on Prior Knowledge | LOW | ⚠️ Partial | ⚠️ Hard (context-dependent) |
| 6. Adjust Guidance | LOW | ⚠️ Partial | ⚠️ Hard (requires assessment) |
| 7. Style Consistency | MEDIUM | ❌ Not Enforced | ✅ Yes (with detection) |
| 8. Safety First | HIGH | ❌ Not Enforced | ✅ Yes (critical) |

**Conclusion**: **Most rules are enforceable but none are currently enforced.**

---

## 5. Failure Scenarios

### Scenario 1: Instructor Identity Drift

**Trigger**: Instructor profile updated mid-session

**What Happens**:
1. Session starts with Profile A (Socratic method)
2. Admin updates Profile A to use direct instruction
3. Next message loads updated Profile A
4. Instructor suddenly changes teaching style

**Impact**: 
- Learner confusion
- Inconsistent experience
- Loss of trust

**Prevention**: 
- Snapshot profile at session start
- Version profiles
- Make profiles immutable during active sessions

---

### Scenario 2: Direct Answer Given (No Enforcement)

**Trigger**: LLM gives direct answer despite teaching rules

**What Happens**:
1. Learner asks: "What's the answer?"
2. LLM responds: "The answer is x = 4"
3. ResponseValidator returns `{ isValid: true }` (all checks TODO)
4. Response sent to learner

**Impact**:
- Teaching rule violated
- Learner doesn't learn
- System fails core purpose

**Prevention**:
- Implement validation checks
- Regenerate if direct answer detected
- Use fallback response

---

### Scenario 3: Interruption Race Condition

**Trigger**: User interrupts streaming response

**What Happens**:
1. User submits answer A
2. Backend starts LLM generation
3. User cancels and submits answer B
4. Frontend closes SSE
5. Backend completes answer A (unaware of cancellation)
6. Backend updates memory with answer A insights
7. Backend processes answer B
8. Memory contains insights from cancelled answer A

**Impact**:
- Corrupted learner memory
- Wasted LLM API calls
- Inconsistent state

**Prevention**:
- Implement cancellation tokens
- Deduplicate requests
- Don't update memory if cancelled

---

### Scenario 4: Hallucination Not Detected

**Trigger**: LLM provides out-of-scope information

**What Happens**:
1. Session topic: Basic algebra
2. Learner asks about quadratic equations
3. LLM responds with advanced calculus concepts
4. ResponseValidator.checkHallucination() returns `[]` (not implemented)
5. Response sent to learner

**Impact**:
- Learner confused by advanced concepts
- Learning path disrupted
- Incorrect information provided

**Prevention**:
- Implement hallucination detection
- Check response against session scope
- Reject out-of-scope responses

---

### Scenario 5: Style Inconsistency Across Sessions

**Trigger**: Same instructor profile behaves differently

**What Happens**:
1. Session 1: Instructor uses Socratic method (as per profile)
2. Session 2: Same profile, but instructor gives direct answers
3. No validation detects style deviation
4. Learner experiences inconsistent instructor

**Impact**:
- Loss of instructor identity
- Confusing experience
- Unreliable teaching

**Prevention**:
- Implement style deviation detection
- Use instructor profile in prompt assembly
- Validate consistency

---

### Scenario 6: Safety Constraint Violation

**Trigger**: LLM generates inappropriate content

**What Happens**:
1. Instructor profile has safety constraints
2. LLM generates content violating constraints
3. ResponseValidator.checkSafetyConstraints() returns `[]` (not implemented)
4. Inappropriate content sent to learner

**Impact**:
- Safety violation
- Harmful content exposed
- Legal/ethical issues

**Prevention**:
- Implement safety checks (CRITICAL)
- Reject immediately if violation
- Use safe fallback

---

### Scenario 7: Memory Corruption from Cancelled Requests

**Trigger**: Multiple rapid submissions with cancellations

**What Happens**:
1. User submits answer A → cancelled
2. User submits answer B → cancelled
3. User submits answer C → completed
4. Memory updated with insights from A, B, C (even though A and B were cancelled)

**Impact**:
- Corrupted learner memory
- Incorrect progress tracking
- Wrong concept mastery assessment

**Prevention**:
- Track request IDs
- Only update memory for completed requests
- Deduplicate insights

---

### Scenario 8: No Verification Questions (Rule Violation)

**Trigger**: LLM responds without verification questions

**What Happens**:
1. Learner submits answer
2. LLM responds with guidance but no questions
3. ResponseValidator.checkVerificationQuestions() returns `[]` (not implemented)
4. Response sent without verification

**Impact**:
- Teaching rule violated
- No understanding check
- Learner may proceed without comprehension

**Prevention**:
- Implement verification question check
- Regenerate if missing
- Add questions to fallback

---

## Summary: Critical Issues

### 1. Identity Stability: ⚠️ **ASSUMED BUT NOT GUARANTEED**
- Profile loaded but not used in prompt assembly
- No session-level profile snapshot
- No versioning or immutability

### 2. Safe Interruption: ❌ **NOT SAFE**
- Backend can't be interrupted
- No cancellation mechanism
- Memory updates happen even if cancelled

### 3. Power vs Constraints: ❌ **OVERPOWERED**
- All validation is TODO (not implemented)
- No teaching rules enforced
- Instructor completely unconstrained

### 4. Rule Enforceability: ❌ **ASPIRATIONAL ONLY**
- Rules documented but not enforced
- Most rules are enforceable but none implemented
- Only LLM training prevents violations (unreliable)

---

## Recommendations

### Immediate Fixes (Critical)

1. **Implement Validation Checks**:
   - Start with safety constraints (CRITICAL)
   - Add direct answer detection
   - Add verification question check
   - Add style deviation detection

2. **Implement Prompt Assembly**:
   - Use instructor profile in prompt construction
   - Load instructor-specific prompts
   - Apply teaching patterns

3. **Add Cancellation Support**:
   - Implement cancellation tokens
   - Use streaming LLM adapter
   - Don't update memory if cancelled

4. **Snapshot Instructor Profile**:
   - Store profile snapshot at session start
   - Use snapshot throughout session
   - Prevent mid-session profile changes

### Architecture Changes

1. **Request Deduplication**:
   - Track active requests
   - Cancel previous request when new one arrives
   - Only process latest request

2. **Memory Update Safety**:
   - Only update memory for completed requests
   - Track request IDs
   - Rollback on cancellation

3. **Validation Pipeline**:
   - Implement all validation checks
   - Add fallback regeneration
   - Log violations for monitoring

---

## Conclusion

**The AI Instructor design has fundamental gaps:**

- ❌ **Identity stability**: Assumed but not guaranteed
- ❌ **Safe interruption**: Not safe, no cancellation mechanism
- ❌ **Power constraints**: Overpowered, no validation
- ❌ **Rule enforcement**: Aspirational only, not enforced

**The instructor is currently a "black box" with no guarantees about behavior. Teaching rules are suggestions, not requirements.**

**Critical actions needed**:
1. Implement validation (especially safety)
2. Use instructor profile in prompts
3. Add cancellation support
4. Snapshot profiles at session start
