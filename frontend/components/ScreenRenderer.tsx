/**
 * Screen Renderer Component
 * 
 * State-driven renderer for lesson screens.
 * Renders UI based on current screen state (LessonUIState).
 * 
 * This component binds route pages to state-driven rendering.
 */

'use client';

import { LessonUIState } from '../types/state';
import LessonScreen from './screens/LessonScreen';

interface ScreenRendererProps {
  sessionId: string;
  screenId: string;
  screenState: LessonUIState;
}

export default function ScreenRenderer({ 
  sessionId, 
  screenId, 
  screenState 
}: ScreenRendererProps) {
  // State-based rendering logic
  // Each state maps to specific UI behavior
  
  switch (screenState) {
    case 'loading':
      // Show loading skeleton while screen data loads
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
          <p style={{ margin: 0, color: '#666' }}>Loading screen...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );

    case 'error':
      // Error state handled by error.tsx boundary
      // This should not normally render, but provides fallback
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#d32f2f' }}>Screen Error</h2>
          <p style={{ margin: '1rem 0', color: '#666' }}>
            Unable to load screen. Please try again.
          </p>
        </div>
      );

    case 'blocked':
      // Blocked by constraint - show blocking message
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#f57c00' }}>Action Blocked</h2>
          <p style={{ margin: '1rem 0', color: '#666' }}>
            This action is currently unavailable due to system constraints.
          </p>
        </div>
      );

    case 'idle':
    case 'ready':
    case 'interacting':
    case 'submitting':
    case 'streaming':
    case 'processing':
      // Active learning states - render main lesson screen
      return (
        <LessonScreen 
          sessionId={sessionId} 
          screenId={screenId}
        />
      );

    default:
      // Fallback for unknown states
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, color: '#666' }}>
            Unknown screen state: {screenState}
          </p>
        </div>
      );
  }
}
