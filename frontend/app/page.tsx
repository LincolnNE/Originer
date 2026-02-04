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
 * Navigation:
 * - On "Start Learning" → Create session → Redirect to /lessons/[sessionId]/screen_001
 */

import { startSession } from './actions';

export default function LandingPage() {
  // Server Component - no event handlers allowed
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '700',
          margin: '0 0 1rem 0',
          color: '#1a1a1a',
          letterSpacing: '-0.02em'
        }}>
          ORIGINER
        </h1>
        
        <p style={{
          fontSize: '1.25rem',
          color: '#666',
          margin: '0 0 3rem 0',
          lineHeight: '1.6'
        }}>
          AI-powered personalized learning
        </p>

        <div style={{
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid #e9ecef'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            margin: '0 0 1rem 0',
            color: '#1a1a1a'
          }}>
            Ready to learn?
          </h2>
          <p style={{
            fontSize: '0.9375rem',
            color: '#666',
            margin: '0',
            lineHeight: '1.6'
          }}>
            Start a new learning session and work through interactive lessons with personalized guidance from your AI instructor.
          </p>
        </div>

        <form action={startSession} style={{ width: '100%' }}>
          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#fff',
              backgroundColor: '#0066cc',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            // No event handlers - Server Component
          >
            Start Learning
          </button>
        </form>
      </div>
    </main>
  );
}
