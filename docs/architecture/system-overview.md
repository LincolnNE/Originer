# ORIGINER System Overview

## What is ORIGINER?

ORIGINER is a **web-based service** for AI-powered personalized learning. It pairs learners with AI instructors that adapt to individual learning styles and maintain consistent teaching personalities.

## Core Architecture Principles

### 1. Web-Based Service
ORIGINER is a full web application, not a simple API or chat interface. The entire system is designed for web deployment.

### 2. Active Learning Interface
The frontend is **NOT a thin UI**. It is an **active learning interface** that:
- **Visualizes learner progress**: Displays learning state, mastered concepts, progress markers, and learning trajectory
- **Controls session flow**: Manages lesson screen transitions, enforces sequencing, handles state transitions
- **Enforces learning constraints**: Prevents skipping ahead, enforces practice requirements, limits rapid submissions
- **Prevents prompt abuse**: Rate limiting, input validation, prompt injection prevention, gaming behavior detection

### 3. Frontend-Backend Co-Design
Frontend and backend are designed **together** as an integrated system:
- Shared domain models (`shared/types/`)
- Coordinated constraint enforcement
- Synchronized state management
- Screen-based API design

### 4. Screen-Based Architecture
Think in terms of **"lesson screens"**, not **"messages"**:
- UI organized around distinct learning phases
- Each screen has its own state, constraints, and progress
- Screens control learning progression
- Messages are scoped to screens

## System Components

### Frontend (`frontend/`)
**Active learning interface** with:
- Lesson screen components
- Progress visualization
- Constraint enforcement logic
- State management (session, screens, progress)
- API clients and synchronization

### Backend (`backend/`)
**Core application logic** with:
- Session orchestration
- Screen domain logic
- Instructor and learner domains
- LLM adapter abstraction
- Memory management

### Shared (`shared/`)
**Common code** between frontend and backend:
- Domain model types
- API request/response types
- Constraint definitions

## Key Concepts

### Lesson Screens
Distinct learning phases organized as screens:
- Concept Introduction
- Guided Practice
- Independent Practice
- Assessment
- Reflection
- Concept Mastery Check
- Misconception Correction

### Learning Constraints
Rules enforced to ensure proper learning:
- Minimum time on screen
- Required practice attempts
- Mastery thresholds
- Prerequisite completion
- Rate limiting
- Cooldown periods

### Screen Flow
Screens progress based on:
- Prerequisite completion
- Mastery achievement
- Constraint satisfaction
- Learning progress

## Design Implications

1. **Frontend Contains Business Logic**: The frontend has significant learning flow logic, not just presentation.

2. **Backend Supports Screens**: APIs are designed for screen-based operations, not just message-based.

3. **Shared Models**: Frontend and backend use the same domain models to ensure consistency.

4. **Multi-Layer Constraints**: Constraints enforced at UI, API, and orchestrator levels.

5. **No Simple Chat**: The UI is a structured learning environment, not a chat window.

## Architecture Documents

- **[System Architecture](./system-architecture.md)**: Complete system architecture with responsibility boundaries, state ownership, and communication patterns
- **[User Flow](./user-flow.md)**: End-to-end user flow from entry to session completion
- **[Domain Models](./domain-models.md)**: Core entities and types
- **[Frontend Architecture](./frontend-architecture.md)**: Frontend design and responsibilities
- **[API Contracts](./api-contracts.md)**: REST API specifications
- **[Session Orchestrator](./session-orchestrator.md)**: Backend orchestration logic
- **[Repository Structure](../../REPOSITORY_STRUCTURE.md)**: Code organization
