# ORIGINER Frontend

## Overview

Next.js frontend for ORIGINER - a **classroom-based learning interface**, not a chat app.

**Framework**: Next.js 14+ (App Router)  
**State**: Zustand + React Context  
**Pattern**: Screen-based routes and components

---

## Structure Documentation

- **[ROUTES.md](./ROUTES.md)** - App route definitions
- **[SCREENS.md](./SCREENS.md)** - Lesson screen definitions
- **[STATE_OWNERSHIP.md](./STATE_OWNERSHIP.md)** - Client-side state ownership
- **[STRUCTURE.md](./STRUCTURE.md)** - Complete directory structure

---

## MVP Scope

**Included**:
- Landing page
- Single lesson screen type (`guided_practice`)
- Basic state management
- API client structure

**Excluded** (Future):
- Dashboard
- Registration
- Assessment flow
- Multiple screen types
- Advanced features

---

## Key Principles

1. **Screen-Based**: Routes and components organized by lesson screens
2. **State Ownership**: Frontend owns UI state, backend owns authoritative learning state
3. **Optimistic Updates**: Immediate UI feedback, sync with backend
4. **No Frontend Assumptions**: Backend returns JSON, framework-agnostic

---

## Next Steps

1. Initialize Next.js app
2. Create route structure
3. Create state stores
4. Create API clients
5. Implement components
