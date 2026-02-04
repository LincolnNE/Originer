/**
 * Lesson Screen Page
 * 
 * Route: /lessons/[sessionId]/[screenId]
 * Primary Frontend State: IN_LESSON
 * 
 * Purpose: Main learning interface - the "classroom"
 * 
 * ROUTE VALIDATION (REQUIRED):
 * 1. Session must exist (sessionId valid)
 * 2. Session must not be completed
 * 3. Screen must be unlocked for session
 * 4. Screen must not be completed
 * 
 * INVALID ACCESS HANDLING:
 * - Session doesn't exist → Redirect to / (IDLE)
 * - Session completed → Redirect to /lessons/[sessionId]/complete (COMPLETED)
 * - Screen locked → Redirect to /lessons/[sessionId] (redirects to first unlocked)
 * - Screen completed → Redirect to /lessons/[sessionId]/[nextScreenId] or /lessons/[sessionId]/complete
 * - Invalid screenId → Redirect to /lessons/[sessionId]
 * 
 * STATE BEHAVIOR:
 * - Primary state: IN_LESSON (initialized on route load)
 * - UI states within route: AWAITING_FEEDBACK, REVIEWING (handled by component state machine)
 * - State transitions within route: Same URL, state change only
 * - Route-changing transitions: Navigate to new URL
 * 
 * Navigation:
 * - On "Next" (if unlocked) → Navigate to /lessons/[sessionId]/[nextScreenId]
 * - On "Revise Answer" → Stay on same route, transition to IN_LESSON
 * - On "Back" → Navigate to /lessons/[sessionId]/[previousScreenId]
 * - On session complete → Redirect to /lessons/[sessionId]/complete
 * 
 * State Transitions:
 * - IN_LESSON → AWAITING_FEEDBACK (on submit, same route)
 * - AWAITING_FEEDBACK → REVIEWING (on feedback received, same route)
 * - REVIEWING → IN_LESSON (on revise, same route) or (on proceed, new route)
 * - Any state → ERROR (on error)
 */

'use client'; // Client component (needs interactivity)

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAppStateMachine } from '@/state/hooks/useAppStateMachine';
import { useSession } from '@/state/hooks/useSession';
import { useLessonState } from '@/state/hooks/useLessonState';
import ScreenRenderer from '@/components/ScreenRenderer';

interface LessonScreenPageProps {
  params: {
    sessionId: string;
    screenId: string;
  };
}

export default function LessonScreenPage({ params }: LessonScreenPageProps) {
  const { sessionId, screenId } = params;
  const router = useRouter();
  const { currentState, transitionTo } = useAppStateMachine();
  const { sessionState, session, loadSession, setSessionState } = useSession();
  const { currentScreenId, lessonState, setCurrentScreen, setLessonState } = useLessonState();

  // Initialize session state on mount
  useEffect(() => {
    if (sessionState === 'initializing' && sessionId) {
      // Mock: Initialize session state (no backend call yet)
      // In production, this would call loadSession(sessionId)
      loadSession(sessionId).catch(() => {
        // Mock fallback: create mock session state
        setSessionState('active');
      });
    }
  }, [sessionId, sessionState, loadSession]);

  // Initialize screen state on mount
  useEffect(() => {
    if (currentScreenId !== screenId) {
      setCurrentScreen(screenId);
      
      // Mock: Initialize lesson state (no backend call yet)
      // In production, this would call loadScreen(sessionId, screenId)
      if (!lessonState || lessonState.screenId !== screenId) {
        setLessonState({
          screenId,
          uiState: 'ready',
          navigationState: {
            canGoBack: true,
            canGoForward: false,
            canSkip: false,
            availableScreens: [],
            lockedScreens: [],
          },
          interactionAvailability: {
            canSubmit: true,
            canAskQuestion: true,
            canRequestHelp: true,
            canRetry: false,
            canCancel: false,
            canEdit: true,
          },
          visualState: {
            showProgress: true,
            showTimer: false,
            showConstraints: true,
            showFeedback: false,
            showNextButton: false,
            showSubmitButton: true,
            disabledActions: [],
          },
          syncStatus: {
            isSynced: true,
            lastSyncedAt: new Date(),
            pendingChanges: false,
            syncError: null,
          },
        });
      }
    }
  }, [screenId, currentScreenId, lessonState, setCurrentScreen, setLessonState]);

  // Transition to IN_LESSON state if not already there
  useEffect(() => {
    if (sessionState === 'active' && currentState !== 'IN_LESSON') {
      transitionTo('IN_LESSON');
    }
  }, [sessionState, currentState, transitionTo]);

  // Handle invalid session states
  useEffect(() => {
    if (sessionState === 'error') {
      router.push('/');
    } else if (sessionState === 'completed') {
      router.push(`/lessons/${sessionId}/complete`);
    }
  }, [sessionState, sessionId, router]);

  // Render based on screen state
  if (!lessonState) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e9ecef',
          borderTop: '4px solid #0066cc',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ 
            margin: '0 0 0.5rem 0', 
            color: '#1a1a1a',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            Loading lesson screen
          </p>
          <p style={{ 
            margin: 0, 
            color: '#666',
            fontSize: '0.875rem'
          }}>
            Preparing your learning materials...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <ScreenRenderer
        sessionId={sessionId}
        screenId={screenId}
        screenState={lessonState.uiState}
      />
    </div>
  );
}
