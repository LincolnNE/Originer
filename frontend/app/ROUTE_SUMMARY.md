# Next.js App Router Structure Summary

## Complete Directory Tree

```
app/
├── layout.tsx                          # Root layout (all states)
├── page.tsx                            # Landing (IDLE)
├── loading.tsx                         # Global loading
├── error.tsx                           # Global error (ERROR)
├── not-found.tsx                       # 404 (ERROR)
│
├── assess/                              # Assessment flow (optional)
│   └── [sessionId]/
│       ├── layout.tsx                   # Assessment layout
│       ├── page.tsx                     # Assessment (ASSESSING_LEVEL)
│       ├── loading.tsx                  # Assessment loading
│       └── error.tsx                    # Assessment error (ERROR)
│
└── lessons/                             # Main learning flow
    └── [sessionId]/
        ├── layout.tsx                   # Session layout
        ├── page.tsx                     # Session overview (redirect)
        ├── loading.tsx                  # Session loading
        ├── error.tsx                    # Session error (ERROR)
        │
        ├── [screenId]/                  # Lesson screen (core)
        │   ├── page.tsx                # Screen (IN_LESSON/AWAITING_FEEDBACK/REVIEWING)
        │   ├── loading.tsx              # Screen loading
        │   └── error.tsx               # Screen error (ERROR)
        │
        └── complete/                    # Session completion
            ├── page.tsx                 # Complete (COMPLETED)
            ├── loading.tsx              # Completion loading
            └── error.tsx                # Completion error (ERROR)
```

---

## Route-to-State Mapping

| Route | File | Frontend State(s) | Purpose |
|-------|------|-------------------|---------|
| `/` | `app/page.tsx` | `IDLE` | Landing page, start session |
| `/assess/[sessionId]` | `app/assess/[sessionId]/page.tsx` | `ASSESSING_LEVEL` | Level assessment (optional) |
| `/lessons/[sessionId]` | `app/lessons/[sessionId]/page.tsx` | `IN_LESSON` (redirect) | Session overview (redirect) |
| `/lessons/[sessionId]/[screenId]` | `app/lessons/[sessionId]/[screenId]/page.tsx` | `IN_LESSON`<br>`AWAITING_FEEDBACK`<br>`REVIEWING` | Main learning interface |
| `/lessons/[sessionId]/complete` | `app/lessons/[sessionId]/complete/page.tsx` | `COMPLETED` | Session completion |
| Any route error | `app/*/error.tsx` | `ERROR` | Route-specific errors |
| Global error | `app/error.tsx` | `ERROR` | Global error fallback |
| 404 | `app/not-found.tsx` | `ERROR` | Page not found |

---

## State Access Matrix

| Frontend State | Accessible Routes | Notes |
|----------------|-------------------|-------|
| `IDLE` | `/` | Landing page only |
| `ASSESSING_LEVEL` | `/assess/[sessionId]` | Optional, MVP skip |
| `IN_LESSON` | `/lessons/[sessionId]/[screenId]` | Main learning state |
| `AWAITING_FEEDBACK` | `/lessons/[sessionId]/[screenId]` | Same route as IN_LESSON |
| `REVIEWING` | `/lessons/[sessionId]/[screenId]` | Same route as IN_LESSON |
| `COMPLETED` | `/lessons/[sessionId]/complete` | Session completion |
| `ERROR` | Any route | Can occur on any route |

---

## Navigation Flow

```
/ (IDLE)
  ↓ (start learning)
/lessons/[sessionId]/screen_001 (IN_LESSON)
  ↓ (submit answer)
/lessons/[sessionId]/screen_001 (AWAITING_FEEDBACK)
  ↓ (feedback received)
/lessons/[sessionId]/screen_001 (REVIEWING)
  ↓ (click next)
/lessons/[sessionId]/screen_002 (IN_LESSON)
  ↓ (repeat)
/lessons/[sessionId]/screen_003 (IN_LESSON)
  ↓ (complete final screen)
/lessons/[sessionId]/complete (COMPLETED)
  ↓ (start new session)
/ (IDLE)
```

---

## Key Features

✅ **Route-to-State Mapping**: Each route maps to specific frontend states  
✅ **No Generic Pages**: No `/chat` or generic message pages  
✅ **Lesson Flow Reflected**: Routes follow lesson progression  
✅ **State-Specific Behavior**: Same route can show different UI based on state  
✅ **Error Handling**: Route-specific and global error boundaries  
✅ **Loading States**: Route-specific loading UI  
✅ **Deep Linking**: URL preserves state, refresh works  

---

## Implementation Status

All route files created with:
- ✅ TypeScript interfaces
- ✅ Route documentation
- ✅ State mapping comments
- ✅ Navigation logic comments
- ⏳ JSX implementation (pending)

See `APP_ROUTER_STRUCTURE.md` for complete documentation.
