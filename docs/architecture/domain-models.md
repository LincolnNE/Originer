# ORIGINER Domain Models

## Core Entities

### Instructor

```typescript
interface Instructor {
  id: string;
  teachingStyle: TeachingStyle;
  guidanceLevel: GuidanceLevel;
  consistencyRules: ConsistencyRule[];
  safetyConstraints: SafetyConstraint[];
  activeProfileId: string;
}
```

**Purpose**: Represents the AI instructor instance. Contains behavioral parameters that determine how the instructor teaches, guides, and maintains consistency. The `activeProfileId` links to the preserved teaching style.

**Key Fields**:
- `teachingStyle`: Core teaching approach (affects prompt selection and response patterns)
- `guidanceLevel`: How much to guide vs. let learner struggle (affects response generation)
- `consistencyRules`: Rules for maintaining teaching consistency (affects memory usage and response patterns)
- `safetyConstraints`: Boundaries for what the instructor can/cannot do (affects response filtering)

---

### InstructorProfile

```typescript
interface InstructorProfile {
  id: string;
  instructorId: string;
  name: string;
  teachingPatterns: TeachingPattern[];
  guidanceStyle: GuidanceStyle;
  responseStructure: ResponseStructure;
  questionPatterns: QuestionPattern[];
  correctionStyle: CorrectionStyle;
  consistencySettings: ConsistencySettings;
  createdAt: Date;
  updatedAt: Date;
}
```

**Purpose**: Preserves the instructor's teaching style across sessions. This is the "personality" and teaching methodology that must remain consistent. Changes here affect how all future sessions are conducted.

**Key Fields**:
- `teachingPatterns`: Specific teaching methods (Socratic, examples-first, etc.) - affects prompt construction
- `guidanceStyle`: How to structure guidance (leading questions, hints, scaffolding) - affects message generation
- `responseStructure`: How responses are organized (affects LLM output formatting)
- `questionPatterns`: Patterns for asking questions (affects when/how instructor asks vs. tells)
- `correctionStyle`: How to handle mistakes (affects response to incorrect learner answers)
- `consistencySettings`: Rules for maintaining style consistency (affects memory retrieval and prompt assembly)

---

### Learner

```typescript
interface Learner {
  id: string;
  currentSessionId: string | null;
  learningState: LearningState;
  activeContext: LearningContext;
  createdAt: Date;
}
```

**Purpose**: Represents the person being taught. Tracks current session and learning state. Minimal model - detailed memory lives in `LearnerMemory`.

**Key Fields**:
- `currentSessionId`: Active session reference (affects where new messages go)
- `learningState`: Current learning phase/status (affects instructor adaptation)
- `activeContext`: Current topic/subject context (affects prompt context assembly)

---

### LearnerMemory

```typescript
interface LearnerMemory {
  learnerId: string;
  learnedConcepts: LearnedConcept[];
  misconceptions: Misconception[];
  strengths: string[];
  weaknesses: string[];
  progressMarkers: ProgressMarker[];
  sessionSummaries: SessionSummary[];
  lastUpdated: Date;
}
```

**Purpose**: Long-term memory that persists across sessions. Enables the instructor to remember what the learner knows, struggles with, and has accomplished. Critical for avoiding repetition and building on prior knowledge.

**Key Fields**:
- `learnedConcepts`: Concepts the learner has mastered (affects what instructor can assume)
- `misconceptions`: Known incorrect understandings (affects how instructor corrects)
- `strengths`: Areas where learner excels (affects difficulty adjustment)
- `weaknesses`: Areas needing work (affects focus and scaffolding)
- `progressMarkers`: Key milestones achieved (affects session planning)
- `sessionSummaries`: Condensed summaries of past sessions (affects context window usage)

---

### Session

```typescript
interface Session {
  id: string;
  instructorId: string;
  learnerId: string;
  instructorProfileId: string;
  subject: string;
  topic: string;
  learningObjective: string;
  sessionState: SessionState;
  messageIds: string[];
  startedAt: Date;
  lastActivityAt: Date;
  endedAt: Date | null;
}
```

**Purpose**: Represents a single teaching session. Maintains session context and links instructor, learner, and messages. The `instructorProfileId` ensures the correct teaching style is used throughout.

**Key Fields**:
- `instructorProfileId`: Which teaching profile to use (affects prompt selection)
- `subject`/`topic`/`learningObjective`: Session context (affects prompt assembly and focus)
- `sessionState`: Current state (active, paused, completed) - affects message handling
- `messageIds`: Ordered list of messages (affects context window assembly)

---

### Message

```typescript
interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  messageType: MessageType;
  teachingMetadata: TeachingMetadata;
  timestamp: Date;
}
```

**Purpose**: Individual message in a session. Contains teaching-specific metadata that affects how the instructor responds and how messages are used in context assembly.

**Key Fields**:
- `role`: Instructor or learner (affects prompt context assembly)
- `messageType`: Classification (question, guidance, correction, etc.) - affects response generation
- `teachingMetadata`: Teaching-specific data:
  - `isLeadingQuestion`: Whether instructor question reveals too much
  - `revealedInformation`: What concepts were directly stated (affects future guidance)
  - `learnerStruggleLevel`: How much learner struggled (affects difficulty adjustment)
  - `correctionNeeded`: Whether correction occurred (affects memory updates)

---

## Supporting Types

```typescript
type MessageRole = 'instructor' | 'learner';
type MessageType = 'question' | 'guidance' | 'correction' | 'explanation' | 'response' | 'clarification';
type SessionState = 'active' | 'paused' | 'completed' | 'abandoned';
type GuidanceLevel = 'minimal' | 'moderate' | 'scaffolded' | 'direct';

interface TeachingMetadata {
  isLeadingQuestion?: boolean;
  revealedInformation?: string[];
  learnerStruggleLevel?: 'none' | 'low' | 'moderate' | 'high';
  correctionNeeded?: boolean;
  conceptIntroduced?: string;
  misconceptionAddressed?: string;
}

interface LearnedConcept {
  concept: string;
  masteryLevel: 'introduced' | 'practicing' | 'mastered';
  firstIntroducedAt: Date;
  lastPracticedAt: Date;
}

interface Misconception {
  concept: string;
  incorrectUnderstanding: string;
  firstObservedAt: Date;
  correctionAttempts: number;
  resolved: boolean;
}

interface ProgressMarker {
  marker: string;
  achievedAt: Date;
  sessionId: string;
}

interface SessionSummary {
  sessionId: string;
  summary: string;
  keyConcepts: string[];
  learnerProgress: string;
  misconceptionsAddressed: string[];
  createdAt: Date;
}
```

### LessonScreen

```typescript
interface LessonScreen {
  id: string;
  sessionId: string;
  screenType: LessonScreenType;
  state: ScreenState;
  concept: string;
  learningObjective: string;
  constraints: LearningConstraints;
  progress: ScreenProgress;
  prerequisiteScreenIds: string[];
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}
```

**Purpose**: Represents a distinct learning phase or concept screen in the UI. The frontend is organized around lesson screens, not messages. Each screen has its own state, constraints, and progress tracking.

**Key Fields**:
- `screenType`: Type of learning screen (introduction, practice, assessment, etc.) - affects UI rendering and backend validation
- `state`: Current screen state (locked, unlocked, active, completed) - affects UI navigation and backend unlock logic
- `constraints`: Learning constraints for this screen (affects when learner can proceed)
- `progress`: Screen-specific progress tracking (affects UI display and backend validation)
- `prerequisiteScreenIds`: Screens that must be completed first (affects UI navigation and backend unlock validation)

---

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
  lastAttemptAt: Date | null;
}
```

**Purpose**: Tracks learner progress within a specific lesson screen. Used by frontend to display progress and by backend to validate screen transitions.

**Key Fields**:
- `attempts`: Number of attempts on this screen (affects constraint enforcement)
- `bestScore`: Best performance score (affects mastery validation)
- `canProceed`: Whether learner can advance (affects UI navigation and backend validation)
- `conceptsDemonstrated`: Concepts shown during this screen (affects memory updates)

---

### LearningConstraints

```typescript
interface LearningConstraints {
  minTimeOnScreen: number;        // Minimum seconds before proceeding
  requiredAttempts: number;        // Required practice attempts
  masteryThreshold: number;       // Score needed (0-100)
  prerequisiteScreens: string[];  // Screen IDs that must be completed
  maxAttemptsPerScreen: number;   // Prevent infinite retries
  cooldownBetweenAttempts: number; // Seconds between attempts
  rateLimitPerMinute: number;     // Max interactions per minute
}
```

**Purpose**: Defines constraints enforced by both frontend and backend to prevent prompt abuse and ensure proper learning progression.

**Key Fields**:
- All fields affect both frontend UI behavior (disable buttons, show warnings) and backend validation (reject requests that violate constraints)

---

## Supporting Types

```typescript
type MessageRole = 'instructor' | 'learner';
type MessageType = 'question' | 'guidance' | 'correction' | 'explanation' | 'response' | 'clarification';
type SessionState = 'active' | 'paused' | 'completed' | 'abandoned';
type GuidanceLevel = 'minimal' | 'moderate' | 'scaffolded' | 'direct';

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
  | 'blocked';    // Blocked due to constraints

interface TeachingMetadata {
  isLeadingQuestion?: boolean;
  revealedInformation?: string[];
  learnerStruggleLevel?: 'none' | 'low' | 'moderate' | 'high';
  correctionNeeded?: boolean;
  conceptIntroduced?: string;
  misconceptionAddressed?: string;
  screenId?: string;  // Link message to lesson screen
}

interface LearnedConcept {
  concept: string;
  masteryLevel: 'introduced' | 'practicing' | 'mastered';
  firstIntroducedAt: Date;
  lastPracticedAt: Date;
  masteredAtScreenId?: string;  // Which screen achieved mastery
}

interface Misconception {
  concept: string;
  incorrectUnderstanding: string;
  firstObservedAt: Date;
  correctionAttempts: number;
  resolved: boolean;
  resolvedAtScreenId?: string;  // Which screen resolved it
}

interface ProgressMarker {
  marker: string;
  achievedAt: Date;
  sessionId: string;
  screenId?: string;  // Which screen achieved this marker
}

interface SessionSummary {
  sessionId: string;
  summary: string;
  keyConcepts: string[];
  learnerProgress: string;
  misconceptionsAddressed: string[];
  screensCompleted: number;
  createdAt: Date;
}
```

## Design Notes

1. **AI Behavior Focus**: All fields directly impact how the AI instructor behaves, generates responses, or maintains consistency.

2. **Domain Separation**: 
   - Instructor domain: `Instructor`, `InstructorProfile`
   - Learner domain: `Learner`, `LearnerMemory`
   - Shared: `Session`, `Message`, `LessonScreen`

3. **Memory Efficiency**: `LearnerMemory` uses summaries and markers rather than storing all messages, keeping context windows manageable.

4. **Teaching Style Preservation**: `InstructorProfile` captures all aspects of teaching style that must remain consistent, separate from the instructor instance.

5. **Session Context**: `Session` links everything together and maintains the teaching context needed for coherent instruction.

6. **Frontend-Backend Co-Design**: `LessonScreen`, `ScreenProgress`, and `LearningConstraints` are shared models that both frontend and backend use. The frontend is not a thin UI—it actively participates in learning flow control and constraint enforcement.

7. **Screen-Based Architecture**: The system is organized around lesson screens, not messages. Messages are linked to screens via `teachingMetadata.screenId`, but screens are the primary unit of learning progression.
