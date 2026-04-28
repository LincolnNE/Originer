# Cloud Agent Starter Skill: Run + Test ORIGINER

Use this as the first-run playbook for Cloud agents working in this repository.

## 0) Quick bootstrap (always do first)

### Authentication and access
- `gh` is already available in Cloud agents for read-only GitHub checks.
- App-level authentication is not required for MVP flows in this repo.
- Only if you need Vercel CLI workflows, run `vercel login` first.

### Install dependencies
From repo root:
- `npm install`
- `cd frontend && npm install`

### Environment setup
From repo root:
- `cp .env.example .env.local`

Defaults are already useful for local/offline-first work:
- Backend defaults to `PORT=4094`, `HOST=0.0.0.0`
- Frontend defaults API to `http://localhost:4094` when `NEXT_PUBLIC_API_URL` is unset
- Backend LLM adapter defaults to local Ollama (`OLLAMA_BASE_URL=http://localhost:11434`, model `llama3.2`)

## 1) Backend area (`src/`, `backend/`, `api/`)

### Start backend
From repo root:
- `npm run dev`

### Fast smoke test workflow (terminal-driven)
Run in a second terminal:
- `curl -sS http://127.0.0.1:4094/health`
  - Expect JSON or HTML health response with status healthy
- `curl -sS -X POST http://127.0.0.1:4094/api/v1/sessions/start -H "Content-Type: application/json" -d '{"instructor_id":"default","learner_id":"learner-001","subject":"General","topic":"Intro","learning_objective":"Get started"}'`
  - Expect `success: true` and a `session_id`
- `curl -sS -X POST http://127.0.0.1:4094/api/v1/lessons/start -H "Content-Type: application/json" -d '{"sessionId":"<SESSION_ID>","screenId":"screen_001","screenType":"guided_practice"}'`
  - Expect lesson payload scaffold with `success: true`

### LLM-dependent endpoint workflow
- Endpoint `POST /api/v1/lessons/:screenId/submit` uses `SessionOrchestrator` + Ollama adapter.
- If local Ollama is available:
  - ensure Ollama is running and model exists (`OLLAMA_MODEL`, default `llama3.2`)
  - then test submit endpoint.
- If Ollama is not available:
  - do not block on this endpoint; validate non-LLM endpoints above and note limitation in PR/test notes.

## 2) Frontend area (`frontend/`)

### Start frontend
From `frontend/`:
- `npm run dev`

### UI smoke test workflow (GUI + browser)
1. Open `http://127.0.0.1:3000`.
2. Verify landing page renders.
3. Click **Start Learning**.
4. If backend session route mismatch or API failure occurs, manually open:
   - `http://127.0.0.1:3000/lessons/dev-session/screen_001`
   - This route has a client-side mock fallback that initializes lesson/session state when backend load fails.
5. Verify lesson screen renders and interactive controls appear.

### Frontend API target toggle (common troubleshooting)
- To point frontend at another backend URL:
  - set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` or root `.env.local`
  - restart frontend dev server

## 3) Shared API contract/testing workflow (`src/routes/*`)

Use this lightweight regression sequence after touching route handlers:
1. `GET /health`
2. `POST /api/v1/sessions/start`
3. `POST /api/v1/lessons/start`
4. `POST /api/v1/lessons/:screenId/hint`
5. `POST /api/v1/lessons/:screenId/complete`

For each request, capture:
- request payload
- response code
- response body

Keep at least one passing command transcript in the PR description when route behavior changes.

## 4) Optional deploy/runtime area (Vercel)

Use only when task requires deploy behavior:
- Ensure Vercel project root directory is `frontend`
- Ensure `NEXT_PUBLIC_API_URL` points to deployed domain
- If using CLI deploy/debug, authenticate first: `vercel login`

## 5) Mocking and feature-flag guidance

This codebase currently uses env toggles more than formal feature-flag infrastructure.

Treat these env vars as the main behavior switches:
- `NEXT_PUBLIC_API_URL` (frontend API target)
- `NODE_ENV`, `LOG_LEVEL`, `CORS_ORIGIN` (runtime behavior)
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `LLM_TEMPERATURE`, `LLM_MAX_TOKENS` (LLM behavior)
- `DATABASE_PATH` (storage backing, defaults to in-memory SQLite)

When blocked by external services, prefer local mocks/fallback flows over cloud dependencies.

## 6) How to update this skill (keep it useful)

Whenever you discover a new runbook trick, add it immediately:

1. Add a short entry under the relevant area with:
   - **Symptom**
   - **Exact fix command(s)**
   - **How to verify**
2. Keep commands copy/paste-ready.
3. Prefer smallest reliable workflow over exhaustive checklists.
4. Remove stale steps when repo behavior changes.

If you change startup commands, endpoint paths, or env names in code, update this file in the same PR.
