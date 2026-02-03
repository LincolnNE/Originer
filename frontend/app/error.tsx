/**
 * Global Error Boundary
 * 
 * Route: N/A (catches all errors)
 * Frontend State: ERROR
 * 
 * Purpose: Global error fallback
 * 
 * Behavior:
 * - Catches unhandled errors
 * - Shows error message
 * - Provides retry/reset options
 * - Logs error for monitoring
 */

'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error for monitoring
    console.error('Global error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      gap: '1.5rem',
      textAlign: 'center'
    }}>
      <h2 style={{
        margin: 0,
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#333'
      }}>
        Something went wrong
      </h2>
      <p style={{
        margin: 0,
        color: '#666',
        maxWidth: '500px'
      }}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      {error.digest && (
        <p style={{
          margin: 0,
          fontSize: '0.875rem',
          color: '#999',
          fontFamily: 'monospace'
        }}>
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: '500',
          color: '#fff',
          backgroundColor: '#333',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#555'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#333'}
      >
        Try again
      </button>
    </div>
  );
}
