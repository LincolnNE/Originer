# Next.js App Router Structure - LOCKED

## Status: EXECUTION-READY & LOCKED

**This structure is final, locked, and ready for execution.**

---

## Final Route Tree

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
    ├── [screenId]/                     # Lesson screen → IN_LESSON
    │   └── page.tsx, loading.tsx, error.tsx
    │
    └── complete/                       # Completion → COMPLETED
        └── page.tsx, loading.tsx, error.tsx
```

---

## Route-to-State Mapping (FINAL)

| Route | Primary State | Validation | Invalid Access → Redirect |
|-------|---------------|------------|---------------------------|
| `/` | `IDLE` | None | N/A |
| `/assess/[sessionId]` | `ASSESSING_LEVEL` | Session exists, not completed, assessment not completed | `/` or `/lessons/[sessionId]/screen_001` |
| `/lessons/[sessionId]` | **Redirect** | Session exists, not completed | `/` or `/lessons/[sessionId]/complete` |
| `/lessons/[sessionId]/[screenId]` | `IN_LESSON` | Session exists, not completed, screen unlocked, screen not completed | `/lessons/[sessionId]` or `/lessons/[sessionId]/complete` |
| `/lessons/[sessionId]/complete` | `COMPLETED` | Session exists, session completed | `/lessons/[sessionId]/[screenId]` or `/` |

---

## Invalid Access Scenarios

| Scenario | Route | Redirect To |
|----------|-------|-------------|
| Invalid sessionId | Any | `/` |
| Locked screen | `/lessons/[sessionId]/[screenId]` | `/lessons/[sessionId]` |
| Completed screen | `/lessons/[sessionId]/[screenId]` | `/lessons/[sessionId]/[nextScreenId]` |
| Early completion | `/lessons/[sessionId]/complete` | `/lessons/[sessionId]/[screenId]` |
| Completed assessment | `/assess/[sessionId]` | `/lessons/[sessionId]/screen_001` |
| Completed session | `/lessons/[sessionId]/[screenId]` | `/lessons/[sessionId]/complete` |

---

## Key Rules

1. ✅ **One Route = One State**: Each route maps to exactly one primary frontend state
2. ✅ **Invalid Access Prevention**: All invalid access redirects to valid route
3. ✅ **No Free-Form Interaction**: No routes allow unrestricted input
4. ✅ **Strict Validation**: All routes validate before rendering

---

## Implementation Status

- [x] Route structure defined
- [x] State mapping documented
- [x] Validation requirements documented
- [x] Invalid access handling documented
- [ ] Server-side validation implemented
- [ ] Client-side validation implemented
- [ ] Redirect logic implemented

---

**This structure is LOCKED and ready for execution.**
