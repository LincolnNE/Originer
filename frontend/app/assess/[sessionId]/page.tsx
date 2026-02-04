/**
 * Assessment Screen Page
 * 
 * Route: /assess/[sessionId]
 * Primary Frontend State: ASSESSING_LEVEL
 * 
 * Purpose: Level assessment to determine starting point (optional, MVP: skip)
 * 
 * ROUTE VALIDATION (REQUIRED):
 * 1. Session must exist (sessionId valid)
 * 2. Session must not be completed
 * 3. Assessment must not be completed
 * 
 * INVALID ACCESS HANDLING:
 * - Session doesn't exist → Redirect to / (IDLE)
 * - Session completed → Redirect to /lessons/[sessionId]/complete (COMPLETED)
 * - Assessment completed → Redirect to /lessons/[sessionId]/screen_001 (IN_LESSON)
 * - Invalid sessionId → Redirect to / (IDLE)
 * 
 * Allowed Actions:
 * - Submit assessment answers
 * - Request assessment hints
 * - Complete assessment
 * 
 * Forbidden Actions:
 * - Navigate to lesson screens
 * - Skip assessment
 * 
 * Navigation:
 * - On completion → Redirect to /lessons/[sessionId]/screen_001
 * - On cancel → Redirect to / (IDLE)
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
// import { useAppStateMachine } from '@/state/hooks/useAppStateMachine';

interface PageProps {
  params: {
    sessionId: string;
  };
}

export default function AssessmentPage({ params }: PageProps) {
  const router = useRouter();
  // const { currentState, transitionTo } = useAppStateMachine();

  // TODO: Load assessment data
  // TODO: Initialize ASSESSING_LEVEL state
  // TODO: Handle assessment submission
  // TODO: Handle assessment completion
  // TODO: Handle navigation

  // MVP: Skip assessment, redirect to first lesson screen
  useEffect(() => {
    // For MVP, skip assessment and redirect
    const timer = setTimeout(() => {
      router.push(`/lessons/${params.sessionId}/screen_001`);
    }, 1500);
    return () => clearTimeout(timer);
  }, [params.sessionId, router]);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 1.5rem',
          backgroundColor: '#e7f3ff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0066cc" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: '600',
          margin: '0 0 1rem 0',
          color: '#1a1a1a'
        }}>
          Preparing Your Learning Path
        </h1>
        
        <p style={{
          fontSize: '1rem',
          color: '#666',
          margin: '0 0 2rem 0',
          lineHeight: '1.6'
        }}>
          We're setting up your personalized learning experience. You'll be redirected to your first lesson in a moment.
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          color: '#666',
          fontSize: '0.875rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#0066cc',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <span>Loading...</span>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </main>
  );
}
