# Frontend Structure Summary

## ✅ Structure Defined (No JSX Yet)

Frontend structure is defined with TypeScript interfaces, types, and placeholders. Ready for JSX implementation.

---

## 📁 Directory Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (placeholder)
│   ├── page.tsx                 # Landing page (placeholder)
│   └── lessons/
│       └── [sessionId]/
│           └── [screenId]/
│               └── page.tsx     # Lesson screen (placeholder)
│
├── components/
│   └── screens/
│       └── GuidedPractice.tsx   # MVP screen component (placeholder)
│
├── state/
│   ├── stores/                  # Zustand stores (✅ implemented)
│   │   ├── sessionStore.ts
│   │   ├── lessonStateStore.ts
│   │   ├── progressStore.ts
│   │   └── constraintStore.ts
│   ├── hooks/                    # Custom hooks (✅ implemented)
│   │   ├── useSession.ts
│   │   ├── useLessonState.ts
│   │   ├── useProgress.ts
│   │   └── useConstraints.ts
│   └── providers/               # Context providers (placeholder)
│       └── SessionProvider.tsx
│
├── services/
│   └── api/                      # API clients (✅ implemented)
│       ├── client.ts
│       ├── sessions.ts
│       └── lessons.ts
│
├── types/                        # TypeScript types (✅ implemented)
│   ├── screen.ts
│   ├── state.ts
│   └── api.ts
│
├── ROUTES.md                     # Route definitions
├── SCREENS.md                    # Screen definitions
├── STATE_OWNERSHIP.md            # State ownership
├── STRUCTURE.md                  # Complete structure
└── SUMMARY.md                    # This file
```

---

## 🛣️ App Routes

### Defined Routes

1. **`/`** - Landing page
   - File: `app/page.tsx`
   - Purpose: Start learning session
   - Status: ✅ Structure defined, ⏳ JSX pending

2. **`/lessons/[sessionId]/[screenId]`** - Lesson screen
   - File: `app/lessons/[sessionId]/[screenId]/page.tsx`
   - Purpose: Main learning interface
   - Status: ✅ Structure defined, ⏳ JSX pending

### Route Pattern
- **Screen-based**: Routes represent lesson screens, not messages
- **URL-driven**: Screen ID in URL enables refresh/reload
- **Frontend-controlled**: Navigation controlled by frontend, validated by backend

---

## 📺 Lesson Screens

### MVP: Single Screen Type

**Guided Practice Screen** (`guided_practice`)
- Only screen type for MVP
- Handles all learning interactions
- Component: `components/screens/GuidedPractice.tsx`

### Screen Structure

```typescript
LessonScreen {
  screenId: string;
  sessionId: string;
  screenType: 'guided_practice';
  content: ScreenContent;
  progress: ScreenProgress;
  constraints: ScreenConstraints;
  navigation: ScreenNavigation;
}
```

### Screen Lifecycle

```
not_started → active → completed
```

---

## 🗄️ Client-Side State Ownership

### Frontend Owns

- **UI State**: `idle`, `ready`, `interacting`, `submitting`, `streaming`
- **Navigation State**: Current screen, available screens, locked screens
- **Input State**: Answer text before submission
- **Client-Tracked Progress**: Time spent (approximate), attempt count (optimistic)

### Backend Owns

- **Session State**: Session ID, status, metadata
- **Screen State**: `not_started`, `active`, `completed`, `locked`
- **Authoritative Progress**: Actual attempts, mastery scores
- **Constraints**: Rate limits, cooldowns, thresholds
- **Instructor Responses**: Generated feedback content

### Synchronization

- **Optimistic Updates**: Frontend updates immediately for UX
- **Backend Validation**: Backend validates and returns authoritative state
- **Reconciliation**: Frontend reconciles optimistic state with backend response
- **Rollback**: Frontend rolls back on error

---

## 📦 State Management

### Zustand Stores (✅ Implemented)

1. **sessionStore** - Current session state
2. **lessonStateStore** - Lesson screen UI state
3. **progressStore** - Progress tracking
4. **constraintStore** - Constraint enforcement

### Custom Hooks (✅ Implemented)

1. **useSession** - Session management
2. **useLessonState** - Lesson state management
3. **useProgress** - Progress management
4. **useConstraints** - Constraint checking

### Context Providers (⏳ Placeholder)

1. **SessionProvider** - Session context provider

---

## 🔌 API Clients (✅ Implemented)

### Base Client
- **`services/api/client.ts`** - HTTP client with error handling

### Endpoint Clients
- **`services/api/sessions.ts`** - Session endpoints
- **`services/api/lessons.ts`** - Lesson endpoints

### API Methods
- `sessionsApi.createSession()`
- `sessionsApi.getSession()`
- `lessonsApi.startLesson()`
- `lessonsApi.submitAnswer()`
- `lessonsApi.requestHint()`
- `lessonsApi.completeLesson()`

---

## 📝 Type Definitions (✅ Implemented)

### Screen Types
- `LessonScreen`
- `ScreenType`
- `ScreenState`
- `ScreenContent`
- `ScreenProgress`
- `ScreenConstraints`
- `ScreenNavigation`

### State Types
- `LessonState`
- `ProgressState`
- `UIConstraint`
- `InteractionMode`

### API Types
- `ApiResponse<T>`
- `CreateSessionRequest/Response`
- `StartLessonRequest/Response`
- `SubmitAnswerRequest/Response`

---

## 🎯 Key Design Decisions

1. **Screen-Based Routes**: `/lessons/[sessionId]/[screenId]` (classroom, not chat)
2. **Single Screen Type (MVP)**: `guided_practice` only
3. **Zustand for State**: Lightweight, simple API
4. **Optimistic Updates**: Immediate UI feedback
5. **State Ownership Split**: Frontend (UI), Backend (authoritative)

---

## ✅ What's Complete

- ✅ Route structure defined
- ✅ Screen types defined
- ✅ State ownership defined
- ✅ Zustand stores implemented
- ✅ Custom hooks implemented
- ✅ API clients implemented
- ✅ Type definitions implemented
- ✅ Placeholder route files created

---

## ⏳ What's Pending

- ⏳ JSX implementation for routes
- ⏳ JSX implementation for components
- ⏳ Context provider JSX
- ⏳ SSE client implementation
- ⏳ Error boundaries
- ⏳ Loading states
- ⏳ Styling

---

## 🚀 Next Steps

1. **Initialize Next.js app**: `cd frontend && npm install`
2. **Implement route JSX**: Add JSX to `app/page.tsx` and `app/lessons/[sessionId]/[screenId]/page.tsx`
3. **Implement component JSX**: Add JSX to `components/screens/GuidedPractice.tsx`
4. **Implement provider JSX**: Add JSX to `state/providers/SessionProvider.tsx`
5. **Add styling**: CSS modules or Tailwind
6. **Test routes**: Verify navigation works
7. **Test API integration**: Verify API calls work

---

## 📚 Documentation

- **[ROUTES.md](./ROUTES.md)** - Detailed route definitions
- **[SCREENS.md](./SCREENS.md)** - Detailed screen definitions
- **[STATE_OWNERSHIP.md](./STATE_OWNERSHIP.md)** - State ownership details
- **[STRUCTURE.md](./STRUCTURE.md)** - Complete structure documentation

---

## Summary

**Structure**: ✅ Complete  
**Types**: ✅ Complete  
**Stores**: ✅ Complete  
**Hooks**: ✅ Complete  
**API Clients**: ✅ Complete  
**Routes**: ⏳ Placeholders ready for JSX  
**Components**: ⏳ Placeholders ready for JSX  

**Ready for**: JSX implementation
