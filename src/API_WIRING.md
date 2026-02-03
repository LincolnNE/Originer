# API Wiring Summary

## Overview

Core modules are now wired into HTTP APIs. The data flow is established with placeholders for unimplemented logic.

## File Structure

```
src/
├── server.ts                    # Main server entry point
├── services/
│   └── index.ts                # Service initialization (SessionOrchestrator, PromptAssembler, ResponseValidator)
├── routes/
│   ├── lessons.ts              # Lesson endpoints (start, submit, hint, complete)
│   └── sessions.ts             # Session endpoints (create, get)
├── middleware/
│   └── response-validation.ts  # Optional ResponseValidator middleware
├── DATA_FLOW.md                # Detailed data flow documentation
└── API_WIRING.md               # This file
```

## Wired Components

### ✅ SessionOrchestrator → Lesson Endpoints

**Connected to**:
- `POST /api/v1/lessons/:screenId/submit` - Processes learner answers

**Data Flow**:
```
HTTP Request → Route Handler → SessionOrchestrator.processLearnerMessage()
                                  ├─→ PromptAssembler (internal)
                                  ├─→ LLMAdapter
                                  ├─→ ResponseValidator (internal)
                                  └─→ StorageAdapter
                              → HTTP Response
```

### ✅ PromptAssembler → Internal Service

**Used by**: SessionOrchestrator (internal, not directly exposed to routes)

**Data Flow**:
```
SessionOrchestrator.processLearnerMessage()
  → PromptAssembler.assemblePrompt()
    → Load system prompts
    → Format learner context
    → Format session context
    → Combine into full prompt
  → LLMAdapter.generate(prompt)
```

### ✅ ResponseValidator → Middleware-like Logic

**Used in two ways**:
1. **Internal**: Used by SessionOrchestrator to validate LLM responses
2. **Optional Middleware**: Can validate responses at HTTP boundary (see `middleware/response-validation.ts`)

**Data Flow**:
```
SessionOrchestrator.processLearnerMessage()
  → LLMAdapter.generate()
  → ResponseValidator.validate()
    → Check for direct answers
    → Check for verification questions
    → Check style consistency
    → Check safety constraints
  → Return validated response or regenerate
```

## Endpoints Created

### Lesson Endpoints

1. **POST /api/v1/lessons/start**
   - Starts a lesson screen
   - Uses: StorageAdapter (load session)
   - Placeholder: Screen definition loading

2. **POST /api/v1/lessons/:screenId/submit**
   - Submits learner answer
   - Uses: SessionOrchestrator → PromptAssembler → LLMAdapter → ResponseValidator
   - **Core logic wired**: ✅

3. **POST /api/v1/lessons/:screenId/hint**
   - Requests a hint
   - Placeholder: Hint generation logic

4. **POST /api/v1/lessons/:screenId/complete**
   - Completes a lesson screen
   - Placeholder: Completion validation

### Session Endpoints

1. **POST /api/v1/sessions**
   - Creates a new session
   - Placeholder: Session creation logic

2. **GET /api/v1/sessions/:sessionId**
   - Gets session data
   - Uses: StorageAdapter (load session)

## Key Design Decisions

1. **Stateless Pattern**: Every request loads session from StorageAdapter
2. **Service Composition**: SessionOrchestrator composes all services
3. **Internal Services**: PromptAssembler and ResponseValidator are internal to SessionOrchestrator
4. **Placeholders**: Unimplemented logic marked with TODO comments

## Next Steps

1. **Implement StorageAdapter**: File-based or database storage
2. **Implement LLMAdapter**: Ollama, OpenAI, or other provider
3. **Implement PromptAssembler.assemblePrompt()**: Load and combine prompts
4. **Implement ResponseValidator.validate()**: All validation checks
5. **Fill Placeholders**: Screen definitions, prerequisites, progress calculation

## Testing the Wiring

```bash
# Start server
npm run dev

# Test health check
curl http://localhost:3000/health

# Test lesson submit (will fail until adapters implemented)
curl -X POST http://localhost:3000/api/v1/lessons/screen_001/submit \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "sess_123", "answer": "test"}'
```

The server will start, but endpoints will throw errors until adapters are implemented. The data flow is established.
