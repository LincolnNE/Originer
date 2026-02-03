# Frontend Routes Definition

## Next.js App Router Structure

**Framework**: Next.js 14+ (App Router)  
**Pattern**: Screen-based routes (classroom, not chat)

---

## Route Hierarchy

```
/                                    → Landing page (start session)
/lessons/[sessionId]                → Session overview (optional, MVP: skip)
/lessons/[sessionId]/[screenId]    → Lesson screen (main learning interface)
```

---

## Route Definitions

### 1. Landing Page

**Route**: `/`  
**File**: `app/page.tsx`  
**Purpose**: Entry point - start a new learning session

**MVP Scope**:
- Simple "Start Learning" button
- Creates anonymous session
- Redirects to first lesson screen

**Future Expansion**:
- Welcome message
- Value proposition
- "Continue Session" for returning learners

---

### 2. Session Route (Optional for MVP)

**Route**: `/lessons/[sessionId]`  
**File**: `app/lessons/[sessionId]/page.tsx`  
**Purpose**: Session overview (MVP: can skip, redirect directly to screen)

**MVP Scope**:
- Redirect to first screen (`/lessons/[sessionId]/screen_001`)

**Future Expansion**:
- Session progress overview
- Available screens list
- Resume from last screen

---

### 3. Lesson Screen Route (Core)

**Route**: `/lessons/[sessionId]/[screenId]`  
**File**: `app/lessons/[sessionId]/[screenId]/page.tsx`  
**Purpose**: Main learning interface - the "classroom"

**MVP Scope**:
- Single screen type: Guided Practice
- Problem display
- Answer input
- Submit button
- Feedback display (SSE streaming)
- Progress indicator
- Next button (when can proceed)

**Future Expansion**:
- Multiple screen types (introduction, assessment, etc.)
- Screen-specific layouts
- Navigation sidebar

---

## Route Groups (Future)

For future expansion, use route groups:

```
app/
├── (auth)/
│   └── register/
│       └── page.tsx          → Registration (future)
├── (dashboard)/
│   └── dashboard/
│       └── page.tsx          → Dashboard (future)
└── (learning)/
    └── lessons/
        └── [sessionId]/
            └── [screenId]/
                └── page.tsx → Lesson screen (MVP)
```

**MVP**: No route groups needed (single flow)

---

## Dynamic Route Parameters

### `[sessionId]`
- **Type**: `string`
- **Format**: `sess_<timestamp>_<random>`
- **Source**: Created on landing page, stored in URL
- **Purpose**: Identifies learning session

### `[screenId]`
- **Type**: `string`
- **Format**: `screen_<number>` (e.g., `screen_001`, `screen_002`)
- **Source**: Determined by lesson flow
- **Purpose**: Identifies current lesson screen

---

## Navigation Flow

**MVP Flow**:
```
Landing Page (/)
  ↓ (click "Start Learning")
Create Session → Redirect to /lessons/[sessionId]/screen_001
  ↓ (complete screen)
/lessons/[sessionId]/screen_002
  ↓ (complete screen)
/lessons/[sessionId]/screen_003
  ↓ (session complete)
Session Complete Screen (same route, different state)
```

**Navigation Rules**:
- Frontend controls navigation (can go back, can't skip ahead)
- Backend validates screen unlocks
- URL reflects current screen (enables refresh/reload)

---

## Route Layouts

### Root Layout
**File**: `app/layout.tsx`  
**Purpose**: Global layout (providers, global styles)

**Contains**:
- State providers (SessionProvider, etc.)
- Global error boundary
- Global styles

### Learning Layout (Future)
**File**: `app/(learning)/layout.tsx`  
**Purpose**: Learning-specific layout (progress bar, navigation)

**MVP**: Not needed (single screen type)

---

## Deep Linking Support

**URL Structure**: `/lessons/[sessionId]/[screenId]`

**Benefits**:
- Refresh preserves screen
- Shareable URLs
- Browser back/forward works
- Direct navigation to specific screen

**Implementation**:
- URL params drive screen loading
- State syncs with URL
- Navigation updates URL

---

## Route Protection (Future)

**MVP**: No authentication needed (anonymous sessions)

**Future**:
- Protected routes for authenticated users
- Session ownership validation
- Screen unlock validation (backend)

---

## Summary

**MVP Routes**:
1. `/` - Landing page
2. `/lessons/[sessionId]/[screenId]` - Lesson screen

**Route Pattern**: Screen-based (classroom), not message-based (chat)

**Navigation**: Frontend-controlled, URL-driven, backend-validated
