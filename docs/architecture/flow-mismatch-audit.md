# User Flow vs System Execution Flow Comparison

## Executive Summary

**Critical Finding**: There are **fundamental mismatches** between the documented user learning flow and the actual system execution flow. The backend implementation assumes **chat-like interactions**, while the user flow describes **structured lesson progression**. This creates hidden coupling and prevents frontend control.

---

## 1. Mismatches Between Lesson Progression and API Design

### Mismatch 1: User Flow Describes Screens, Backend Processes Messages

**User Flow (Step 10: Guided Practice Screen)**:
```
User Actions:
- Read practice problem
- Attempt solution
- Submit answer
- Receive instructor feedback
- Revise approach based on feedback

System Actions:
- Present practice problem
- Validate attempt format
- Generate instructor guidance
- Track attempts
- Update progress
```

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:47
async processLearnerMessage(
  sessionId: string,
  learnerMessageContent: string  // ❌ Just message content, no screen context
): Promise<string>  // ❌ Returns string, not structured lesson state
```

**Problem**: User flow describes screen-based progression, but backend processes generic messages without screen context.

**Impact**: Backend can't enforce screen-specific constraints, can't track screen progress, can't determine next screen.

---

### Mismatch 2: User Flow Shows Screen Transitions, Backend Doesn't Know About Screens

**User Flow (Step 9 → Step 10)**:
```
Step 9: Concept Introduction Screen
  ↓ (learner demonstrates understanding)
Step 10: Guided Practice Screen
```

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts
// No screenId parameter
// No screen state tracking
// No screen transition logic
// No prerequisite checking
```

**Problem**: User flow shows screen transitions, but backend has no concept of screens.

**Impact**: Frontend must track screen state separately, backend can't validate transitions.

---

### Mismatch 3: User Flow Describes Structured Actions, Backend Processes Free-Form Text

**User Flow (Step 10: Guided Practice)**:
```
User Actions:
- Submit answer  // ❌ Structured action
- Receive feedback
- Revise approach
```

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:47
async processLearnerMessage(
  sessionId: string,
  learnerMessageContent: string  // ❌ Free-form text, not structured answer
): Promise<string>
```

**Problem**: User flow describes structured actions (submit answer, request hint), but backend processes free-form messages.

**Impact**: Backend can't distinguish between answer submission and question asking.

---

### Mismatch 4: User Flow Shows Mastery-Based Progression, Backend Doesn't Check Mastery

**User Flow (Step 10 → Step 11)**:
```
Step 10: Guided Practice Screen
  ↓ (mastery threshold met)
Step 11: Independent Practice Screen
```

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:211
return rawResponse;  // ❌ Just returns text, no mastery check
// No mastery assessment
// No progression logic
// No screen unlock logic
```

**Problem**: User flow shows mastery-based progression, but backend doesn't assess mastery or unlock next screens.

**Impact**: Frontend must determine mastery and unlock status, backend can't validate progression.

---

### Mismatch 5: User Flow Shows Constraint Enforcement, Backend Doesn't Enforce Constraints

**User Flow (Step 10: Constraints)**:
```
Constraints:
- Minimum time on screen
- Required attempts before proceeding
- Cooldown between attempts
- Maximum attempts limit
```

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts
// No constraint checking
// No time validation
// No attempt counting
// No cooldown enforcement
```

**Problem**: User flow describes constraints, but backend doesn't enforce them.

**Impact**: Frontend must enforce all constraints, backend can't validate.

---

### Mismatch 6: Two Conflicting API Designs

**User Flow References**:
- `POST /sessions/{id}/screens/{id}/interactions` (from user-flow.md:510)

**API Contracts**:
- `api-contracts.md`: `POST /sessions/{sessionId}/messages` (chat-like)
- `api-contracts-lesson-focused.md`: `POST /lessons/{screenId}/submit` (lesson-focused)

**Problem**: User flow references one API, but two different API contracts exist.

**Impact**: Confusion about which API to use, inconsistent implementation.

---

## 2. Backend-Driven Flows That Should Be Frontend-Controlled

### Violation 1: Backend Determines Next Action (Should Be Frontend)

**User Flow (Step 10: Feedback Loop)**:
```
1. Learner submits attempt
   ↓
2. Instructor provides guidance
   ↓
3. Learner revises and resubmits
   ↓
4. Repeat until mastery threshold met
   ↓
5. Screen unlocks next screen  // ❌ Backend decides
```

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:211
return rawResponse;  // ❌ Backend returns response, frontend must decide next action
```

**Problem**: Backend returns response, but frontend must decide:
- Should learner revise?
- Is mastery achieved?
- Can proceed to next screen?

**Should Be**: Frontend controls pacing, backend validates constraints.

**Impact**: Frontend must implement progression logic that should be backend's responsibility.

---

### Violation 2: Backend Processes All Messages Sequentially (Should Be Screen-Scoped)

**User Flow (Step 9: Concept Introduction)**:
```
Interaction Types:
- Question: Learner asks clarifying question → Instructor responds
- Understanding Check: Learner indicates understanding → Move to practice
```

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:75
const messageHistory = await this.storageAdapter.loadMessages(
  session.messageIds  // ❌ All messages in session, not screen-scoped
);
```

**Problem**: Backend loads all session messages, not screen-specific interactions.

**Should Be**: Backend processes screen-scoped interactions, frontend controls screen flow.

**Impact**: Backend can't distinguish between interactions on different screens.

---

### Violation 3: Backend Updates Memory After Every Message (Should Be Screen-Based)

**User Flow (Step 13: Mastery Check)**:
```
System Actions:
- Confirm mastery achievement
- Update learner memory
- Mark concept as mastered
- Unlock next concepts
```

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:192
// Step 7: Update learner memory
const learningInsights = this.analyzeInteraction(...);
const updatedMemory = this.updateLearnerMemory(...);
await this.storageAdapter.saveLearnerMemory(updatedMemory);
// ❌ Updates memory after every message, not screen completion
```

**Problem**: Backend updates memory after every message, not after screen completion.

**Should Be**: Backend updates memory after screen completion, frontend controls when to complete.

**Impact**: Memory updated too frequently, can't track screen-level progress.

---

### Violation 4: Backend Doesn't Return Progress State (Frontend Must Track)

**User Flow (Step 10: Progress Tracking)**:
```
System Actions:
- Track attempts
- Update progress
- Check mastery threshold
```

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:211
return rawResponse;  // ❌ Just returns text, no progress state
```

**Problem**: Backend doesn't return progress state, frontend must track separately.

**Should Be**: Backend returns progress state with every response.

**Impact**: Frontend must make separate API calls to get progress, sync issues.

---

### Violation 5: Backend Determines Response Type (Should Be Context-Aware)

**User Flow (Step 10: Different Feedback Types)**:
```
Feedback Types:
1. Guidance Feedback: Hints, leading questions
2. Correction Feedback: Addresses misconceptions
3. Progress Feedback: Shows what's correct
4. Mastery Feedback: Confirms understanding
```

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:177
messageType: this.classifyInstructorMessage(rawResponse),  // ❌ Classifies after generation
```

**Problem**: Backend classifies response type after generation, not based on screen context.

**Should Be**: Backend generates response type based on screen type and interaction context.

**Impact**: Response type may not match screen needs (assessment vs practice).

---

## 3. Hidden Coupling Between Session Logic and UI Assumptions

### Coupling 1: Backend Assumes Message Thread (UI Assumes Screens)

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:75
const messageHistory = await this.storageAdapter.loadMessages(
  session.messageIds  // ❌ Assumes linear message thread
);
```

**UI Assumption**:
- Screens have their own interaction history
- Messages are scoped to screens
- Screen transitions are explicit

**Hidden Coupling**: Backend loads all session messages, but UI expects screen-scoped interactions.

**Impact**: Backend can't distinguish between interactions on different screens.

---

### Coupling 2: Backend Returns Plain Text (UI Needs Structured State)

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:211
return rawResponse;  // ❌ Plain text
```

**UI Needs**:
- Progress updates
- Constraint state
- Navigation state
- Screen unlock status
- Mastery score

**Hidden Coupling**: Backend returns text, but UI needs structured state.

**Impact**: Frontend must parse text or make additional API calls.

---

### Coupling 3: Backend Processes Synchronously (UI Needs Async Feedback)

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:114
const llmResponse = await this.llmAdapter.generate({
  prompt: fullPrompt,
});
rawResponse = llmResponse.content;  // ❌ Waits for complete response
```

**UI Needs**:
- Streaming responses (SSE)
- Progressive rendering
- Real-time feedback
- Loading states

**Hidden Coupling**: Backend waits for complete response, but UI needs streaming.

**Impact**: Poor UX (long wait times, no progressive feedback).

---

### Coupling 4: Backend Doesn't Know About Screen Types (UI Renders Differently)

**User Flow (Step 9 vs Step 12)**:
```
Step 9: Concept Introduction Screen
  - User can ask questions
  - User indicates understanding

Step 12: Assessment Screen
  - No hints or help
  - Single attempt
  - Time limit
```

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:47
async processLearnerMessage(
  sessionId: string,
  learnerMessageContent: string  // ❌ No screen type context
): Promise<string>
```

**Hidden Coupling**: Backend processes all interactions the same way, but UI renders differently based on screen type.

**Impact**: Backend can't enforce screen-specific rules (no hints in assessment).

---

### Coupling 5: Backend Updates Session After Every Message (UI Controls Screen Completion)

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:187
await this.storageAdapter.updateSession(sessionId, {
  messageIds: finalMessageIds,
  lastActivityAt: new Date(),  // ❌ Updates after every message
});
```

**UI Flow**:
```
Step 10: Guided Practice Screen
  - Multiple attempts
  - Frontend controls when screen is complete
  - User clicks "Complete" button
```

**Hidden Coupling**: Backend updates session after every message, but UI controls screen completion.

**Impact**: Session state updated too frequently, doesn't match UI flow.

---

### Coupling 6: Backend Classifies Messages (UI Knows Interaction Type)

**Backend Implementation**:
```typescript
// backend/core/SessionOrchestrator.ts:86
messageType: this.classifyMessage(learnerMessageContent),  // ❌ Classifies from content
```

**UI Flow**:
```
Step 10: Guided Practice Screen
  - User clicks "Submit Answer" button  // UI knows it's an answer
  - User clicks "Request Hint" button   // UI knows it's a hint request
```

**Hidden Coupling**: Backend classifies from content, but UI already knows interaction type.

**Impact**: Redundant classification, potential mismatches.

---

## Concrete Examples of Mismatches

### Example 1: Guided Practice Screen Flow

**User Flow Says**:
```
Step 10: Guided Practice Screen
1. User reads problem
2. User submits answer (structured action)
3. Instructor provides guidance (SSE stream)
4. User revises and resubmits
5. Repeat until mastery achieved
6. Screen unlocks next screen
```

**Backend Actually Does**:
```typescript
// backend/core/SessionOrchestrator.ts
processLearnerMessage(sessionId, "I think x = 4")
  → Loads all session messages
  → Assembles prompt with conversation history
  → Calls LLM
  → Returns plain text response
  → Updates memory
  // ❌ No screen context
  // ❌ No mastery check
  // ❌ No progression logic
  // ❌ No constraint enforcement
```

**Mismatch**: User flow describes structured screen progression, backend processes generic messages.

---

### Example 2: Assessment Screen Flow

**User Flow Says**:
```
Step 12: Assessment Screen
- No hints or help during assessment
- Time limit (optional)
- Single attempt (or limited retries)
- Submit all answers
- Wait for evaluation
- Results shown
```

**Backend Actually Does**:
```typescript
// backend/core/SessionOrchestrator.ts
processLearnerMessage(sessionId, "My answer is x = 4")
  → Processes like any other message
  → No assessment-specific logic
  → No attempt limiting
  → No time limit checking
  // ❌ Can't enforce "no hints" rule
  // ❌ Can't limit attempts
  // ❌ Can't check time limit
```

**Mismatch**: User flow describes assessment-specific rules, backend processes generically.

---

### Example 3: Screen Transition Flow

**User Flow Says**:
```
Step 10: Guided Practice Screen
  ↓ (mastery achieved)
Step 11: Independent Practice Screen
```

**Backend Actually Does**:
```typescript
// backend/core/SessionOrchestrator.ts
processLearnerMessage(sessionId, "I think I understand now")
  → Returns instructor response
  → Updates memory
  // ❌ Doesn't check mastery
  // ❌ Doesn't unlock next screen
  // ❌ Doesn't validate prerequisites
```

**Mismatch**: User flow shows screen transitions, backend doesn't handle transitions.

---

### Example 4: Constraint Enforcement Flow

**User Flow Says**:
```
Step 10: Constraints
- Minimum time on screen: 60 seconds
- Required attempts: 1
- Cooldown between attempts: 10 seconds
- Maximum attempts: 5
```

**Backend Actually Does**:
```typescript
// backend/core/SessionOrchestrator.ts
processLearnerMessage(sessionId, "My answer")
  → No time checking
  → No attempt counting
  → No cooldown enforcement
  → No max attempt limiting
  // ❌ Can't enforce any constraints
```

**Mismatch**: User flow describes constraints, backend doesn't enforce them.

---

### Example 5: Progress Tracking Flow

**User Flow Says**:
```
Step 10: System Actions
- Track attempts
- Update progress
- Check mastery threshold
```

**Backend Actually Does**:
```typescript
// backend/core/SessionOrchestrator.ts:211
return rawResponse;  // ❌ Just returns text

// Frontend must:
// - Track attempts separately
// - Calculate progress separately
// - Check mastery separately
// - Make separate API call to get progress
```

**Mismatch**: User flow shows progress tracking, backend doesn't return progress.

---

## Summary: Critical Mismatches

### 1. Architecture Mismatch
- **User Flow**: Screen-based progression
- **Backend**: Message-based processing
- **Impact**: Backend can't support screen-based flow

### 2. Control Mismatch
- **User Flow**: Frontend controls pacing
- **Backend**: Processes all messages sequentially
- **Impact**: Backend-driven flow prevents frontend control

### 3. State Mismatch
- **User Flow**: Screen-scoped interactions
- **Backend**: Session-scoped messages
- **Impact**: Backend can't track screen progress

### 4. Progression Mismatch
- **User Flow**: Mastery-based progression
- **Backend**: No mastery checking
- **Impact**: Frontend must implement progression logic

### 5. Constraint Mismatch
- **User Flow**: Multi-layer constraints
- **Backend**: No constraint enforcement
- **Impact**: Frontend must enforce all constraints

### 6. API Mismatch
- **User Flow**: References screen-based APIs
- **API Contracts**: Two conflicting designs (message vs lesson)
- **Impact**: Confusion, inconsistent implementation

---

## Recommendations

### Immediate Fixes

1. **Unify API Design**: Choose lesson-focused APIs, remove message-based APIs
2. **Add Screen Context**: Backend methods should accept `screenId` and screen type
3. **Return Structured State**: Backend should return progress, constraints, navigation state
4. **Add Mastery Logic**: Backend should assess mastery and unlock next screens
5. **Add Constraint Enforcement**: Backend should enforce screen-specific constraints

### Architecture Changes

1. **Screen-Scoped Interactions**: Backend should process interactions per screen, not per session
2. **Frontend Controls Pacing**: Backend validates, frontend controls when to proceed
3. **Structured Responses**: Backend returns structured state, not plain text
4. **Screen-Specific Logic**: Backend enforces rules based on screen type

---

## Conclusion

**The user learning flow and system execution flow are fundamentally misaligned:**

- ❌ User flow describes screens, backend processes messages
- ❌ User flow shows frontend control, backend drives flow
- ❌ User flow shows structured actions, backend processes free-form text
- ❌ User flow shows mastery progression, backend doesn't check mastery
- ❌ User flow shows constraints, backend doesn't enforce them

**The backend needs significant refactoring to support the documented user flow.**
