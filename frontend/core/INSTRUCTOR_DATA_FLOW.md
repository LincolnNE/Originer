# Instructor AI Data Flow

## Overview

This document explains how instructor AI interactions flow through the frontend application. The system enforces strict contracts and ensures the frontend never assembles prompts directly.

## Architecture Principles

1. **Structured Input/Output**: All AI interactions use structured contracts, not free text
2. **Single Entry Point**: `InstructorGateway` is the only AI-facing layer
3. **No Prompt Assembly**: Frontend never constructs prompts - only provides structured data
4. **Mock Implementation**: Current implementation uses mocks until backend integration

## Data Flow

### 1. User Action → Instructor Input

```
User performs action (e.g., submits answer, requests hint)
  ↓
Component calls useInstructor().processInput()
  ↓
Structured InstructorInput created:
  {
    sessionId: string,
    screenId: string,
    action: 'provide_feedback' | 'give_hint' | etc.,
    actionData: { ... structured data ... },
    context?: { ... optional context ... }
  }
```

**Example:**
```typescript
// User submits answer
await processInput({
  sessionId: 'session-123',
  screenId: 'screen-001',
  action: 'provide_feedback',
  actionData: {
    learnerAnswer: 'x = 5',
    attemptNumber: 1,
    timeSpent: 120,
  },
});
```

### 2. Instructor Gateway Processing

```
InstructorInput received
  ↓
InstructorGateway.validateInput() - validates contract
  ↓
[Mock] generateMockOutput() - creates structured response
  ↓
[Production] Would:
  1. Send structured input to backend API
  2. Backend assembles prompt (frontend never sees this)
  3. Backend calls LLM
  4. Backend validates and structures response
  5. Return InstructorOutput
  ↓
InstructorOutput returned
```

**Key Point**: Frontend never sees or constructs prompts. All prompt assembly happens in the backend.

### 3. Instructor Output → UI Rendering

```
InstructorOutput received
  ↓
useInstructor hook updates state
  ↓
Component receives output via hook
  ↓
InstructorMessage component renders based on output.type
  ↓
UI displays structured content
```

**Example Output:**
```typescript
{
  type: 'feedback',
  content: {
    assessment: 'correct',
    feedbackText: 'Great job! You correctly solved...',
    strengths: ['Correct algebraic manipulation'],
    suggestions: [],
    nextSteps: ['You can proceed to the next problem'],
  },
  metadata: { ... },
  nextActions: [
    { action: 'proceed', label: 'Proceed', enabled: true }
  ]
}
```

## Component Integration

### useInstructor Hook

**Location**: `hooks/useInstructor.ts`

**Purpose**: React hook for instructor interactions

**Usage**:
```typescript
const { output, isLoading, error, processInput, clearOutput } = useInstructor();

// Process input
await processInput({
  sessionId,
  screenId,
  action: 'provide_feedback',
  actionData: { learnerAnswer: 'x = 5', attemptNumber: 1 },
});

// Access output
if (output) {
  // Render InstructorMessage component
}
```

### InstructorMessage Component

**Location**: `components/InstructorMessage.tsx`

**Purpose**: Renders structured instructor output

**Usage**:
```typescript
<InstructorMessage output={output} />
```

**Behavior**: 
- Renders different UI based on `output.type`
- Displays structured content (problem, feedback, hint, etc.)
- Shows next actions
- Handles all response types

### LessonScreen Integration

**Location**: `components/screens/LessonScreen.tsx`

**Integration**:
1. Uses `useInstructor()` hook
2. Calls `processInput()` on mount to load problem
3. Renders `<InstructorMessage output={output} />` when output available
4. Shows loading state while processing

## Action Types

### present_problem
**When**: Initial screen load  
**Input**: Problem statement, instructions, concept  
**Output**: Problem presentation with examples and key concepts

### provide_feedback
**When**: User submits answer  
**Input**: Learner answer, attempt number, time spent  
**Output**: Assessment, feedback text, strengths, suggestions

### give_hint
**When**: User requests hint  
**Input**: Hint level, previous hints  
**Output**: Hint text, hint level, follow-up hints

### answer_question
**When**: User asks question  
**Input**: Question text, context  
**Output**: Answer text, explanation, examples

### provide_guidance
**When**: User needs general guidance  
**Input**: Guidance type, current state  
**Output**: Guidance text, approach, steps, warnings

### encourage
**When**: User needs encouragement  
**Input**: Progress, achievements  
**Output**: Encouragement message, achievements, next milestone

### explain_concept
**When**: User requests concept explanation  
**Input**: Concept name, depth level  
**Output**: Explanation, examples, related concepts

## Error Handling

**InstructorError**:
```typescript
{
  code: 'INVALID_INPUT' | 'GATEWAY_ERROR' | 'TIMEOUT' | etc.,
  message: string,
  details?: Record<string, unknown>,
  retryable: boolean
}
```

**Flow**:
1. Error occurs in InstructorGateway
2. Converted to InstructorError format
3. Returned via useInstructor hook
4. Component displays error message
5. User can retry if `retryable: true`

## Mock vs Production

### Current (Mock)
- `InstructorGateway.generateMockOutput()` creates structured responses
- No backend calls
- No LLM integration
- Responses are deterministic based on input

### Future (Production)
- Frontend sends `InstructorInput` to backend API
- Backend assembles prompts (frontend never sees this)
- Backend calls LLM via adapter
- Backend validates and structures response
- Backend returns `InstructorOutput` to frontend
- Frontend renders via `InstructorMessage`

## Key Constraints

1. **No Prompt Assembly**: Frontend components never construct prompts
2. **Structured Only**: All AI communication uses structured contracts
3. **Single Gateway**: All AI interactions go through `InstructorGateway`
4. **Type Safety**: TypeScript enforces contract compliance
5. **Separation**: Frontend UI logic separate from AI prompt logic

## Files

- `types/instructor.ts` - Input/output contracts
- `core/InstructorGateway.ts` - Single AI entry point (mock)
- `hooks/useInstructor.ts` - React hook for interactions
- `components/InstructorMessage.tsx` - UI component for output
- `components/screens/LessonScreen.tsx` - Integration example
