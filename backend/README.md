# ORIGINER Backend Server

Minimal HTTP server for ORIGINER REST API.

## Architecture Principles

- **Stateless HTTP Layer**: No in-memory session state. Each request loads session from storage.
- **REST API First**: Standard HTTP endpoints returning JSON.
- **Explicit Session Management**: Session state loaded via `StorageAdapter` on each request.
- **No Frontend Assumptions**: Backend is framework-agnostic, returns JSON only.

## Server Structure

```
backend/
├── index.ts          # Entry point: Initializes adapters and starts server
├── server.ts         # Express app setup: Routes, middleware, error handling
├── core/             # Core business logic (SessionOrchestrator, etc.)
└── adapters/         # External integrations (LLM, Storage)
```

## Running the Server

```bash
# Development (with ts-node)
npm run dev

# Production (after build)
npm run build
npm start
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `PROMPT_CONFIG_PATH`: Path to prompt config files (default: `config/prompts`)
- `LLM_PROVIDER`: LLM provider type (TODO: implement adapter selection)
- `STORAGE_TYPE`: Storage adapter type (TODO: implement adapter selection)

## Current Endpoints

- `GET /health` - Health check
- `POST /api/v1/lessons/start` - Start a lesson screen
- `POST /api/v1/lessons/:screenId/submit` - Submit answer

## Next Steps

1. Implement `StorageAdapter` (file-based or database)
2. Implement `LLMAdapter` (Ollama, OpenAI, etc.)
3. Implement `PromptAssembler.assemblePrompt()`
4. Implement `ResponseValidator.validate()`
5. Add remaining lesson endpoints from API contract
6. Add authentication middleware
7. Add rate limiting middleware
8. Implement SSE streaming for instructor responses
