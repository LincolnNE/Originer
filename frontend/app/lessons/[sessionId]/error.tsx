/**
 * Session Error Boundary
 * 
 * Route: /lessons/[sessionId]/*
 * Frontend State: ERROR
 * 
 * Purpose: Handle session-specific errors
 */

'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SessionError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Session error:', error);
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
        Unable to load session
      </h2>
      <p style={{
        margin: 0,
        color: '#666',
        maxWidth: '500px'
      }}>
        {error.message || 'There was a problem loading this session. Please try again.'}
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
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
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
          Retry
        </button>
        <a
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '500',
            color: '#333',
            backgroundColor: 'transparent',
            border: '1px solid #ccc',
            borderRadius: '4px',
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = '#333'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = '#ccc'}
        >
          Start over
        </a>
      </div>
    </div>
  );
}
