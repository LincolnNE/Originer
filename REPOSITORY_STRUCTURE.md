# ORIGINER Repository Structure

## Directory Tree

```
originer/
├── frontend/
│   ├── src/
│   │   ├── screens/          # Lesson screen components
│   │   ├── components/       # Reusable UI components
│   │   ├── state/            # Frontend state management
│   │   │   ├── session/     # Session state
│   │   │   ├── screens/     # Screen state and transitions
│   │   │   └── progress/    # Progress visualization state
│   │   ├── constraints/      # Constraint enforcement logic
│   │   ├── services/        # API clients and sync logic
│   │   └── utils/           # Frontend utilities
│   ├── public/
│   └── tests/
├── backend/
│   ├── api/
│   │   ├── sessions/        # Session endpoints
│   │   ├── screens/         # Lesson screen endpoints
│   │   └── messages/        # Message endpoints (screen-scoped)
│   ├── core/
│   ├── domain/
│   │   ├── instructor/
│   │   ├── learner/
│   │   └── screens/         # Screen domain logic
│   ├── services/
│   ├── adapters/
│   │   ├── llm/
│   │   ├── storage/
│   │   └── memory/
│   └── infrastructure/
├── shared/
│   ├── types/               # Shared TypeScript types
│   │   ├── domain/         # Domain models (Session, Screen, etc.)
│   │   └── api/            # API request/response types
│   └── constraints/        # Shared constraint definitions
├── config/
│   ├── prompts/
│   │   ├── instructor/
│   │   └── system/
│   └── settings/
├── storage/
│   ├── sessions/
│   └── memory/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/
│   ├── architecture/
│   └── prompts/
└── scripts/
```

## Top-Level Directory Explanations

### `frontend/`
**Purpose**: Web-based active learning interface

The frontend is NOT a thin UI—it's an active learning interface that:
- Visualizes learner progress
- Controls session flow
- Enforces learning constraints
- Prevents prompt abuse

Contains:
- **`src/screens/`**: Lesson screen components (concept introduction, practice, assessment, etc.)
- **`src/components/`**: Reusable UI components
- **`src/state/`**: Frontend state management:
  - **`session/`**: Session state synchronization
  - **`screens/`**: Screen state and transition logic
  - **`progress/`**: Progress visualization state
- **`src/constraints/`**: Constraint enforcement logic (rate limiting, validation, progression rules)
- **`src/services/`**: API clients and state synchronization logic
- **`src/utils/`**: Frontend utilities

### `backend/`
**Purpose**: Core backend application code

Contains all application logic, organized by architectural layers:
- **`api/`**: HTTP/gRPC handlers, request/response models, route definitions:
  - **`sessions/`**: Session management endpoints
  - **`screens/`**: Lesson screen endpoints (start, progress, unlock validation)
  - **`messages/`**: Message endpoints (scoped to screens)
- **`core/`**: Core business logic shared across domains (session management, orchestration)
- **`domain/`**: Domain-specific models and logic, strictly separated:
  - **`instructor/`**: Instructor domain (teaching style, instruction patterns, guidance logic)
  - **`learner/`**: Learner domain (progress tracking, memory, learning state)
  - **`screens/`**: Screen domain logic (unlock validation, progress tracking, constraint enforcement)
- **`services/`**: Service layer coordinating domain logic and adapters
- **`adapters/`**: External system integrations with clear interfaces:
  - **`llm/`**: LLM provider abstraction (allows easy replacement)
  - **`storage/`**: Data persistence abstraction
  - **`memory/`**: Long-term memory system abstraction
- **`infrastructure/`**: Cross-cutting concerns (logging, monitoring, middleware)

### `shared/`
**Purpose**: Code shared between frontend and backend

Ensures consistency and reduces duplication:
- **`types/`**: Shared TypeScript types:
  - **`domain/`**: Domain models (Session, LessonScreen, ScreenProgress, etc.)
  - **`api/`**: API request/response type definitions
- **`constraints/`**: Shared constraint definitions and validation logic

### `config/`
**Purpose**: Configuration files treated as data, not code

All configuration lives here, separate from application code:
- **`prompts/`**: Prompt templates and configurations:
  - **`instructor/`**: Instructor-specific prompts (teaching style, guidance patterns)
  - **`system/`**: System-level prompts (safety, consistency, memory instructions)
- **`settings/`**: Application settings (environment configs, feature flags, LLM provider settings)

### `storage/`
**Purpose**: Data storage (file-based or local database)

Persistent data storage:
- **`sessions/`**: Session state and metadata
- **`memory/`**: Long-term learner and instructor memory

### `tests/`
**Purpose**: Test suite

Organized by test type:
- **`unit/`**: Unit tests for individual components
- **`integration/`**: Integration tests for system interactions
- **`fixtures/`**: Test data and mock configurations

### `docs/`
**Purpose**: Documentation

- **`architecture/`**: System architecture, design decisions, domain boundaries
- **`prompts/`**: Prompt documentation, versioning, change logs

### `scripts/`
**Purpose**: Utility scripts

Development and deployment scripts (migrations, data seeding, etc.)

## Design Principles Reflected

1. **Frontend-Backend Co-Design**: Frontend and backend are designed together as an integrated system
2. **Active Learning Interface**: Frontend actively participates in learning flow, not just displaying messages
3. **Screen-Based Architecture**: System organized around lesson screens, not messages
4. **Shared Models**: `shared/` directory ensures frontend and backend use consistent types
5. **Prompts as configuration**: `config/prompts/` is separate from code
6. **Domain separation**: `domain/instructor/`, `domain/learner/`, and `domain/screens/` are strictly separated
7. **LLM replacement**: `adapters/llm/` provides abstraction layer for easy provider swapping
8. **Constraint Enforcement**: Constraints enforced at multiple layers (frontend UI, API validation, orchestrator)
