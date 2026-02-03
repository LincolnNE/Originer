# Route Validation & Protection

## Overview

**Purpose**: Ensure invalid state access via URL is impossible or redirected

**Enforcement**: Server-side validation in route pages + Client-side validation in components

---

## Route Validation Rules

### 1. Landing Page (`/`)

**Validation**: None (always accessible)

**Invalid Access**: N/A

---

### 2. Assessment Route (`/assess/[sessionId]`)

**Validation**:
- ✅ Session exists
- ✅ Session not completed
- ✅ Assessment not completed

**Invalid Access**:
- Session doesn't exist → Redirect to `/`
- Session completed → Redirect to `/lessons/[sessionId]/complete`
- Assessment completed → Redirect to `/lessons/[sessionId]/screen_001`

---

### 3. Session Overview (`/lessons/[sessionId]`)

**Validation**:
- ✅ Session exists
- ✅ Session not completed

**Invalid Access**:
- Session doesn't exist → Redirect to `/`
- Session completed → Redirect to `/lessons/[sessionId]/complete`

**Behavior**: Always redirects to first unlocked screen

---

### 4. Lesson Screen (`/lessons/[sessionId]/[screenId]`)

**Validation**:
- ✅ Session exists
- ✅ Session not completed
- ✅ Screen unlocked
- ✅ Screen not completed

**Invalid Access**:
- Session doesn't exist → Redirect to `/`
- Session completed → Redirect to `/lessons/[sessionId]/complete`
- Screen locked → Redirect to `/lessons/[sessionId]`
- Screen completed → Redirect to `/lessons/[sessionId]/[nextScreenId]` or `/lessons/[sessionId]/complete`
- Invalid screenId → Redirect to `/lessons/[sessionId]`

---

### 5. Session Complete (`/lessons/[sessionId]/complete`)

**Validation**:
- ✅ Session exists
- ✅ Session completed

**Invalid Access**:
- Session doesn't exist → Redirect to `/`
- Session not completed → Redirect to `/lessons/[sessionId]/[screenId]` (first incomplete screen)

---

## Validation Implementation Pattern

### Server Component Pattern

```typescript
// app/lessons/[sessionId]/[screenId]/page.tsx
export default async function LessonScreenPage({ params }) {
  // 1. Validate session exists
  const session = await fetchSession(params.sessionId);
  if (!session) {
    redirect('/');
  }

  // 2. Validate session not completed
  if (session.completed) {
    redirect(`/lessons/${params.sessionId}/complete`);
  }

  // 3. Validate screen unlocked
  const screen = await fetchScreen(params.screenId);
  if (!screen.unlocked) {
    redirect(`/lessons/${params.sessionId}`);
  }

  // 4. Validate screen not completed
  if (screen.completed) {
    const nextScreen = await getNextScreen(params.sessionId);
    if (nextScreen) {
      redirect(`/lessons/${params.sessionId}/${nextScreen.id}`);
    } else {
      redirect(`/lessons/${params.sessionId}/complete`);
    }
  }

  // 5. If valid, render
  return <LessonScreenClient session={session} screen={screen} />;
}
```

---

## Invalid Access Scenarios

| Scenario | Route | Validation Fails | Redirect To |
|----------|-------|-----------------|-------------|
| Invalid sessionId | Any | Session doesn't exist | `/` |
| Completed session | `/lessons/[sessionId]/[screenId]` | Session completed | `/lessons/[sessionId]/complete` |
| Locked screen | `/lessons/[sessionId]/[screenId]` | Screen locked | `/lessons/[sessionId]` |
| Completed screen | `/lessons/[sessionId]/[screenId]` | Screen completed | `/lessons/[sessionId]/[nextScreenId]` |
| Early completion | `/lessons/[sessionId]/complete` | Session not completed | `/lessons/[sessionId]/[screenId]` |
| Completed assessment | `/assess/[sessionId]` | Assessment completed | `/lessons/[sessionId]/screen_001` |

---

## State Machine Enforcement

### Route Initialization

**On Route Load**:
1. Validate route access (server-side)
2. Load session/screen state
3. Initialize state machine to route's primary state
4. Render component

**Example**:
- Route: `/lessons/[sessionId]/[screenId]`
- Primary State: `IN_LESSON`
- Initialization: `transitionTo('IN_LESSON', { sessionId, screenId })`

---

## Summary

**Validation**: Server-side in route pages, client-side in components

**Invalid Access**: Always redirects to valid route

**State Enforcement**: Route always initializes to primary state

**No Free-Form Routes**: All routes are structured and validated
