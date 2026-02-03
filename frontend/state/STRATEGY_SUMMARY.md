# State Management Strategy Summary (LOCKED)

## Final Decision

**Mechanism**: **Zustand + Custom State Machine Layer**

**No alternatives considered. This is the binding decision.**

---

## Where State Transitions Are Declared

**Location**: `state/stores/appStateMachineStore.ts`

**Method**: `VALID_TRANSITIONS` matrix + `transitionTo()` method

**Runtime Validation**: `transitionTo()` checks matrix before allowing transition

---

## How Invalid Transitions Are Prevented

**Multi-Layer Runtime Validation**:
1. **Store Level**: `transitionTo()` validates `VALID_TRANSITIONS` matrix
2. **Hook Level**: `safeTransitionTo()` double-checks validation
3. **Component Level**: `canPerformAction()` checks before rendering
4. **Constraint Level**: Constraints checked before transitions

**Result**: Invalid transitions blocked at multiple layers, cannot occur

---

## How State Survives Refresh/Navigation

**UI State**: `localStorage` (browser storage)
- Current state machine state
- Current screen ID
- Draft answers (optional)

**Authoritative State**: Backend (database/storage)
- Session state
- Screen progress
- Constraints
- Instructor responses

**Flow**:
1. Refresh → Server Component fetches authoritative state
2. Client Component loads UI state from localStorage
3. Client Component initializes Zustand stores with both
4. Client Component reconciles states (backend wins for learning state)

---

## Non-Goals

**This system will NOT handle**:
- ❌ Offline functionality
- ❌ Multi-tab synchronization
- ❌ Undo/redo
- ❌ State time travel
- ❌ Cross-device sync
- ❌ State compression
- ❌ State migration
- ❌ State analytics

---

## Binding for JSX Implementation

**All components must**:
- Use Zustand stores via hooks
- Use `useAppStateMachine()` for state machine
- Call `transitionTo()` for transitions
- Load from localStorage on mount
- Save to localStorage on changes
- Sync with backend via Server Components

**No deviations allowed.**

---

**Status**: FINAL & LOCKED

See `FINAL_STATE_MANAGEMENT_STRATEGY.md` for complete documentation.
