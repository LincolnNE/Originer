/**
 * Example Usage of Frontend-Only Domain Models
 * 
 * Demonstrates how these types work with React state management
 * to prevent invalid UI states.
 */

import {
  LessonUIState,
  AllowedInteraction,
  InstructorActivity,
  ProgressSnapshot,
  isInputEnabled,
  isSubmitting,
  getBlockingReasons,
} from './ui-models';

// ============================================================================
// React Hook Example: useLessonUIState
// ============================================================================

import { useState, useCallback } from 'react';

/**
 * Example React hook using LessonUIState
 * TypeScript ensures only valid state transitions
 */
export function useLessonUIState(screenId: string) {
  const [state, setState] = useState<LessonUIState>({
    type: 'idle',
    screenId,
    timestamp: Date.now(),
    canStart: true,
  });

  const startLesson = useCallback(() => {
    // TypeScript ensures we can only transition to valid states
    setState({
      type: 'loading',
      screenId,
      timestamp: Date.now(),
      loadingReason: 'initial',
    });
  }, [screenId]);

  const setReady = useCallback((canSubmit: boolean, blockingReasons: string[] = []) => {
    setState({
      type: 'ready',
      screenId,
      timestamp: Date.now(),
      inputEnabled: true,
      canSubmit,
      blockingReasons,
    });
  }, [screenId]);

  const startInteracting = useCallback((inputValue: string) => {
    setState({
      type: 'interacting',
      screenId,
      timestamp: Date.now(),
      inputEnabled: true,
      inputValue,
      canSubmit: inputValue.length > 0, // Example validation
      validationErrors: inputValue.length === 0 ? ['Answer cannot be empty'] : [],
    });
  }, [screenId]);

  const submitAnswer = useCallback((answer: string) => {
    // TypeScript ensures we can only call this if state allows it
    if (state.type !== 'ready' && state.type !== 'interacting') {
      return;
    }

    setState({
      type: 'submitting',
      screenId,
      timestamp: Date.now(),
      inputEnabled: false,
      submittedValue: answer,
      submittedAt: Date.now(),
    });
  }, [screenId, state]);

  // Type guards ensure type safety
  const handleInputChange = useCallback((value: string) => {
    if (isInputEnabled(state)) {
      // TypeScript knows state.inputEnabled is true here
      startInteracting(value);
    }
  }, [state, startInteracting]);

  return {
    state,
    startLesson,
    setReady,
    startInteracting,
    submitAnswer,
    handleInputChange,
    // Type-safe helpers
    canInput: isInputEnabled(state),
    isSubmitting: isSubmitting(state),
    blockingReasons: getBlockingReasons(state),
  };
}

// ============================================================================
// React Component Example: LessonScreen
// ============================================================================

import React from 'react';

interface LessonScreenProps {
  uiState: LessonUIState;
  instructorActivity: InstructorActivity;
  allowedInteractions: AllowedInteraction[];
  progressSnapshot: ProgressSnapshot;
}

export function LessonScreen({
  uiState,
  instructorActivity,
  allowedInteractions,
  progressSnapshot,
}: LessonScreenProps) {
  // TypeScript ensures we handle all possible states
  const renderInput = () => {
    switch (uiState.type) {
      case 'ready':
      case 'interacting':
        // TypeScript knows inputEnabled is true
        return (
          <input
            disabled={!uiState.inputEnabled}
            value={uiState.type === 'interacting' ? uiState.inputValue : ''}
            onChange={(e) => {
              // Handle input change
            }}
          />
        );
      case 'submitting':
      case 'streaming':
      case 'processing':
        // TypeScript knows inputEnabled is false
        return (
          <input
            disabled={true}
            value={uiState.submittedValue}
            readOnly
          />
        );
      case 'blocked':
        // TypeScript knows inputEnabled is false
        return (
          <input
            disabled={true}
            placeholder={uiState.blockingReason}
          />
        );
      case 'idle':
      case 'loading':
      case 'error':
        return null; // No input in these states
    }
  };

  const renderSubmitButton = () => {
    const submitInteraction = allowedInteractions.find(
      (i): i is AllowedInteraction & { type: 'submit' } => i.type === 'submit'
    );

    if (!submitInteraction) {
      return null;
    }

    // TypeScript ensures submitInteraction has correct type
    return (
      <button
        disabled={!submitInteraction.enabled}
        onClick={() => {
          if (submitInteraction.enabled && submitInteraction.validationPassed) {
            // Submit answer
          }
        }}
      >
        {submitInteraction.enabled ? 'Submit' : 'Cannot Submit'}
        {submitInteraction.blockingReasons.length > 0 && (
          <span>{submitInteraction.blockingReasons.join(', ')}</span>
        )}
      </button>
    );
  };

  const renderInstructorActivity = () => {
    // TypeScript ensures we handle all activity types
    switch (instructorActivity.type) {
      case 'presenting':
        return <div>{instructorActivity.content.problem}</div>;
      case 'waiting':
        return <div>Waiting for your response...</div>;
      case 'analyzing':
        return (
          <div>
            Analyzing your answer...
            {instructorActivity.progress !== undefined && (
              <progress value={instructorActivity.progress} max={100} />
            )}
          </div>
        );
      case 'providing_feedback':
        return (
          <div>
            {instructorActivity.content}
            {instructorActivity.isStreaming && (
              <span>Streaming...</span>
            )}
          </div>
        );
      case 'feedback_complete':
        return <div>{instructorActivity.feedbackContent}</div>;
      case 'error':
        return <div>Error: {instructorActivity.errorMessage}</div>;
    }
  };

  return (
    <div>
      <div>{renderInstructorActivity()}</div>
      <div>{renderInput()}</div>
      <div>{renderSubmitButton()}</div>
      <div>
        Progress: {progressSnapshot.screen.mastery.progress}%
        {progressSnapshot.screen.canProceed && (
          <button>Next Screen</button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// State Transition Example
// ============================================================================

/**
 * Type-safe state transition function
 * TypeScript ensures only valid transitions
 */
export function transitionUIState(
  currentState: LessonUIState,
  targetType: LessonUIState['type']
): LessonUIState {
  // TypeScript ensures we handle all possible transitions
  switch (currentState.type) {
    case 'idle':
      if (targetType === 'loading') {
        return {
          type: 'loading',
          screenId: currentState.screenId,
          timestamp: Date.now(),
          loadingReason: 'initial',
        };
      }
      break;
    case 'loading':
      if (targetType === 'ready') {
        return {
          type: 'ready',
          screenId: currentState.screenId,
          timestamp: Date.now(),
          inputEnabled: true,
          canSubmit: false,
          blockingReasons: [],
        };
      }
      break;
    case 'ready':
    case 'interacting':
      if (targetType === 'submitting') {
        const submittedValue = currentState.type === 'interacting'
          ? currentState.inputValue
          : '';
        return {
          type: 'submitting',
          screenId: currentState.screenId,
          timestamp: Date.now(),
          inputEnabled: false,
          submittedValue,
          submittedAt: Date.now(),
        };
      }
      break;
    case 'submitting':
      if (targetType === 'streaming') {
        return {
          type: 'streaming',
          screenId: currentState.screenId,
          timestamp: Date.now(),
          inputEnabled: false,
          submittedValue: currentState.submittedValue,
          streamedContent: '',
          canCancel: true,
          startedAt: Date.now(),
        };
      }
      break;
    case 'streaming':
      if (targetType === 'processing') {
        return {
          type: 'processing',
          screenId: currentState.screenId,
          timestamp: Date.now(),
          inputEnabled: false,
          feedbackReceived: true,
          feedbackContent: currentState.streamedContent,
        };
      }
      break;
    case 'error':
      if (targetType === currentState.previousState.type) {
        // Can retry to previous state
        return currentState.previousState;
      }
      break;
  }

  // Invalid transition - return current state
  return currentState;
}
