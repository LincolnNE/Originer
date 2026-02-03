# Frontend Architecture

## Overview

ORIGINER is a **web-based service** with a sophisticated frontend that serves as an **active learning interface**, not a thin UI wrapper. The frontend and backend are designed together as an integrated system.

## Core Principles

1. **Active Learning Interface**: The frontend actively participates in the learning process, not just displaying messages
2. **Frontend-Backend Co-Design**: Architecture decisions consider both frontend and backend together
3. **Lesson-Based UI**: Think in terms of "lesson screens" rather than "messages"
4. **Learning Constraints**: Frontend enforces constraints to prevent prompt abuse and maintain learning integrity

## Frontend Responsibilities

### 1. Visualize Learner Progress
- Display learning state, mastered concepts, and progress markers
- Show session history and learning trajectory
- Render concept mastery levels and misconceptions
- Visualize learning path and next steps

### 2. Control Session Flow
- Manage lesson screen transitions
- Control when learners can proceed to next concepts
- Enforce lesson sequencing and prerequisites
- Handle session state transitions (active, paused, completed)

### 3. Enforce Learning Constraints
- Prevent skipping ahead without mastery
- Enforce practice requirements before progression
- Limit rapid-fire messages that bypass reflection
- Validate learner inputs before sending to backend

### 4. Prevent Prompt Abuse
- Rate limiting at UI level
- Input validation and sanitization
- Prevent prompt injection attempts
- Monitor for gaming behaviors (copy-paste, rapid submissions)

## Architecture Pattern: Lesson Screens

The UI is organized around **lesson screens**, not message threads. Each screen represents a distinct learning phase or concept.

### Lesson Screen Structure

```typescript
interface LessonScreen {
  id: string;
  sessionId: string;
  screenType: LessonScreenType;
  state: ScreenState;
  content: ScreenContent;
  constraints: LearningConstraints;
  progress: ScreenProgress;
  navigation: NavigationRules;
}

type LessonScreenType = 
  | 'concept_introduction'
  | 'guided_practice'
  | 'independent_practice'
  | 'assessment'
  | 'reflection'
  | 'concept_mastery_check'
  | 'misconception_correction';

type ScreenState = 
  | 'locked'      // Cannot access yet (prerequisites not met)
  | 'unlocked'    // Can access but not started
  | 'active'      // Currently in progress
  | 'completed'   // Finished, can proceed
  | 'blocked'     // Blocked due to constraints
```

### Screen Flow Example

```
Concept Introduction Screen
    ↓ (learner demonstrates understanding)
Guided Practice Screen
    ↓ (completes practice exercises)
Independent Practice Screen
    ↓ (meets mastery threshold)
Assessment Screen
    ↓ (passes assessment)
Concept Mastery Check Screen
    ↓ (mastery confirmed)
Next Concept Introduction Screen
```

## Frontend-Backend Integration

### State Synchronization

The frontend maintains its own state for UI responsiveness, but syncs with backend for:
- Learning progress validation
- Constraint enforcement
- Session state management
- Memory updates

### API Design for Lesson Screens

Instead of simple message endpoints, APIs support lesson screen operations:

```typescript
// Start a lesson screen
POST /sessions/{sessionId}/screens/{screenId}/start

// Submit screen interaction
POST /sessions/{sessionId}/screens/{screenId}/interactions

// Check if screen can be unlocked
GET /sessions/{sessionId}/screens/{screenId}/unlock-status

// Get screen progress
GET /sessions/{sessionId}/screens/{screenId}/progress
```

### Constraint Enforcement

Constraints are enforced at multiple levels:

1. **Frontend Validation**: Immediate feedback, prevents invalid submissions
2. **Backend Validation**: Server-side verification of learning progress
3. **Session Orchestrator**: Validates against learner memory and prerequisites

## Frontend Domain Models

### LearningConstraints

```typescript
interface LearningConstraints {
  minTimeOnScreen: number;        // Minimum time before proceeding
  requiredAttempts: number;        // Required practice attempts
  masteryThreshold: number;       // Score needed to proceed
  prerequisiteScreens: string[];  // Screens that must be completed
  maxAttemptsPerScreen: number;   // Prevent infinite retries
  cooldownBetweenAttempts: number; // Prevent rapid submissions
}
```

### ScreenProgress

```typescript
interface ScreenProgress {
  screenId: string;
  attempts: number;
  bestScore: number;
  timeSpent: number;
  conceptsDemonstrated: string[];
  misconceptionsAddressed: string[];
  canProceed: boolean;
  unlockReason?: string;
}
```

### UIState

```typescript
interface UIState {
  currentScreenId: string | null;
  availableScreens: string[];
  lockedScreens: string[];
  sessionProgress: SessionProgress;
  learnerProgress: LearnerProgress;
  constraints: ActiveConstraints;
}
```

## Design Implications

### 1. Frontend Must Understand Learning Domain

The frontend needs domain knowledge about:
- Learning sequences and prerequisites
- Concept relationships
- Mastery criteria
- Assessment logic

This is not just UI logic—it's learning logic.

### 2. Backend Must Support Screen-Based Operations

Backend APIs should:
- Return screen definitions, not just messages
- Validate screen transitions
- Track screen-level progress
- Enforce screen-specific constraints

### 3. Shared State Management

Both frontend and backend maintain state:
- **Frontend**: UI state, screen transitions, immediate validation
- **Backend**: Learning state, memory, session orchestration
- **Sync**: Regular synchronization with conflict resolution

### 4. Constraint Enforcement Strategy

Constraints are enforced at multiple layers:
- **UI Layer**: Immediate feedback, disable buttons, show warnings
- **API Layer**: Validate requests, check prerequisites
- **Orchestrator Layer**: Verify against learner memory and session state

## Implementation Notes

1. **No Simple Chat Interface**: The UI is not a chat window. It's a structured learning environment with screens, progress tracking, and constraints.

2. **Frontend Logic**: The frontend contains significant business logic for learning flow, not just presentation.

3. **Backend Support**: Backend APIs must support screen-based operations, not just message-based operations.

4. **Co-Design**: Architecture decisions (API design, state management, constraints) must consider both frontend and backend together.
