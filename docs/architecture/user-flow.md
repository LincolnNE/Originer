# ORIGINER User Flow

## End-to-End Learning Journey

This document describes the complete user flow from entry point through session completion, organized by screen transitions and user interactions.

---

## Flow Overview

```
Entry → Assessment → Lesson Selection → Learning Loop → Completion
  │         │              │                  │              │
  │         │              │                  │              │
  └─────────┴──────────────┴──────────────────┴──────────────┘
```

---

## Detailed User Flow

### Phase 1: Entry & Onboarding

#### Step 1: Landing Screen
**Screen Name**: `landing`
**Purpose**: Initial entry point for new and returning learners

**User Actions**:
- View welcome message
- See value proposition
- Choose to start learning

**System Actions**:
- Check for existing learner session
- Display "Start Learning" or "Continue Session" button

**Next Screen**: If new learner → `learner_registration`, If returning → `dashboard`

---

#### Step 2: Learner Registration (New Learners Only)
**Screen Name**: `learner_registration`
**Purpose**: Collect basic learner information

**User Actions**:
- Enter name (optional)
- Select subject area of interest
- Choose learning goals

**System Actions**:
- Create learner profile
- Initialize empty learner memory
- Generate learner ID

**Next Screen**: `level_assessment_intro`

---

#### Step 3: Dashboard (Returning Learners)
**Screen Name**: `dashboard`
**Purpose**: Overview of learner progress and active sessions

**User Actions**:
- View progress summary
- See mastered concepts
- View active sessions
- Start new session or continue existing

**System Actions**:
- Load learner memory
- Display progress visualization
- Show available sessions

**Next Screen**: `session_selection` or `level_assessment_intro` (if starting new topic)

---

### Phase 2: Level Assessment

#### Step 4: Level Assessment Introduction
**Screen Name**: `level_assessment_intro`
**Purpose**: Explain assessment process and set expectations

**User Actions**:
- Read assessment instructions
- Understand what will be assessed
- Click "Start Assessment"

**System Actions**:
- Explain assessment format
- Set assessment context
- Initialize assessment session

**Next Screen**: `level_assessment_question`

---

#### Step 5: Level Assessment Question Screen
**Screen Name**: `level_assessment_question`
**Purpose**: Present assessment questions to determine learner level

**User Actions**:
- Read question
- Provide answer
- Submit response
- Wait for feedback

**System Actions**:
- Present question appropriate for assessment
- Validate response format
- Generate instructor feedback
- Track assessment responses

**Feedback Loop**:
- Instructor provides guidance without revealing answer
- Asks clarifying questions if needed
- Moves to next question when ready

**Next Screen**: `level_assessment_question` (next question) or `level_assessment_complete` (all questions done)

---

#### Step 6: Level Assessment Complete
**Screen Name**: `level_assessment_complete`
**Purpose**: Show assessment results and recommended starting point

**User Actions**:
- View assessment results
- See recommended starting level
- Review identified strengths/weaknesses
- Click "Start Learning" or "Retake Assessment"

**System Actions**:
- Analyze assessment responses
- Determine learner level
- Update learner memory with initial assessment
- Generate learning path recommendations

**Next Screen**: `lesson_selection` or `level_assessment_intro` (if retaking)

---

### Phase 3: Lesson Selection

#### Step 7: Lesson Selection Screen
**Screen Name**: `lesson_selection`
**Purpose**: Choose learning topic and start lesson session

**User Actions**:
- Browse available topics
- See prerequisites for each topic
- View progress indicators (locked/unlocked)
- Select topic to learn

**System Actions**:
- Load available lessons based on learner level
- Show unlock status (prerequisites met)
- Display progress for previously started topics
- Validate topic selection

**Next Screen**: `session_start` (if topic selected)

---

#### Step 8: Session Start Screen
**Screen Name**: `session_start`
**Purpose**: Initialize new learning session

**User Actions**:
- Review session objectives
- See what will be learned
- Confirm instructor profile (if multiple available)
- Click "Start Session"

**System Actions**:
- Create new session
- Load instructor profile
- Initialize lesson screens for topic
- Set up session context

**Next Screen**: `lesson_screen_introduction` (first screen)

---

### Phase 4: Learning Loop (Lesson Screens)

#### Step 9: Concept Introduction Screen
**Screen Name**: `lesson_screen_introduction`
**Purpose**: Introduce new concept to learner

**User Actions**:
- Read concept introduction
- View examples
- Interact with concept visualization
- Click "I Understand" or ask questions

**System Actions**:
- Present concept introduction
- Provide examples
- Track time spent
- Monitor understanding indicators

**Interaction Types**:
- **Question**: Learner asks clarifying question → Instructor responds via guidance
- **Understanding Check**: Learner indicates understanding → Move to practice

**Next Screen**: `lesson_screen_guided_practice` (when ready) or back to introduction (if questions)

---

#### Step 10: Guided Practice Screen
**Screen Name**: `lesson_screen_guided_practice`
**Purpose**: Practice concept with instructor guidance

**User Actions**:
- Read practice problem
- Attempt solution
- Submit answer
- Receive instructor feedback
- Revise approach based on feedback

**System Actions**:
- Present practice problem
- Validate attempt format
- Generate instructor guidance (not direct answer)
- Track attempts
- Update progress

**Question & Feedback Loop**:
```
1. Learner submits attempt
   ↓
2. Instructor provides guidance (SSE stream)
   - Asks leading questions
   - Points out what's correct
   - Hints at what needs work
   ↓
3. Learner revises and resubmits
   ↓
4. Repeat until mastery threshold met
   ↓
5. Screen unlocks next screen
```

**Constraints**:
- Minimum time on screen
- Required attempts before proceeding
- Cooldown between attempts
- Maximum attempts limit

**Next Screen**: `lesson_screen_guided_practice` (more practice) or `lesson_screen_independent_practice` (mastery achieved)

---

#### Step 11: Independent Practice Screen
**Screen Name**: `lesson_screen_independent_practice`
**Purpose**: Practice without immediate guidance

**User Actions**:
- Solve problems independently
- Submit complete solutions
- Request help if stuck (limited)
- Review feedback after completion

**System Actions**:
- Present independent practice problems
- Validate complete solutions
- Provide feedback after submission
- Track independent mastery

**Question & Feedback Loop**:
```
1. Learner solves problem independently
   ↓
2. Submits complete solution
   ↓
3. Instructor provides assessment feedback
   - What was correct
   - What needs improvement
   - Encouragement
   ↓
4. Learner reviews feedback
   ↓
5. Proceeds to next problem or assessment
```

**Constraints**:
- Limited help requests (e.g., 2 per screen)
- Must complete minimum number of problems
- Mastery threshold to proceed

**Next Screen**: `lesson_screen_independent_practice` (more problems) or `lesson_screen_assessment` (ready for assessment)

---

#### Step 12: Assessment Screen
**Screen Name**: `lesson_screen_assessment`
**Purpose**: Evaluate mastery of concept

**User Actions**:
- Complete assessment problems
- Submit answers
- Wait for evaluation
- View results

**System Actions**:
- Present assessment problems
- Evaluate responses
- Calculate mastery score
- Determine if concept mastered

**Question & Feedback Loop**:
```
1. Learner completes assessment
   ↓
2. Submits all answers
   ↓
3. System evaluates (may include instructor review)
   ↓
4. Results shown:
   - Mastery achieved → Proceed
   - Not yet mastered → Return to practice
```

**Constraints**:
- No hints or help during assessment
- Time limit (optional)
- Single attempt (or limited retries)

**Next Screen**: `lesson_screen_mastery_check` (if passed) or `lesson_screen_guided_practice` (if needs more practice)

---

#### Step 13: Concept Mastery Check Screen
**Screen Name**: `lesson_screen_mastery_check`
**Purpose**: Final verification and reflection

**User Actions**:
- Review what was learned
- Reflect on learning process
- See mastery confirmation
- View next steps

**System Actions**:
- Confirm mastery achievement
- Update learner memory
- Mark concept as mastered
- Unlock next concepts

**Next Screen**: `lesson_screen_introduction` (next concept) or `session_completion` (session complete)

---

#### Step 14: Misconception Correction Screen (Conditional)
**Screen Name**: `lesson_screen_misconception_correction`
**Purpose**: Address specific misconceptions identified

**User Actions**:
- Review misconception explanation
- Understand correct concept
- Practice corrected understanding
- Confirm correction

**System Actions**:
- Identify misconception from responses
- Present correction
- Provide practice opportunities
- Track misconception resolution

**Trigger**: Activated when misconception detected in responses

**Next Screen**: Return to appropriate practice screen

---

### Phase 5: Session Completion

#### Step 15: Session Completion Screen
**Screen Name**: `session_completion`
**Purpose**: Summarize session and show progress

**User Actions**:
- Review session summary
- See concepts learned
- View progress visualization
- Choose next action

**System Actions**:
- Generate session summary
- Update learner memory
- Calculate progress metrics
- Prepare next session recommendations

**Display Information**:
- Concepts introduced
- Concepts mastered
- Misconceptions addressed
- Time spent
- Progress made

**Next Screen**: `dashboard` (view progress) or `lesson_selection` (start new session) or `session_start` (continue related topic)

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENTRY POINT                                  │
│                                                                 │
│  1. Landing Screen                                             │
│     ├─► New Learner ──► 2. Registration                        │
│     └─► Returning ────► 3. Dashboard                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  LEVEL ASSESSMENT                                │
│                                                                 │
│  4. Assessment Intro                                           │
│     └─► 5. Assessment Question (Loop)                          │
│         └─► 6. Assessment Complete                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  LESSON SELECTION                               │
│                                                                 │
│  7. Lesson Selection                                           │
│     └─► 8. Session Start                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LEARNING LOOP                                │
│                                                                 │
│  9. Concept Introduction                                       │
│     └─► 10. Guided Practice (Loop)                            │
│         └─► 11. Independent Practice (Loop)                    │
│             └─► 12. Assessment                                  │
│                 ├─► Pass ──► 13. Mastery Check                │
│                 └─► Fail ──► 10. Guided Practice                │
│                                                                 │
│  [Conditional: 14. Misconception Correction]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SESSION COMPLETION                             │
│                                                                 │
│  15. Session Completion                                         │
│     ├─► Dashboard                                              │
│     ├─► Lesson Selection                                        │
│     └─► Continue Related Topic                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Screen State Transitions

### Screen States

Each lesson screen can be in one of these states:

- **`locked`**: Cannot access (prerequisites not met)
- **`unlocked`**: Can access but not started
- **`active`**: Currently in progress
- **`completed`**: Finished, can proceed
- **`blocked`**: Blocked due to constraint violation

### Transition Rules

```
locked → unlocked: Prerequisites met
unlocked → active: User starts screen
active → completed: Mastery achieved
active → blocked: Constraint violated
blocked → active: Constraint resolved
completed → (next screen unlocked)
```

---

## Question & Feedback Loop Details

### Loop Structure

```
┌─────────────────────────────────────────────────────────────┐
│              QUESTION & FEEDBACK LOOP                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Learner Action                                         │
│     • Submits answer                                        │
│     • Asks question                                         │
│     • Requests help                                          │
│                                                              │
│  2. Frontend Validation                                      │
│     • Input format check                                    │
│     • Cooldown check                                        │
│     • Rate limit check                                      │
│                                                              │
│  3. API Request                                             │
│     POST /sessions/{id}/screens/{id}/interactions          │
│     { stream: true }                                        │
│                                                              │
│  4. Backend Processing                                       │
│     • Constraint validation                                 │
│     • Context assembly                                      │
│     • LLM call                                              │
│                                                              │
│  5. SSE Stream Response                                     │
│     event: message_start                                    │
│     event: content_chunk (multiple)                         │
│     event: message_complete                                 │
│                                                              │
│  6. Frontend Rendering                                      │
│     • Render chunks incrementally                           │
│     • Update progress                                       │
│     • Enable next action                                    │
│                                                              │
│  7. Loop Decision                                           │
│     • Mastery achieved? → Next screen                       │
│     • More practice needed? → Continue loop                 │
│     • Misconception? → Correction screen                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Feedback Types

1. **Guidance Feedback**: Hints, leading questions, encouragement
2. **Correction Feedback**: Addresses misconceptions, clarifies errors
3. **Progress Feedback**: Shows what's correct, what needs work
4. **Mastery Feedback**: Confirms understanding, unlocks next steps

---

## Key User Interactions

### Interaction Patterns

1. **Question-Answer**: Learner asks, instructor responds with guidance
2. **Practice-Submit**: Learner practices, submits, receives feedback
3. **Reflection**: Learner reflects on learning, instructor facilitates
4. **Assessment**: Learner demonstrates mastery, system evaluates

### Constraint Enforcement Points

- **Before Submission**: Frontend validates input, checks cooldown
- **During Submission**: API validates constraints, rate limits
- **After Submission**: Backend validates learning progress, updates state

---

## Error Handling & Edge Cases

### Network Errors
- SSE connection drops → Auto-reconnect
- API request fails → Retry with exponential backoff
- Timeout → Show error, allow retry

### Constraint Violations
- Rate limit exceeded → Show cooldown timer
- Max attempts reached → Lock screen, show message
- Prerequisites not met → Disable navigation, show requirements

### Session Interruption
- Browser close → Save state, resume on return
- Timeout → Pause session, allow resume
- Error → Save progress, allow retry

---

## Summary

**Entry Point**: Landing screen → Registration/Dashboard
**Assessment**: Introduction → Questions → Results
**Lesson Selection**: Browse → Select → Start
**Learning Loop**: Introduction → Guided Practice → Independent Practice → Assessment → Mastery
**Completion**: Summary → Next Steps

Each screen has clear purpose, state transitions, and integration with the question & feedback loop. The flow is designed for educational effectiveness, not generic SaaS patterns.
