# MVP Scope Audit

## Executive Summary

**Critical Finding**: Current scope is **significantly over-engineered** for MVP. The system has **extensive documentation** but **zero implementation**. Many features are **nice-to-have** but not essential for first web launch. Core value can be delivered with **~30% of current scope**.

---

## MVP Definition

**Minimum Viable Product**: A web-based AI instructor that:
1. Presents a learning problem
2. Accepts learner answers
3. Provides guided feedback (not direct answers)
4. Tracks basic progress
5. Allows progression when ready

**Core Value**: Personalized AI instruction that guides learning, not gives answers.

---

## Current Scope Analysis

### What Exists
- **Documentation**: 15+ architecture documents
- **Backend**: Types only, all logic is TODO (114 TODOs found)
- **Frontend**: Doesn't exist
- **User Flow**: 15 steps across 5 phases
- **Screen Types**: 7 different screen types
- **Features**: Many advanced features documented

### What's Implemented
- **Backend Types**: TypeScript interfaces defined
- **LLM Adapter Interface**: Abstract interface (not implemented)
- **Storage Adapter Interface**: Abstract interface (not implemented)
- **Prompt Files**: 6 system prompt files (not used)
- **Nothing Else**: All logic is TODO

---

## KEEP: Essential for MVP

### 1. Core Learning Loop

**What**: Single lesson screen where learner submits answers and gets feedback.

**Why Essential**:
- Core value proposition
- Demonstrates AI instruction
- Proves teaching approach works

**MVP Scope**:
- One screen type: "Guided Practice"
- Submit answer → Get feedback loop
- Basic progress tracking (attempts, can proceed)

**Implementation**:
- `POST /lessons/{screenId}/submit` endpoint
- SSE streaming for feedback
- Basic progress response

---

### 2. Basic Session Management

**What**: Create session, track session state, end session.

**Why Essential**:
- Required for any multi-step interaction
- Enables progress tracking
- Basic web app requirement

**MVP Scope**:
- `POST /sessions` (start session)
- `GET /sessions/{id}` (get session)
- `PATCH /sessions/{id}/end` (end session)
- Session state: `active`, `completed`

**Implementation**:
- Basic session CRUD
- Session state tracking
- Link session to learner

---

### 3. Instructor Response Generation

**What**: Generate instructor feedback from learner answers.

**Why Essential**:
- Core product feature
- Demonstrates AI instruction
- Proves teaching quality

**MVP Scope**:
- Basic prompt assembly (system prompts only)
- LLM call (single provider)
- Return feedback text
- SSE streaming

**Implementation**:
- Load system prompts
- Assemble basic prompt
- Call LLM adapter
- Stream response

---

### 4. Basic Progress Tracking

**What**: Track attempts, determine if can proceed.

**Why Essential**:
- Enables progression
- Shows learning value
- Basic UX requirement

**MVP Scope**:
- Attempt count
- Can proceed (boolean)
- Basic mastery check (attempts >= threshold)

**Implementation**:
- Track attempts per screen
- Simple threshold check
- Return progress in response

---

### 5. Basic Error Handling

**What**: Handle LLM failures, network errors, timeouts.

**Why Essential**:
- Required for production
- Prevents broken UX
- Enables retry

**MVP Scope**:
- LLM error → Return safe fallback message
- Network error → Show error, allow retry
- Timeout → Show timeout, allow retry

**Implementation**:
- Try/catch around LLM call
- Safe fallback response
- Error response format
- Frontend error display

---

### 6. Basic Constraints

**What**: Rate limiting, basic attempt limits.

**Why Essential**:
- Prevents abuse
- Ensures learning integrity
- Basic security

**MVP Scope**:
- Rate limit: 6 requests/minute
- Max attempts: 5 per screen
- Cooldown: 10 seconds between attempts

**Implementation**:
- Server-side rate limiting
- Attempt counting
- Cooldown validation

---

### 7. Frontend Basics

**What**: Web UI for lesson screen.

**Why Essential**:
- Required for web launch
- User interface
- Core product

**MVP Scope**:
- Single lesson screen component
- Answer input field
- Submit button
- Feedback display area
- Basic progress indicator

**Implementation**:
- React/Next.js app
- Single screen route
- Basic form handling
- SSE client for streaming

---

## CUT: Remove Without Harming Core Value

### 1. Level Assessment Flow

**What**: Multi-step assessment to determine learner level.

**Why Cut**:
- Not essential for MVP
- Can start with fixed level
- Adds significant complexity
- Can be added later

**Current Scope**:
- Assessment intro screen
- Assessment question screen (multiple)
- Assessment complete screen
- Level determination logic

**MVP Alternative**: Start all learners at beginner level, skip assessment.

**Complexity Saved**: ~3 screens, assessment logic, level determination.

---

### 2. Multiple Screen Types

**What**: 7 different screen types (introduction, guided practice, independent practice, assessment, mastery check, misconception correction, completion).

**Why Cut**:
- MVP can use single screen type
- Multiple types add complexity
- Can add types incrementally

**Current Scope**:
- Concept Introduction
- Guided Practice
- Independent Practice
- Assessment
- Mastery Check
- Misconception Correction
- Session Completion

**MVP Alternative**: Single "Guided Practice" screen type only.

**Complexity Saved**: 6 screen types, multiple UI components, different flows.

---

### 3. Dashboard

**What**: Learner dashboard showing progress, mastered concepts, active sessions.

**Why Cut**:
- Not essential for MVP
- Can start directly in lesson
- Adds complexity
- Can be added later

**Current Scope**:
- Progress visualization
- Mastered concepts display
- Active sessions list
- Session selection

**MVP Alternative**: Direct entry to lesson, no dashboard.

**Complexity Saved**: Dashboard UI, progress visualization, session management UI.

---

### 4. Learner Registration

**What**: Registration form collecting name, subject, learning goals.

**Why Cut**:
- Can use anonymous sessions
- Adds complexity
- Not core to learning experience

**Current Scope**:
- Registration form
- Learner profile creation
- Learning goals selection

**MVP Alternative**: Anonymous sessions, no registration.

**Complexity Saved**: Registration UI, profile management, goal tracking.

---

### 5. Advanced Memory System

**What**: Long-term learner memory with concepts, misconceptions, strengths, weaknesses, progress markers, session summaries.

**Why Cut**:
- MVP can use session-scoped memory only
- Advanced memory adds complexity
- Can add incrementally

**Current Scope**:
- Learned concepts tracking
- Misconception tracking
- Strengths/weaknesses
- Progress markers
- Session summaries
- Cross-session memory

**MVP Alternative**: Session-scoped memory only (what learned in this session).

**Complexity Saved**: Memory persistence, cross-session tracking, memory analysis.

---

### 6. Multiple Instructor Profiles

**What**: Different instructor profiles with different teaching styles.

**Why Cut**:
- MVP can use single instructor profile
- Multiple profiles add complexity
- Not core value

**Current Scope**:
- Instructor profile management
- Profile selection
- Style variations
- Profile persistence

**MVP Alternative**: Single default instructor profile.

**Complexity Saved**: Profile management, profile selection UI, style variations.

---

### 7. Advanced Constraint Enforcement

**What**: Complex constraints (minimum time, required attempts, mastery thresholds, prerequisites, cooldowns).

**Why Cut**:
- MVP can use simple constraints
- Complex constraints add complexity
- Can add incrementally

**Current Scope**:
- Minimum time on screen
- Required attempts
- Mastery thresholds
- Prerequisites
- Cooldown periods
- Multi-layer enforcement

**MVP Alternative**: Simple rate limiting and attempt limits only.

**Complexity Saved**: Time tracking, prerequisite validation, mastery calculation, constraint UI.

---

### 8. Session Recovery/Resume

**What**: Save state, resume on refresh, recover from interruption.

**Why Cut**:
- Not essential for MVP
- Adds significant complexity
- Can be added later

**Current Scope**:
- State persistence
- Session recovery
- Progress restoration
- Draft saving

**MVP Alternative**: Sessions are ephemeral, start fresh each time.

**Complexity Saved**: State persistence, recovery logic, progress restoration.

---

### 9. Advanced Validation

**What**: Response validation with regeneration, fallback prompts, multiple retries.

**Why Cut**:
- MVP can use basic validation
- Advanced validation adds complexity
- Can add incrementally

**Current Scope**:
- Hallucination detection
- Style deviation detection
- Direct answer detection
- Regeneration logic
- Fallback prompts

**MVP Alternative**: Basic safety checks only, simple fallback.

**Complexity Saved**: Validation logic, regeneration, fallback assembly.

---

### 10. Screen Unlock System

**What**: Prerequisites, unlock requirements, screen progression.

**Why Cut**:
- MVP can use linear progression
- Unlock system adds complexity
- Can add later

**Current Scope**:
- Prerequisite tracking
- Unlock validation
- Unlock requirements display
- Screen progression logic

**MVP Alternative**: Linear screen progression (screen 1 → 2 → 3).

**Complexity Saved**: Prerequisite validation, unlock logic, requirement tracking.

---

### 11. Hint System

**What**: Progressive hints, hint levels, hint limits.

**Why Cut**:
- Not essential for MVP
- Adds complexity
- Can be added later

**Current Scope**:
- Hint request endpoint
- Progressive hints
- Hint levels
- Hint limits

**MVP Alternative**: No hints, just feedback on answers.

**Complexity Saved**: Hint generation, hint levels, hint tracking.

---

### 12. Misconception Correction

**What**: Detect misconceptions, correction screen, misconception tracking.

**Why Cut**:
- Not essential for MVP
- Adds complexity
- Can be added later

**Current Scope**:
- Misconception detection
- Correction screen
- Misconception tracking
- Correction logic

**MVP Alternative**: General feedback only, no misconception-specific handling.

**Complexity Saved**: Misconception detection, correction screen, tracking.

---

### 13. Advanced Progress Visualization

**What**: Progress bars, concept maps, mastery indicators, unlock requirements.

**Why Cut**:
- MVP can use simple progress
- Advanced visualization adds complexity
- Can add later

**Current Scope**:
- Progress bars
- Concept maps
- Mastery indicators
- Unlock requirements display
- Progress percentages

**MVP Alternative**: Simple "X attempts, can proceed: yes/no".

**Complexity Saved**: Visualization components, progress calculation, UI complexity.

---

### 14. Chat API

**What**: Generic message-based API (`POST /sessions/{id}/messages`).

**Why Cut**:
- Conflicts with lesson-focused API
- Not needed if using lesson API
- Adds confusion

**Current Scope**:
- Message-based endpoints
- Chat-like interaction
- Message history

**MVP Alternative**: Use lesson-focused API only.

**Complexity Saved**: Duplicate API, message management, chat UI.

---

### 15. Offline Support

**What**: Draft saving, offline queue, sync when online.

**Why Cut**:
- Not essential for MVP
- Adds significant complexity
- Can be added later

**Current Scope**:
- LocalStorage persistence
- Offline queue
- Sync logic
- Conflict resolution

**MVP Alternative**: Online-only, no offline support.

**Complexity Saved**: Offline logic, sync, conflict resolution.

---

## DEFER: Important But Not MVP

### 1. Independent Practice Screen

**What**: Practice without immediate guidance.

**Why Defer**:
- Nice-to-have feature
- Can add after MVP
- Adds screen type complexity

**When to Add**: After MVP validates core concept.

---

### 2. Assessment Screen

**What**: Formal assessment with no hints.

**Why Defer**:
- Nice-to-have feature
- Can add after MVP
- Adds screen type complexity

**When to Add**: After MVP validates core concept.

---

### 3. Mastery Check Screen

**What**: Final verification and reflection.

**Why Defer**:
- Nice-to-have feature
- Can add after MVP
- Adds screen type complexity

**When to Add**: After MVP validates core concept.

---

### 4. Advanced Progress Tracking

**What**: Detailed progress, mastery scores, concept tracking.

**Why Defer**:
- Can use simple progress for MVP
- Advanced tracking adds complexity
- Can add incrementally

**When to Add**: After MVP validates learning effectiveness.

---

### 5. Session Recovery

**What**: Resume interrupted sessions.

**Why Defer**:
- Not essential for MVP
- Adds complexity
- Can be added after MVP

**When to Add**: After MVP validates user retention needs.

---

### 6. Advanced Validation

**What**: Full validation with regeneration, fallback prompts.

**Why Defer**:
- Can use basic validation for MVP
- Advanced validation adds complexity
- Can add incrementally

**When to Add**: After MVP validates teaching quality needs.

---

### 7. Multiple Instructor Profiles

**What**: Different teaching styles.

**Why Defer**:
- Single profile sufficient for MVP
- Multiple profiles add complexity
- Can add after MVP

**When to Add**: After MVP validates instructor value.

---

### 8. Level Assessment

**What**: Determine learner level before starting.

**Why Defer**:
- Can start with fixed level
- Assessment adds complexity
- Can add after MVP

**When to Add**: After MVP validates personalization value.

---

### 9. Advanced Constraints

**What**: Minimum time, required attempts, mastery thresholds.

**Why Defer**:
- Simple constraints sufficient for MVP
- Advanced constraints add complexity
- Can add incrementally

**When to Add**: After MVP validates constraint effectiveness.

---

### 10. Multi-Tab Support

**What**: Handle multiple tabs, sync state.

**Why Defer**:
- Not essential for MVP
- Adds complexity
- Can be added later

**When to Add**: After MVP validates multi-tab usage.

---

## MVP Scope Summary

### KEEP (Essential)

1. **Core Learning Loop**
   - Single "Guided Practice" screen
   - Submit answer → Get feedback
   - Basic progress (attempts, can proceed)

2. **Basic Session Management**
   - Start session
   - Get session
   - End session

3. **Instructor Response Generation**
   - Basic prompt assembly
   - LLM call
   - SSE streaming

4. **Basic Progress Tracking**
   - Attempt count
   - Can proceed (boolean)

5. **Basic Error Handling**
   - LLM error → Fallback
   - Network error → Retry
   - Timeout → Error message

6. **Basic Constraints**
   - Rate limiting (6/min)
   - Max attempts (5)
   - Cooldown (10s)

7. **Frontend Basics**
   - Single lesson screen
   - Answer input
   - Submit button
   - Feedback display
   - Basic progress

---

### CUT (Remove)

1. **Level Assessment** → Start with fixed level
2. **Multiple Screen Types** → Single screen type only
3. **Dashboard** → Direct entry to lesson
4. **Learner Registration** → Anonymous sessions
5. **Advanced Memory** → Session-scoped only
6. **Multiple Instructor Profiles** → Single profile
7. **Advanced Constraints** → Simple rate limiting only
8. **Session Recovery** → Ephemeral sessions
9. **Advanced Validation** → Basic safety checks
10. **Screen Unlock System** → Linear progression
11. **Hint System** → No hints
12. **Misconception Correction** → General feedback only
13. **Advanced Progress Visualization** → Simple progress
14. **Chat API** → Lesson API only
15. **Offline Support** → Online-only

---

### DEFER (Add Later)

1. **Independent Practice Screen** → After MVP
2. **Assessment Screen** → After MVP
3. **Mastery Check Screen** → After MVP
4. **Advanced Progress Tracking** → After MVP
5. **Session Recovery** → After MVP
6. **Advanced Validation** → After MVP
7. **Multiple Instructor Profiles** → After MVP
8. **Level Assessment** → After MVP
9. **Advanced Constraints** → After MVP
10. **Multi-Tab Support** → After MVP

---

## MVP Implementation Scope

### Backend (MVP)

**Essential**:
- `POST /sessions` - Start session
- `GET /sessions/{id}` - Get session
- `POST /lessons/{screenId}/submit` - Submit answer, get feedback
- `PATCH /sessions/{id}/end` - End session
- Basic prompt assembly (system prompts only)
- LLM adapter (single provider)
- Basic error handling (try/catch, fallback)
- Rate limiting (simple)
- Attempt counting

**Cut**:
- Screen unlock validation
- Prerequisite checking
- Advanced memory tracking
- Response validation (use basic)
- Fallback prompt assembly
- Regeneration logic
- Multiple screen types
- Hint system

---

### Frontend (MVP)

**Essential**:
- Landing page → Start session
- Single lesson screen
  - Problem display
  - Answer input
  - Submit button
  - Feedback display (SSE streaming)
  - Basic progress (attempts, can proceed)
  - Next button (when can proceed)
- Basic error handling
- Loading states

**Cut**:
- Dashboard
- Registration
- Assessment flow
- Multiple screen types
- Advanced progress visualization
- Constraint UI (just disable button)
- Session recovery
- Offline support

---

### Shared (MVP)

**Essential**:
- Session types
- Basic lesson types
- API request/response types

**Cut**:
- Advanced domain models
- Complex constraint types
- Screen unlock types
- Memory types (use session-scoped)

---

## Complexity Reduction

### Current Scope Complexity

**User Flow**: 15 steps across 5 phases
**Screen Types**: 7 different types
**API Endpoints**: 12+ endpoints
**Domain Models**: 10+ entities
**Frontend Components**: 20+ components
**State Management**: 5+ stores
**Constraints**: 8+ constraint types

**Estimated Implementation**: 3-6 months

---

### MVP Scope Complexity

**User Flow**: 3 steps (start → practice → complete)
**Screen Types**: 1 type (guided practice)
**API Endpoints**: 4 endpoints
**Domain Models**: 3 entities (Session, Lesson, Message)
**Frontend Components**: 5 components
**State Management**: 1 store (session)
**Constraints**: 2 constraints (rate limit, attempts)

**Estimated Implementation**: 2-4 weeks

---

## MVP Value Proposition

**With MVP**:
- ✅ AI instructor provides guided feedback
- ✅ Learner submits answers and gets help
- ✅ Basic progress tracking
- ✅ Can complete a lesson
- ✅ Demonstrates core value

**Without Cut Features**:
- ⚠️ No level assessment (start at beginner)
- ⚠️ No dashboard (direct entry)
- ⚠️ No advanced progress (simple tracking)
- ⚠️ No session recovery (start fresh)
- ⚠️ No multiple screen types (one type)

**Trade-off**: Simpler product, faster launch, validates core concept.

---

## Recommendations

### Immediate Actions

1. **Cut 70% of Scope**:
   - Remove level assessment
   - Remove multiple screen types
   - Remove dashboard
   - Remove registration
   - Remove advanced features

2. **Focus on Core Loop**:
   - Single screen type
   - Submit → Feedback
   - Basic progress
   - Simple constraints

3. **Implement MVP First**:
   - Build working MVP
   - Validate core concept
   - Add features incrementally

### MVP Success Criteria

**MVP is successful if**:
- ✅ User can start a session
- ✅ User can submit answers
- ✅ User receives guided feedback (not direct answers)
- ✅ User can complete a lesson
- ✅ Basic progress is tracked
- ✅ System handles errors gracefully

**MVP does NOT need**:
- ❌ Level assessment
- ❌ Multiple screen types
- ❌ Dashboard
- ❌ Advanced progress
- ❌ Session recovery
- ❌ Advanced validation

---

## Conclusion

**Current scope is 3-5x larger than needed for MVP.**

**MVP Scope**: ~30% of current scope
- Single screen type
- Basic learning loop
- Simple progress
- Basic error handling

**Cut**: ~50% of current scope
- Level assessment
- Multiple screen types
- Dashboard
- Advanced features

**Defer**: ~20% of current scope
- Advanced screens
- Advanced progress
- Session recovery
- Advanced validation

**Recommendation**: **Cut aggressively, build MVP, validate, then add features incrementally.**
