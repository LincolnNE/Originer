/**
 * Session Complete Page
 * 
 * Route: /lessons/[sessionId]/complete
 * Primary Frontend State: COMPLETED
 * 
 * Purpose: Session completion screen
 * 
 * ROUTE VALIDATION (REQUIRED):
 * 1. Session must exist (sessionId valid)
 * 2. Session must be completed
 * 
 * INVALID ACCESS HANDLING:
 * - Session doesn't exist → Redirect to / (IDLE)
 * - Session not completed → Redirect to /lessons/[sessionId]/[screenId] (first incomplete screen)
 * - Invalid sessionId → Redirect to / (IDLE)
 * 
 * Allowed Actions:
 * - Start new session
 * - View session summary
 * - View progress
 * 
 * Forbidden Actions:
 * - All lesson-specific actions
 * - Navigation to lesson screens
 * 
 * Navigation:
 * - On "Start New Session" → Redirect to / (IDLE)
 * - On "View Summary" → Stay on same route (show summary)
 * 
 * State Transitions:
 * - COMPLETED → IDLE (on start new session)
 * - COMPLETED → IN_LESSON (on start new session, new session created)
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
// import { useAppStateMachine } from '@/state/hooks/useAppStateMachine';
// import { useSession } from '@/state/hooks/useSession';
// import { useProgress } from '@/state/hooks/useProgress';

interface PageProps {
  params: {
    sessionId: string;
  };
}

export default function SessionCompletePage({ params }: PageProps) {
  const router = useRouter();
  // const { currentState, transitionTo } = useAppStateMachine();
  // const { session } = useSession();
  // const { sessionProgress } = useProgress();

  const handleStartNew = () => {
    router.push('/');
  };

  // TODO: Load session summary
  // TODO: Initialize COMPLETED state
  // TODO: Handle "View Summary" action

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
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 2rem',
          backgroundColor: '#d4edda',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: '700',
          margin: '0 0 1rem 0',
          color: '#1a1a1a'
        }}>
          Session Complete!
        </h1>

        <p style={{
          fontSize: '1.125rem',
          color: '#666',
          margin: '0 0 3rem 0',
          lineHeight: '1.6'
        }}>
          Great work! You've completed this learning session. Review your progress below or start a new session to continue learning.
        </p>

        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid #e9ecef',
          textAlign: 'left'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            margin: '0 0 1rem 0',
            color: '#1a1a1a'
          }}>
            Session Summary
          </h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #e9ecef'
            }}>
              <span style={{ color: '#666', fontSize: '0.9375rem' }}>Session ID</span>
              <span style={{ color: '#1a1a1a', fontSize: '0.9375rem', fontFamily: 'monospace' }}>
                {params.sessionId.slice(0, 8)}...
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #e9ecef'
            }}>
              <span style={{ color: '#666', fontSize: '0.9375rem' }}>Status</span>
              <span style={{ 
                color: '#28a745', 
                fontSize: '0.9375rem',
                fontWeight: '500'
              }}>
                Completed
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#666', fontSize: '0.9375rem' }}>Progress</span>
              <span style={{ color: '#1a1a1a', fontSize: '0.9375rem', fontWeight: '500' }}>
                100%
              </span>
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <button
            onClick={handleStartNew}
            style={{
              width: '100%',
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#fff',
              backgroundColor: '#0066cc',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0052a3'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0066cc'}
          >
            Start New Session
          </button>
        </div>
      </div>
    </main>
  );
}
