# Final Route Structure - LOCKED

## Status: EXECUTION-READY & LOCKED

**This structure is final and locked for execution.**

---

## Route Tree (Final)

```
app/
├── layout.tsx                          # Root layout
├── page.tsx                            # Landing → IDLE
├── loading.tsx                         # Global loading
├── error.tsx                           # Global error → ERROR
├── not-found.tsx                       # 404 → ERROR
│
├── assess/[sessionId]/                 # Assessment → ASSESSING_LEVEL
│   └── page.tsx, layout.tsx, loading.tsx, error.tsx
│
└── lessons/[sessionId]/                # Learning flow
    ├── page.tsx                        # Redirect (no state)
    ├── layout.tsx, loading.tsx, error.tsx
    │
    ├── [screenId]/                    # Lesson screen → IN_LESSON
    │   └── page.tsx, loading.tsx, error.tsx
    │
    └── complete/                      # Completion → COMPLETED
        └── page.tsx, loading.tsx, error.tsx
```

---

## Route-to-State Mapping (Final)

| Route | Primary State | Invalid Access → Redirect To |
|-------|---------------|------------------------------|
| `/` | `IDLE` | N/A (always accessible) |
| `/assess/[sessionId]` | `ASSESSING_LEVEL` | `/` or `/lessons/[sessionId]/screen_001` |
| `/lessons/[sessionId]` | **Redirect** | `/` or `/lessons/[sessionId]/complete` |
| `/lessons/[sessionId]/[screenId]` | `IN_LESSON` | `/lessons/[sessionId]` or `/lessons/[sessionId]/complete` |
| `/lessons/[sessionId]/complete` | `COMPLETED` | `/lessons/[sessionId]/[screenId]` or `/` |

---

## Key Rules

1. ✅ **One Route = One State**: Each route maps to exactly one primary frontend state
2. ✅ **Invalid Access Prevention**: All invalid access redirects to valid route
3. ✅ **No Free-Form Interaction**: No routes allow unrestricted input
4. ✅ **Strict Validation**: All routes validate before rendering

---

## Invalid Access Handling

- **Invalid sessionId** → Redirect to `/`
- **Locked screen** → Redirect to `/lessons/[sessionId]`
- **Completed screen** → Redirect to next screen or complete
- **Early completion access** → Redirect to first incomplete screen
- **Completed assessment** → Redirect to first lesson screen

---

## State Transitions

**Within Route** (`/lessons/[sessionId]/[screenId]`):
- `IN_LESSON` → `AWAITING_FEEDBACK` → `REVIEWING` → `IN_LESSON` (same route)

**Route Changes**:
- `REVIEWING` → `IN_LESSON` (proceed) → Navigate to `/lessons/[sessionId]/[nextScreenId]`
- `REVIEWING` → `COMPLETED` (final screen) → Navigate to `/lessons/[sessionId]/complete`

---

## Implementation

- Server-side validation in route `page.tsx` files
- Client-side validation in components
- Redirect on invalid access
- State machine initialization on route load

---

**This structure is LOCKED and ready for execution.**
