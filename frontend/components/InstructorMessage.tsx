/**
 * Instructor Message Component
 * 
 * Displays structured instructor output in the UI.
 * 
 * This component consumes InstructorOutput and renders it appropriately
 * based on the response type.
 */

'use client';

import { InstructorOutput, InstructorResponseType } from '../types/instructor';

interface InstructorMessageProps {
  output: InstructorOutput;
}

export default function InstructorMessage({ output }: InstructorMessageProps) {
  const { type, content, metadata, nextActions } = output;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      padding: '1.5rem',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      border: '1px solid #e0e0e0'
    }}>
      {/* Response Type Indicator */}
      <div style={{
        fontSize: '0.875rem',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontWeight: '500'
      }}>
        {getResponseTypeLabel(type)}
      </div>

      {/* Content based on type */}
      {renderContent(type, content)}

      {/* Next Actions */}
      {nextActions.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e0e0e0'
        }}>
          <div style={{
            fontSize: '0.875rem',
            color: '#666',
            fontWeight: '500',
            marginBottom: '0.5rem'
          }}>
            Next Steps:
          </div>
          {nextActions.map((action, index) => (
            <div key={index} style={{
              fontSize: '0.875rem',
              color: action.enabled ? '#333' : '#999',
              fontStyle: action.enabled ? 'normal' : 'italic'
            }}>
              {action.enabled ? '✓' : '○'} {action.label}
              {action.reason && !action.enabled && (
                <span style={{ marginLeft: '0.5rem', color: '#999' }}>
                  ({action.reason})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Metadata (debug info, can be hidden in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          fontSize: '0.75rem',
          color: '#999',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e0e0e0'
        }}>
          Response ID: {metadata.responseId} | {metadata.timestamp.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

/**
 * Render content based on response type
 */
function renderContent(type: InstructorResponseType, content: any) {
  switch (type) {
    case 'problem_presentation':
      return (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
            Problem
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', lineHeight: '1.6' }}>
            {content.problem}
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Instructions:</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
              {content.instructions}
            </p>
          </div>
          {content.examples && content.examples.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Examples:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                {content.examples.map((example: string, index: number) => (
                  <li key={index} style={{ marginBottom: '0.25rem' }}>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.keyConcepts && content.keyConcepts.length > 0 && (
            <div>
              <strong>Key Concepts:</strong>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {content.keyConcepts.map((concept: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case 'feedback':
      return (
        <div>
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: getAssessmentColor(content.assessment),
            borderRadius: '4px',
            fontWeight: '500'
          }}>
            Assessment: {content.assessment.replace('_', ' ').toUpperCase()}
          </div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', lineHeight: '1.6' }}>
            {content.feedbackText}
          </p>
          {content.strengths && content.strengths.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Strengths:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                {content.strengths.map((strength: string, index: number) => (
                  <li key={index} style={{ color: '#2e7d32' }}>
                    ✓ {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.suggestions && content.suggestions.length > 0 && (
            <div>
              <strong>Suggestions:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                {content.suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    case 'hint':
      return (
        <div>
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
            border: '1px solid #ffc107'
          }}>
            <strong>Hint {content.hintLevel}:</strong>
          </div>
          <p style={{ margin: '0', fontSize: '1rem', lineHeight: '1.6' }}>
            {content.hintText}
          </p>
          {content.revealsAnswer && (
            <div style={{
              marginTop: '1rem',
              padding: '0.5rem',
              backgroundColor: '#f8d7da',
              borderRadius: '4px',
              fontSize: '0.875rem',
              color: '#721c24'
            }}>
              ⚠ This hint reveals the answer
            </div>
          )}
        </div>
      );

    case 'answer':
      return (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
            Answer
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', lineHeight: '1.6' }}>
            {content.answerText}
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Explanation:</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem' }}>
              {content.explanation}
            </p>
          </div>
          {content.examples && content.examples.length > 0 && (
            <div>
              <strong>Examples:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                {content.examples.map((example: string, index: number) => (
                  <li key={index}>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    case 'guidance':
      return (
        <div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', lineHeight: '1.6' }}>
            {content.guidanceText}
          </p>
          {content.steps && content.steps.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Steps:</strong>
              <ol style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                {content.steps.map((step: string, index: number) => (
                  <li key={index} style={{ marginBottom: '0.25rem' }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {content.warnings && content.warnings.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#fff3cd',
              borderRadius: '4px'
            }}>
              <strong>Warnings:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                {content.warnings.map((warning: string, index: number) => (
                  <li key={index}>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    case 'encouragement':
      return (
        <div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', lineHeight: '1.6', fontWeight: '500' }}>
            {content.message}
          </p>
          {content.achievements && content.achievements.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Achievements:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                {content.achievements.map((achievement: string, index: number) => (
                  <li key={index} style={{ color: '#2e7d32' }}>
                    ✓ {achievement}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.nextMilestone && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#e3f2fd',
              borderRadius: '4px'
            }}>
              <strong>Next Milestone:</strong> {content.nextMilestone}
            </div>
          )}
        </div>
      );

    case 'explanation':
      return (
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
            {content.concept}
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', lineHeight: '1.6' }}>
            {content.explanation}
          </p>
          {content.examples && content.examples.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <strong>Examples:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                {content.examples.map((example: string, index: number) => (
                  <li key={index}>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {content.relatedConcepts && content.relatedConcepts.length > 0 && (
            <div>
              <strong>Related Concepts:</strong>
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {content.relatedConcepts.map((concept: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '4px',
                      fontSize: '0.875rem'
                    }}
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    default:
      return (
        <div>
          <p>Unknown response type: {type}</p>
        </div>
      );
  }
}

/**
 * Get human-readable label for response type
 */
function getResponseTypeLabel(type: InstructorResponseType): string {
  const labels: Record<InstructorResponseType, string> = {
    problem_presentation: 'Problem Presentation',
    feedback: 'Feedback',
    hint: 'Hint',
    answer: 'Answer',
    guidance: 'Guidance',
    encouragement: 'Encouragement',
    explanation: 'Explanation',
  };
  return labels[type] || type;
}

/**
 * Get color for assessment type
 */
function getAssessmentColor(assessment: string): string {
  switch (assessment) {
    case 'correct':
      return '#d4edda';
    case 'partially_correct':
      return '#fff3cd';
    case 'incorrect':
      return '#f8d7da';
    case 'needs_clarification':
      return '#d1ecf1';
    default:
      return '#f9f9f9';
  }
}
