# Lesson Screen Structure - Quick Reference

## Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│                    LESSON SCREEN                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         INSTRUCTOR AREA                         │   │
│  │  • Activity: "Presenting problem"                │   │
│  │  • Content: Problem statement                   │   │
│  │  • Status: Static / Loading / Feedback          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         LEARNER TASK AREA                        │   │
│  │  • Problem: [Problem statement]                 │   │
│  │  • Instructions: [Instructions]                  │   │
│  │  • Answer Input: [________________]              │   │
│  │  • Submit Button: [Submit] (enabled/disabled)    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         PROGRESS INDICATOR                       │   │
│  │  • Screen: [████░░░░] 40%                       │   │
│  │  • Session: [██████░░] 60%                       │   │
│  │  • Attempts: 2/5                                  │   │
│  │  • Time: 2:30                                    │   │
│  │  • Mastery: 65% (need 80%)                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         SYSTEM CONSTRAINTS                       │   │
│  │  ⚠ Rate limit: 10s remaining                   │   │
│  │  ⚠ Cooldown: 5s remaining                       │   │
│  │  ✓ Min time: Met                                │   │
│  │  ❌ Mastery: 65% < 80% (blocking)               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## State-Based Content

### IN_LESSON
- **Instructor**: "Presenting problem" + Problem statement
- **Task**: Input enabled, Submit enabled (if constraints met)
- **Progress**: Live updates (time, attempts)
- **Constraints**: Active, updating in real-time

### AWAITING_FEEDBACK
- **Instructor**: "Analyzing..." + Loading indicator
- **Task**: Input disabled (shows submitted answer), Submit disabled
- **Progress**: Frozen (no updates)
- **Constraints**: Frozen (no updates)

### REVIEWING
- **Instructor**: "Feedback ready" + Complete feedback
- **Task**: Input readonly (or enabled if revising), Submit hidden
- **Progress**: Updated (new mastery, concepts)
- **Constraints**: Updated (unlock requirements shown)

---

## Dynamic vs Fixed

### Dynamic (Changes)
- Instructor activity and feedback
- Answer input value and state
- Submit button state
- Progress values (time, attempts, mastery)
- Constraint statuses and countdowns
- Validation errors

### Fixed (Never Changes)
- Screen layout structure
- Problem statement text
- Component containers
- Button structures (presence, not state)
- Input field structure (presence, not state)

---

## Re-render Triggers

**Immediate**:
- State transition
- User typing
- Submit click
- Feedback received

**Every Second**:
- Timer updates
- Countdown updates

**On Change**:
- Constraint status
- Progress values
- Unlock status

---

## Component Hierarchy

```
LessonScreen
├── InstructorArea
│   ├── ActivityIndicator
│   ├── ProblemStatement
│   └── FeedbackContent (conditional)
├── LearnerTaskArea
│   ├── ProblemDisplay
│   ├── InstructionsDisplay
│   ├── AnswerInput
│   └── SubmitButton
├── ProgressIndicator
│   ├── ScreenProgressBar
│   ├── SessionProgressBar
│   ├── AttemptCounter
│   ├── TimeDisplay
│   └── MasteryDisplay
└── ConstraintsArea
    ├── ConstraintList
    ├── BlockingConstraints
    └── WarningConstraints
```
