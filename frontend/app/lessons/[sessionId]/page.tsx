/**
 * Session Overview Page
 * 
 * Route: /lessons/[sessionId]
 * Primary Frontend State: Redirect (no state)
 * 
 * Purpose: Session overview (MVP: redirects to first screen)
 * 
 * ROUTE VALIDATION (REQUIRED):
 * 1. Session must exist (sessionId valid)
 * 2. Session must not be completed
 * 
 * INVALID ACCESS HANDLING:
 * - Session doesn't exist → Redirect to / (IDLE)
 * - Session completed → Redirect to /lessons/[sessionId]/complete (COMPLETED)
 * - Invalid sessionId → Redirect to / (IDLE)
 * 
 * MVP Behavior:
 * - Immediately redirects to /lessons/[sessionId]/[screenId] (first unlocked screen)
 * - No UI rendered
 * 
 * Future Behavior:
 * - Shows session progress overview
 * - Lists available screens
 * - Allows resume from last screen
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/state/hooks/useSession';
import { useLessonState } from '@/state/hooks/useLessonState';

interface PageProps {
  params: {
    sessionId: string;
  };
}

export default function SessionOverviewPage({ params }: PageProps) {
  const router = useRouter();
  const { sessionState, session, loadSession, setSessionState } = useSession();
  const { availableScreens } = useLessonState();

  // Initialize session state on mount
  useEffect(() => {
    if (sessionState === 'initializing' && params.sessionId) {
      // Mock: Initialize session state (no backend call yet)
      loadSession(params.sessionId).catch(() => {
        // Mock fallback: set active state
        setSessionState('active');
      });
    }
  }, [params.sessionId, sessionState, loadSession, setSessionState]);

  // Handle session state-based routing
  useEffect(() => {
    if (sessionState === 'error') {
      router.push('/');
      return;
    }

    if (sessionState === 'completed') {
      router.push(`/lessons/${params.sessionId}/complete`);
      return;
    }

    if (sessionState === 'active') {
      // Determine first available screen
      const firstScreen = availableScreens.length > 0 
        ? availableScreens[0] 
        : 'screen_001'; // Mock default
      
      router.push(`/lessons/${params.sessionId}/${firstScreen}`);
      return;
    }
  }, [sessionState, params.sessionId, availableScreens, router]);

  // Show loading while initializing
  if (sessionState === 'initializing' || sessionState === 'loading') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #333',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ margin: 0, color: '#666' }}>Loading session...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // MVP: No UI, redirects immediately
  return null;
}
