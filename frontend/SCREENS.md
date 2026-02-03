# Lesson Screens Definition

## Screen Architecture

**Principle**: Frontend represents a **classroom**, not a chat app. Screens are distinct learning phases, not message threads.

---

## Screen Types

### MVP: Single Screen Type

**Guided Practice Screen** (`guided_practice`)
- Only screen type for MVP
- Handles all learning interactions
- Can be extended to other types later

### Future Screen Types

1. **Concept Introduction** (`concept_introduction`)
   - Introduce new concept
   - Show examples
   - Check understanding

2. **Independent Practice** (`independent_practice`)
   - Practice without immediate help
   - Limited help requests
   - Complete solutions

3. **Assessment** (`assessment`)
   - Formal evaluation
   - No hints allowed
   - Single attempt

4. **Mastery Check** (`mastery_check`)
   - Final verification
   - Reflection
   - Confirmation

5. **Misconception Correction** (`misconception_correction`)
   - Address misconceptions
   - Correct understanding
   - Practice corrected concept

---

## Screen Structure

### Screen Definition

```typescript
interface LessonScreen {
  // Identity
  screenId: string;
  sessionId: string;
  screenType: ScreenType;
  
  // Content
  concept: string;
  learningObjective: string;
  content: ScreenContent;
  
  // State
  state: ScreenState;
  progress: ScreenProgress;
  constraints: ScreenConstraints;
  
  // Navigation
  navigation: ScreenNavigation;
}

type ScreenType = 
  | 'guided_practice'        // MVP
  | 'concept_introduction'   // Future
  | 'independent_practice'   // Future
  | 'assessment'              // Future
  | 'mastery_check'          // Future
  | 'misconception_correction'; // Future

type ScreenState = 
  | 'not_started'
  | 'active'
  | 'completed'
  | 'locked';
```

### Screen Content

```typescript
interface ScreenContent {
  // Problem/Question
  problem: string;
  instructions: string;
  examples?: string[];
  
  // Available actions
  hintsAvailable: number;
  maxAttempts: number;
  
  // Additional context
  additionalContext?: string;
}
```

### Screen Progress

```typescript
interface ScreenProgress {
  attempts: number;
  timeSpent: number;          // Seconds (client-tracked)
  masteryScore: number | null; // 0-100
  canProceed: boolean;
  conceptsDemonstrated: string[];
}
```

### Screen Constraints

```typescript
interface ScreenConstraints {
  minTimeOnScreen: number;        // Seconds
  requiredAttempts: number;
  masteryThreshold: number;      // 0-100
  cooldownBetweenAttempts: number; // Seconds
  rateLimitPerMinute: number;
  maxAttempts: number;
}
```

### Screen Navigation

```typescript
interface ScreenNavigation {
  canGoBack: boolean;
  canGoForward: boolean;
  nextScreenId: string | null;
  nextScreenUnlocked: boolean;
  unlockRequirements: UnlockRequirement[];
}
```

---

## Screen Lifecycle

### State Transitions

```
not_started → active → completed
     ↓           ↓
   locked    (can be locked mid-session)
```

### Screen Flow (MVP)

```
Screen 1 (guided_practice)
  ↓ (mastery achieved)
Screen 2 (guided_practice)
  ↓ (mastery achieved)
Screen 3 (guided_practice)
  ↓ (session complete)
Session Complete
```

---

## Screen Components (Future Structure)

### Component Mapping

Each screen type maps to a component:

```
components/screens/
├── GuidedPractice.tsx          → guided_practice (MVP)
├── ConceptIntroduction.tsx     → concept_introduction (Future)
├── IndependentPractice.tsx    → independent_practice (Future)
├── Assessment.tsx              → assessment (Future)
├── MasteryCheck.tsx           → mastery_check (Future)
└── MisconceptionCorrection.tsx → misconception_correction (Future)
```

### Screen Component Interface

```typescript
interface ScreenComponentProps {
  screen: LessonScreen;
  onAnswerSubmit: (answer: string) => void;
  onHintRequest: () => void;
  onComplete: () => void;
  onNavigate: (screenId: string) => void;
}
```

---

## Screen Data Flow

### Loading Screen

```
URL: /lessons/[sessionId]/[screenId]
  ↓
Route Handler (app/lessons/[sessionId]/[screenId]/page.tsx)
  ↓
Load Screen Data:
  1. GET /api/v1/sessions/[sessionId] (load session)
  2. POST /api/v1/lessons/start (start screen, get content)
  ↓
Initialize State:
  - lessonStateStore.setCurrentScreen(screenId)
  - progressStore.updateScreenProgress(progress)
  - constraintStore.updateConstraints(constraints)
  ↓
Render Screen Component
```

### Submitting Answer

```
User clicks "Submit"
  ↓
Frontend Validation:
  - Check constraints (rate limit, cooldown)
  - Validate input
  - Check UI state (must be 'ready' or 'interacting')
  ↓
Optimistic Update:
  - lessonStateStore.transitionState('submitting')
  - Disable submit button
  ↓
API Call:
  POST /api/v1/lessons/[screenId]/submit
  ↓
SSE Stream:
  - Connect to SSE endpoint
  - Stream instructor response
  - Update UI as chunks arrive
  ↓
Complete:
  - Update progress
  - Check if can proceed
  - Enable next button if mastery achieved
```

---

## Screen State Ownership

### Frontend Owns

- **UI State**: `idle`, `ready`, `interacting`, `submitting`, `streaming`
- **Input State**: Current answer text, validation errors
- **Visual State**: What UI elements to show/hide
- **Client-Tracked Progress**: Time spent (approximate), attempt count (optimistic)

### Backend Owns

- **Screen Content**: Problem, instructions, examples
- **Screen Constraints**: Limits, thresholds, requirements
- **Authoritative Progress**: Actual attempts, mastery scores, unlock status
- **Screen State**: `not_started`, `active`, `completed`, `locked`

### Synchronization

- Frontend loads screen state from backend on mount
- Frontend updates optimistically for UX
- Backend validates and returns authoritative state
- Frontend reconciles optimistic state with backend response

---

## Screen Constraints Enforcement

### Client-Side Enforcement (Immediate UX)

- Disable submit button if constraints violated
- Show warning messages before blocking
- Display cooldown timers
- Prevent navigation to locked screens

### Server-Side Validation (Authoritative)

- Backend validates constraints on API calls
- Returns error if constraint violated
- Frontend shows error and rolls back optimistic update

---

## Summary

**MVP Screen Type**: `guided_practice` (single type)

**Screen Structure**: Content + Progress + Constraints + Navigation

**State Ownership**: Frontend (UI), Backend (authoritative)

**Data Flow**: URL → Load → Render → Interact → Submit → Stream → Update
