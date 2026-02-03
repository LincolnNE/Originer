/**
 * Landing Page
 * 
 * Route: /
 * Primary Frontend State: IDLE
 * 
 * Purpose: Entry point - start a new learning session
 * 
 * ROUTE VALIDATION (REQUIRED):
 * - None (always accessible, entry point)
 * 
 * INVALID ACCESS HANDLING:
 * - N/A (always accessible)
 * 
 * Allowed Actions:
 * - Start new session
 * - Continue existing session (future)
 * 
 * Forbidden Actions:
 * - All lesson-specific actions
 * 
 * Navigation:
 * - On "Start Learning" → Create session → Redirect to /lessons/[sessionId]/screen_001
 * - On "Continue Session" (future) → Redirect to /lessons/[sessionId]/[screenId]
 * 
 * State Transitions:
 * - IDLE → IN_LESSON (on session creation)
 * - IDLE → ERROR (on session creation failure)
 */

'use client'; // Client component (needs interactivity)

import { useRouter } from 'next/navigation';
// import { useAppStateMachine } from '@/state/hooks/useAppStateMachine';
// import { useSession } from '@/state/hooks/useSession';

export default function LandingPage() {
  const router = useRouter();
  // const { currentState, transitionTo } = useAppStateMachine();
  // const { createSession } = useSession();

  // TODO: Implement JSX
  // - "Start Learning" button
  // - Create session on click
  // - Redirect to /lessons/[sessionId]/screen_001
  
  // Structure:
  // 1. Initialize IDLE state
  // 2. Use useSession hook
  // 3. Handle button click
  // 4. Create session via API
  // 5. Navigate to first screen
  // 6. Transition to IN_LESSON state
  
  return null; // Placeholder - no JSX yet
}
