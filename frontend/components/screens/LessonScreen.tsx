/**
 * Lesson Screen Component
 * 
 * Main learning interface - the "classroom"
 * 
 * This is NOT a chat app - it's a structured lesson-based learning interface.
 * 
 * Structure:
 * - Top-level layout
 * - Instructor area (what instructor is doing)
 * - Learner task area (where learner works)
 * - Progress indicator (screen and session progress)
 * - System constraints area (what user cannot do)
 * - Action buttons (disabled by default)
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useInstructor } from '../../hooks/useInstructor';
import { useLessonState } from '../../state/hooks/useLessonState';
import InstructorMessage from '../InstructorMessage';
import { InstructorOutput } from '../../types/instructor';

interface LessonScreenProps {
  sessionId: string;
  screenId: string;
}

export default function LessonScreen({ sessionId, screenId }: LessonScreenProps) {
  // Instructor hook for AI interactions
  const { output, isLoading, processInput } = useInstructor();
  
  // Lesson state hook
  const { lessonState, transitionState, lockScreen, unlockScreen } = useLessonState();
  
  // Local state for answer input
  const [answerValue, setAnswerValue] = useState('');
  const [submittedAnswer, setSubmittedAnswer] = useState('');
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [assessmentResult, setAssessmentResult] = useState<InstructorOutput | null>(null);

  // Load problem presentation on mount
  useEffect(() => {
    if (!output || output.type !== 'problem_presentation') {
      processInput({
        sessionId,
        screenId,
        action: 'present_problem',
        actionData: {
          problem: 'Solve for x: 2x + 5 = 15',
          instructions: 'Type your answer in the box below.',
          concept: 'linear equations',
          learningObjective: 'Solve linear equations',
        },
      });
    }
  }, [sessionId, screenId, output, processInput]);

  // Handle assessment result
  useEffect(() => {
    if (output?.type === 'assessment') {
      setAssessmentResult(output);
      const content = output.content as any;
      
      // Update state based on assessment result
      if (content.screenLocked) {
        // Lock screen
        lockScreen(screenId, content.lockReason);
        transitionState('processing');
        // After processing, allow user to revise
        setTimeout(() => {
          transitionState('ready');
        }, 1000);
      } else if (content.canProceed) {
        // Unlock screen and allow proceeding
        unlockScreen(screenId);
        transitionState('processing');
        // After processing, show success state
        setTimeout(() => {
          transitionState('ready');
        }, 1000);
      }
    }
  }, [output, screenId, lockScreen, unlockScreen, transitionState]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!answerValue.trim()) {
      return; // Don't submit empty answers
    }

    // Transition to submitting state
    transitionState('submitting');
    setSubmittedAnswer(answerValue);

    try {
      // Trigger assessment via InstructorGateway
      await processInput({
        sessionId,
        screenId,
        action: 'provide_feedback',
        actionData: {
          learnerAnswer: answerValue,
          attemptNumber: currentAttempt,
          timeSpent: 120, // TODO: Track actual time spent
        },
      });
      
      // State transitions are handled in the useEffect above
    } catch (error) {
      console.error('Submit error:', error);
      transitionState('error');
    }
  }, [answerValue, sessionId, screenId, currentAttempt, processInput, transitionState]);

  // Revise handler
  const handleRevise = useCallback(() => {
    setAnswerValue('');
    setSubmittedAnswer('');
    setAssessmentResult(null);
    transitionState('ready');
  }, [transitionState]);

  // Determine current UI state from lessonState
  const uiState = lessonState?.uiState || 'idle';
  const isSubmitting = uiState === 'submitting';
  const isProcessing = uiState === 'processing';
  const hasAssessment = assessmentResult?.type === 'assessment';
  
  // Extract content from instructor output
  const problemStatement = output?.type === 'problem_presentation' 
    ? (output.content as any).problem 
    : 'Solve for x: 2x + 5 = 15';
  const instructions = output?.type === 'problem_presentation'
    ? (output.content as any).instructions
    : 'Type your answer in the box below.';
  
  // Determine action availability from lessonState
  const canSubmit = lessonState?.interactionAvailability.canSubmit && 
                    (uiState === 'ready' || uiState === 'interacting') &&
                    answerValue.trim().length > 0 &&
                    !isSubmitting &&
                    !isProcessing;
  const canRequestHint = lessonState?.interactionAvailability.canRequestHelp || false;
  const canProceed = hasAssessment && 
                     (assessmentResult.content as any).canProceed &&
                     uiState === 'ready';
  const canRevise = hasAssessment && 
                    (assessmentResult.content as any).screenLocked &&
                    uiState === 'ready';
  
  // Extract assessment data
  const assessmentContent = hasAssessment ? (assessmentResult.content as any) : null;
  const masteryScore = assessmentContent?.masteryScore;
  const masteryThreshold = assessmentContent?.masteryThreshold || 80;
  const nextScreenUnlocked = canProceed;
  
  // Placeholder values (will be replaced with actual state)
  const screenProgress = 40; // 0-100
  const sessionProgress = 60; // 0-100
  const maxAttempts = 5;
  const timeSpent = 120; // seconds
  const conceptsDemonstrated: string[] = [];
  const unlockRequirements = canProceed ? [] : ['Complete this screen correctly'];
  const blockingConstraints: string[] = [];

  return (
    <div className="lesson-screen">
      {/* Top-level layout container */}
      <div className="lesson-screen-container">
        
        {/* INSTRUCTOR AREA */}
        <section className="instructor-area" aria-label="Instructor area">
          <div className="instructor-area-header">
            {/* Instructor identity indicator */}
            <div className="instructor-identity">
              <div className="instructor-avatar">
                {/* TODO: Instructor avatar/icon */}
                <span>AI</span>
              </div>
              <div className="instructor-name">
                <span>AI Instructor</span>
              </div>
            </div>
            
            {/* Instructor status indicator */}
            <div className="instructor-status">
              <span className="instructor-activity">{isLoading ? 'Thinking...' : 'Ready'}</span>
            </div>
          </div>

          <div className="instructor-content">
            {/* Instructor Message Component - renders structured output */}
            {isLoading && !output && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid #f3f3f3',
                  borderTop: '3px solid #333',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Loading instructor response...</span>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}

            {output && (
              <InstructorMessage output={output} />
            )}

            {/* Fallback: Show problem statement if no output yet */}
            {!output && !isLoading && (
              <>
                <div className="problem-statement">
                  <h2>Problem</h2>
                  <p>{problemStatement}</p>
                </div>
                <div className="instructions">
                  <p>{instructions}</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* LEARNER TASK AREA */}
        <section className="learner-task-area" aria-label="Learner task area">
          <div className="task-container">
            {/* Answer input field */}
            <div className="answer-input-container">
              <label htmlFor="answer-input">Your Answer</label>
              <textarea
                id="answer-input"
                className="answer-input"
                value={hasAssessment && submittedAnswer 
                  ? submittedAnswer 
                  : answerValue}
                onChange={(e) => {
                  setAnswerValue(e.target.value);
                  if (uiState === 'idle') {
                    transitionState('interacting');
                  }
                }}
                disabled={isSubmitting || isProcessing || (hasAssessment && assessmentContent?.screenLocked && !canRevise)}
                readOnly={hasAssessment && assessmentContent?.screenLocked && !canRevise}
                placeholder="Type your answer here..."
                rows={4}
                aria-label="Answer input"
                aria-describedby="answer-input-help"
              />
              <div id="answer-input-help" className="input-help">
                {/* TODO: Validation errors */}
              </div>
            </div>

            {/* Action buttons */}
            <div className="action-buttons">
              {/* Submit button */}
              <button
                type="button"
                className="submit-button"
                disabled={!canSubmit}
                onClick={handleSubmit}
                aria-label="Submit answer"
                aria-describedby="submit-button-help"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
              <div id="submit-button-help" className="button-help">
                {!canSubmit && blockingConstraints.length > 0 && (
                  <span className="blocking-reason">
                    Cannot submit: {blockingConstraints.join(', ')}
                  </span>
                )}
              </div>

              {/* Request hint button */}
              <button
                type="button"
                className="hint-button"
                disabled={!canRequestHint}
                aria-label="Request hint"
              >
                Request Hint
              </button>

              {/* Revise answer button (visible when assessment shows screen locked) */}
              {hasAssessment && assessmentContent?.screenLocked && (
                <button
                  type="button"
                  className="revise-button"
                  disabled={!canRevise}
                  onClick={handleRevise}
                  aria-label="Revise answer"
                >
                  Revise Answer
                </button>
              )}

              {/* Next button (visible when assessment allows proceeding) */}
              {hasAssessment && assessmentContent?.canProceed && (
                <button
                  type="button"
                  className="next-button"
                  disabled={!canProceed}
                  aria-label="Proceed to next screen"
                  aria-describedby="next-button-help"
                  onClick={() => {
                    // TODO: Navigate to next screen
                    console.log('Navigate to next screen');
                  }}
                >
                  Next Screen
                </button>
              )}
              {hasAssessment && !assessmentContent?.canProceed && (
                <div id="next-button-help" className="button-help">
                  <span className="blocking-reason">
                    Cannot proceed: {unlockRequirements.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PROGRESS INDICATOR */}
        <section className="progress-indicator" aria-label="Progress indicator">
          <div className="progress-container">
            {/* Screen progress */}
            <div className="screen-progress">
              <div className="progress-header">
                <span className="progress-label">Screen Progress</span>
                <span className="progress-percentage">{screenProgress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${screenProgress}%` }}
                  aria-valuenow={screenProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>

            {/* Session progress */}
            <div className="session-progress">
              <div className="progress-header">
                <span className="progress-label">Session Progress</span>
                <span className="progress-percentage">{sessionProgress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${sessionProgress}%` }}
                  aria-valuenow={sessionProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>

            {/* Progress details */}
            <div className="progress-details">
              {/* Attempts */}
              <div className="progress-item">
                <span className="progress-item-label">Attempts</span>
                <span className="progress-item-value">
                  {currentAttempt} of {maxAttempts}
                </span>
              </div>

              {/* Time spent */}
              <div className="progress-item">
                <span className="progress-item-label">Time</span>
                <span className="progress-item-value">
                  {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Mastery score */}
              {masteryScore !== null && (
                <div className="progress-item">
                  <span className="progress-item-label">Mastery</span>
                  <span className="progress-item-value">
                    {masteryScore}% {masteryScore >= masteryThreshold ? '✓' : `(need ${masteryThreshold}%)`}
                  </span>
                </div>
              )}

              {/* Concepts demonstrated */}
              {conceptsDemonstrated.length > 0 && (
                <div className="progress-item">
                  <span className="progress-item-label">Concepts</span>
                  <span className="progress-item-value">
                    {conceptsDemonstrated.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Unlock status */}
            <div className="unlock-status">
              {nextScreenUnlocked ? (
                <div className="unlock-status-unlocked">
                  <span>✓ Next screen unlocked</span>
                </div>
              ) : (
                <div className="unlock-status-locked">
                  <span>Next screen locked</span>
                  <ul className="unlock-requirements">
                    {unlockRequirements.map((requirement, index) => (
                      <li key={index}>{requirement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SYSTEM CONSTRAINTS AREA */}
        <section className="constraints-area" aria-label="System constraints">
          <div className="constraints-container">
            <h3>Constraints</h3>
            
            {/* Active constraints list */}
            <div className="constraints-list">
              {blockingConstraints.length > 0 ? (
                <ul className="blocking-constraints">
                  {blockingConstraints.map((constraint, index) => (
                    <li key={index} className="constraint-item blocking">
                      <span className="constraint-icon">⚠</span>
                      <span className="constraint-message">{constraint}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-constraints">
                  <span>No active constraints</span>
                </div>
              )}
            </div>

            {/* Constraint details (placeholder) */}
            <div className="constraint-details">
              {/* TODO: Rate limit countdown */}
              {/* TODO: Cooldown timer */}
              {/* TODO: Max attempts remaining */}
            </div>
          </div>
        </section>

        {/* Navigation buttons (back/forward) */}
        <section className="navigation-area" aria-label="Navigation">
          <div className="navigation-buttons">
            <button
              type="button"
              className="back-button"
              disabled={true} // Disabled by default
              aria-label="Go to previous screen"
            >
              ← Back
            </button>
            <button
              type="button"
              className="forward-button"
              disabled={true} // Disabled by default
              aria-label="Go to next screen"
            >
              Forward →
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
