# Session Orchestrator Architecture

## Overview

The Session Orchestrator is the central coordinator for teaching sessions. It manages the complete flow from receiving a learner message to generating an instructor response, ensuring consistency, safety, and proper memory management.

## Responsibilities

1. **Load Context**: Retrieve instructor profile and learner memory
2. **Assemble Prompts**: Combine system prompts, instructor profile prompts, and learner context
3. **Call LLM**: Invoke the language model through the adapter abstraction
4. **Validate Response**: Ensure response follows teaching rules and maintains character
5. **Update Memory**: Extract learning insights and update learner memory

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Session Orchestrator                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Context    │    │    Prompt    │    │   Response   │  │
│  │   Loader     │───▶│  Assembler   │───▶│  Validator   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Storage    │    │   Prompt     │    │   Memory     │  │
│  │   Adapter    │    │   Config     │    │   Updater    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                               │
│         ┌─────────────────────────────────────┐              │
│         │         LLM Adapter                 │              │
│         └─────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Context Loader
- Loads `InstructorProfile` by ID
- Loads `LearnerMemory` for the learner
- Loads current `Session` state
- Retrieves recent `Message` history

### Prompt Assembler
- Loads prompt files from `config/prompts/`
- Combines system prompts (system.md, instructor_identity.md, etc.)
- Incorporates instructor profile-specific prompts
- Injects learner context (memory, progress, misconceptions)
- Formats session context (subject, topic, objective)
- Assembles message history for context window

### Response Validator
- Checks response follows teaching rules
- Verifies no direct answers given
- Ensures instructor character maintained
- Validates safety constraints
- Checks response format compliance

### Memory Updater
- Analyzes interaction for learning insights
- Extracts concepts introduced/practiced
- Identifies misconceptions addressed
- Updates learner memory accordingly
- Prepares session summary data

### LLM Adapter Interface
- Abstract interface for LLM providers
- Handles provider-specific details
- Manages context window limits
- Returns raw LLM response

## Main Session Flow

### Pseudocode

```
FUNCTION processLearnerMessage(sessionId, learnerMessage):
    // Step 1: Load Context
    session = loadSession(sessionId)
    instructorProfile = loadInstructorProfile(session.instructorProfileId)
    learnerMemory = loadLearnerMemory(session.learnerId)
    messageHistory = loadMessageHistory(session.messageIds)
    
    // Step 2: Save Learner Message
    learnerMessageObj = createMessage(
        sessionId: sessionId,
        role: 'learner',
        content: learnerMessage,
        messageType: classifyMessage(learnerMessage)
    )
    saveMessage(learnerMessageObj)
    session.messageIds.append(learnerMessageObj.id)
    updateSession(session)
    
    // Step 3: Assemble Prompt
    systemPrompts = loadPrompts([
        'config/prompts/system/system.md',
        'config/prompts/system/instructor_identity.md',
        'config/prompts/system/teaching_rules.md',
        'config/prompts/system/learner_context.md',
        'config/prompts/system/response_format.md',
        'config/prompts/system/fallback.md'
    ])
    
    instructorPrompts = loadInstructorPrompts(instructorProfile)
    
    learnerContext = formatLearnerContext(learnerMemory)
    sessionContext = formatSessionContext(session)
    conversationHistory = formatMessageHistory(messageHistory)
    
    fullPrompt = assemblePrompt(
        systemPrompts: systemPrompts,
        instructorPrompts: instructorPrompts,
        learnerContext: learnerContext,
        sessionContext: sessionContext,
        conversationHistory: conversationHistory,
        currentMessage: learnerMessage
    )
    
    // Step 4: Call LLM
    rawResponse = llmAdapter.generate(fullPrompt)
    
    // Step 5: Validate Response
    validationResult = responseValidator.validate(
        response: rawResponse,
        instructorProfile: instructorProfile,
        session: session,
        learnerMessage: learnerMessage
    )
    
    IF NOT validationResult.isValid:
        // Use fallback strategy
        fallbackPrompt = assembleFallbackPrompt(
            basePrompt: fullPrompt,
            validationErrors: validationResult.errors
        )
        rawResponse = llmAdapter.generate(fallbackPrompt)
        validationResult = responseValidator.validate(rawResponse, ...)
        
        IF NOT validationResult.isValid:
            // Last resort: return safe fallback response
            rawResponse = generateSafeFallbackResponse()
    
    // Step 6: Create Instructor Message
    instructorMessage = createMessage(
        sessionId: sessionId,
        role: 'instructor',
        content: rawResponse,
        messageType: classifyInstructorMessage(rawResponse),
        teachingMetadata: extractTeachingMetadata(rawResponse, learnerMessage)
    )
    
    saveMessage(instructorMessage)
    session.messageIds.append(instructorMessage.id)
    session.lastActivityAt = now()
    updateSession(session)
    
    // Step 7: Update Learner Memory
    learningInsights = analyzeInteraction(
        learnerMessage: learnerMessage,
        instructorMessage: instructorMessage,
        session: session
    )
    
    updatedMemory = memoryUpdater.update(
        currentMemory: learnerMemory,
        insights: learningInsights,
        session: session
    )
    
    saveLearnerMemory(updatedMemory)
    
    // Step 8: Return Response
    RETURN instructorMessage.content
END FUNCTION
```

## Prompt Assembly Strategy

### Prompt Structure

```
[System Instructions]
- Core principles
- Teaching rules
- Response format

[Instructor Identity]
- Teaching philosophy
- Communication style
- Role definition

[Instructor Profile]
- Teaching patterns
- Guidance style
- Question patterns
- Correction style

[Learner Context]
- Learned concepts
- Misconceptions
- Strengths/weaknesses
- Progress markers
- Recent session summaries

[Session Context]
- Subject: {session.subject}
- Topic: {session.topic}
- Learning Objective: {session.learningObjective}

[Conversation History]
- Previous messages in order
- Teaching metadata preserved

[Current Learner Message]
- The message to respond to
```

### Context Window Management

- Prioritize recent messages over old ones
- Summarize older messages if needed
- Keep learner memory summaries concise
- Truncate if necessary, preserving system prompts

## Response Validation Rules

### Character Consistency
- No references to AI, models, or systems
- Maintains instructor persona
- Uses appropriate teaching language

### Teaching Rules Compliance
- Does not provide direct answers
- Asks questions to check understanding
- Guides rather than tells
- Addresses misconceptions appropriately

### Safety Checks
- No inappropriate content
- No harmful instructions
- Respects safety constraints from instructor profile

### Format Compliance
- Follows response structure (acknowledge, guide, verify)
- Appropriate length
- Proper tone

## Memory Update Strategy

### Extract Learning Insights

```
FUNCTION analyzeInteraction(learnerMessage, instructorMessage, session):
    insights = {
        conceptsIntroduced: [],
        conceptsPracticed: [],
        misconceptionsFound: [],
        misconceptionsResolved: [],
        struggleLevel: assessStruggle(learnerMessage),
        progressMade: assessProgress(learnerMessage, instructorMessage)
    }
    
    // Analyze learner message for concepts
    concepts = extractConcepts(learnerMessage, session.topic)
    FOR EACH concept IN concepts:
        IF concept is new:
            insights.conceptsIntroduced.append(concept)
        ELSE:
            insights.conceptsPracticed.append(concept)
    
    // Check for misconceptions
    IF containsMisconception(learnerMessage):
        misconception = identifyMisconception(learnerMessage)
        insights.misconceptionsFound.append(misconception)
    
    // Check if correction occurred
    IF instructorMessage.teachingMetadata.correctionNeeded:
        insights.misconceptionsResolved.append(
            instructorMessage.teachingMetadata.misconceptionAddressed
        )
    
    RETURN insights
END FUNCTION
```

### Update Memory

```
FUNCTION updateMemory(currentMemory, insights, session):
    updatedMemory = copy(currentMemory)
    
    // Update learned concepts
    FOR EACH concept IN insights.conceptsIntroduced:
        IF concept NOT IN updatedMemory.learnedConcepts:
            updatedMemory.learnedConcepts.append({
                concept: concept,
                masteryLevel: 'introduced',
                firstIntroducedAt: now(),
                lastPracticedAt: now()
            })
    
    FOR EACH concept IN insights.conceptsPracticed:
        conceptObj = findConcept(updatedMemory.learnedConcepts, concept)
        IF conceptObj:
            conceptObj.lastPracticedAt = now()
            IF insights.progressMade:
                conceptObj.masteryLevel = advanceMastery(conceptObj.masteryLevel)
    
    // Update misconceptions
    FOR EACH misconception IN insights.misconceptionsFound:
        existing = findMisconception(updatedMemory.misconceptions, misconception)
        IF existing:
            existing.correctionAttempts++
        ELSE:
            updatedMemory.misconceptions.append({
                concept: misconception.concept,
                incorrectUnderstanding: misconception.understanding,
                firstObservedAt: now(),
                correctionAttempts: 1,
                resolved: false
            })
    
    FOR EACH resolved IN insights.misconceptionsResolved:
        misconception = findMisconception(updatedMemory.misconceptions, resolved)
        IF misconception:
            misconception.resolved = true
    
    // Update strengths/weaknesses based on struggle level
    IF insights.struggleLevel == 'low':
        updateStrengths(updatedMemory, session.topic)
    ELSE IF insights.struggleLevel == 'high':
        updateWeaknesses(updatedMemory, session.topic)
    
    updatedMemory.lastUpdated = now()
    
    RETURN updatedMemory
END FUNCTION
```

## Error Handling

### LLM Failure
- Retry with exponential backoff
- Fallback to cached response if available
- Return safe default guidance message

### Validation Failure
- Retry with adjusted prompt
- Use fallback instructions
- Return safe response that maintains character

### Memory Update Failure
- Log error but don't block response
- Queue memory update for retry
- Continue session normally

## Design Decisions

1. **Sequential Processing**: Each step completes before next begins - ensures data consistency

2. **Validation Before Memory Update**: Only update memory if response is valid - prevents corrupting memory with bad interactions

3. **Prompt Assembly Separation**: Prompt assembly is separate from LLM call - allows testing and optimization independently

4. **Memory Analysis After Response**: Analyze interaction after generating response - ensures we have complete context

5. **Adapter Pattern for LLM**: LLM adapter abstraction allows provider replacement without changing orchestrator logic

6. **Strict Validation**: Multiple validation checks ensure teaching quality and safety

7. **Graceful Degradation**: Fallback strategies ensure session continues even when validation fails

## Future Considerations

- **Streaming Responses**: Support for streaming LLM responses
- **Multi-turn Validation**: Validate across multiple messages, not just single response
- **Adaptive Prompt Selection**: Choose prompts based on session state
- **Memory Compression**: More sophisticated memory summarization
- **Response Caching**: Cache validated responses for similar contexts
