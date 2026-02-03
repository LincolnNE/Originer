# State Machine Summary

## Quick Reference

### States (7)

1. **IDLE** - Initial state, no session active
2. **ASSESSING_LEVEL** - Taking level assessment (optional, MVP: skip)
3. **IN_LESSON** - Actively in lesson screen
4. **AWAITING_FEEDBACK** - Waiting for instructor response
5. **REVIEWING** - Reviewing feedback, deciding next action
6. **COMPLETED** - Session/lesson completed
7. **ERROR** - Error state, can retry or reset

---

## State Flow (MVP)

```
IDLE → IN_LESSON → AWAITING_FEEDBACK → REVIEWING → IN_LESSON (revise)
                                                      ↓
                                                   COMPLETED
```

**MVP Note**: ASSESSING_LEVEL skipped, goes directly IDLE → IN_LESSON

---

## Action Permissions by State

| Action | IDLE | ASSESSING | IN_LESSON | AWAITING | REVIEWING | COMPLETED | ERROR |
|--------|------|-----------|-----------|----------|-----------|-----------|-------|
| startLearning | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| submitAnswer | ❌ | ✅* | ✅* | ❌ | ❌ | ❌ | ❌ |
| requestHint | ❌ | ✅* | ✅* | ❌ | ✅* | ❌ | ❌ |
| reviseAnswer | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| proceedToNext | ❌ | ❌ | ❌ | ❌ | ✅* | ❌ | ❌ |
| completeScreen | ❌ | ✅ | ❌ | ❌ | ✅* | ❌ | ❌ |
| navigateBack | ❌ | ✅* | ✅* | ❌ | ✅* | ❌ | ❌ |
| cancelSubmission | ❌ | ❌ | ❌ | ✅* | ❌ | ❌ | ❌ |
| retry | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| reset | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

* = Subject to constraints (rate limit, cooldown, mastery, etc.)

---

## Key Principles

1. **Explicit States Only**: No implicit transitions
2. **Action Validation**: Every action checked against state
3. **UI Blocking**: Invalid actions disabled in UI
4. **Constraint Enforcement**: Constraints checked before state transitions
5. **Error Recovery**: Error state with retry/reset options

---

## Implementation

- **Store**: `state/stores/appStateMachineStore.ts`
- **Hook**: `state/hooks/useAppStateMachine.ts`
- **Documentation**: `STATE_MACHINE.md`
