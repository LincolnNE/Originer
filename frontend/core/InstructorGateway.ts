/**
 * Instructor Gateway
 * 
 * Single entry point for all Instructor AI interactions.
 * 
 * Rules:
 * - Frontend NEVER assembles prompts directly
 * - All AI communication goes through this gateway
 * - Responses are always structured (InstructorOutput)
 * - Mock implementation until backend integration
 */

import {
  InstructorInput,
  InstructorOutput,
  InstructorError,
  InstructorAction,
  InstructorResponseType,
} from '../types/instructor';

/**
 * Instructor Gateway Class
 * 
 * Singleton gateway for instructor AI interactions.
 */
class InstructorGateway {
  private static instance: InstructorGateway;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): InstructorGateway {
    if (!InstructorGateway.instance) {
      InstructorGateway.instance = new InstructorGateway();
    }
    return InstructorGateway.instance;
  }

  /**
   * Process Instructor Input
   * 
   * Main entry point for instructor interactions.
   * Takes structured input and returns structured output.
   * 
   * @param input Structured instructor input
   * @returns Structured instructor output
   */
  async processInput(input: InstructorInput): Promise<InstructorOutput> {
    try {
      // Validate input
      this.validateInput(input);

      // Mock implementation - returns structured mock response
      // In production, this would:
      // 1. Send structured input to backend API
      // 2. Backend assembles prompt (frontend never sees prompts)
      // 3. Backend calls LLM
      // 4. Backend validates and structures response
      // 5. Return structured InstructorOutput

      return this.generateMockOutput(input);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate Input
   * 
   * Ensures input conforms to contract.
   */
  private validateInput(input: InstructorInput): void {
    if (!input.sessionId) {
      throw new Error('sessionId is required');
    }
    if (!input.screenId) {
      throw new Error('screenId is required');
    }
    if (!input.action) {
      throw new Error('action is required');
    }
    if (!input.actionData) {
      throw new Error('actionData is required');
    }
  }

  /**
   * Generate Mock Output
   * 
   * Creates structured mock response based on input action.
   * This is temporary until backend integration.
   */
  private generateMockOutput(input: InstructorInput): InstructorOutput {
    const responseId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    switch (input.action) {
      case 'present_problem':
        return this.generateMockProblemPresentation(input, responseId, timestamp);
      
      case 'provide_feedback':
        return this.generateMockFeedback(input, responseId, timestamp);
      
      case 'give_hint':
        return this.generateMockHint(input, responseId, timestamp);
      
      case 'answer_question':
        return this.generateMockAnswer(input, responseId, timestamp);
      
      case 'provide_guidance':
        return this.generateMockGuidance(input, responseId, timestamp);
      
      case 'encourage':
        return this.generateMockEncouragement(input, responseId, timestamp);
      
      case 'explain_concept':
        return this.generateMockExplanation(input, responseId, timestamp);
      
      default:
        throw new Error(`Unknown action: ${input.action}`);
    }
  }

  /**
   * Generate Mock Problem Presentation
   */
  private generateMockProblemPresentation(
    input: InstructorInput,
    responseId: string,
    timestamp: Date
  ): InstructorOutput {
    const data = input.actionData as any; // Type assertion for mock

    return {
      type: 'problem_presentation',
      content: {
        problem: data.problem || 'Solve for x: 2x + 5 = 15',
        instructions: data.instructions || 'Type your answer in the box below.',
        examples: ['Example: If 3x = 9, then x = 3'],
        keyConcepts: ['linear equations', 'solving for x', 'algebraic manipulation'],
        expectedApproach: 'Isolate x by subtracting 5 from both sides, then dividing by 2',
      },
      metadata: {
        responseId,
        timestamp,
        instructorProfileId: 'default',
        sessionId: input.sessionId,
        screenId: input.screenId,
        action: input.action,
        isStreaming: false,
        isComplete: true,
      },
      nextActions: [
        { action: 'submit_answer', label: 'Submit Answer', enabled: true },
        { action: 'request_hint', label: 'Request Hint', enabled: true },
        { action: 'ask_question', label: 'Ask Question', enabled: true },
      ],
    };
  }

  /**
   * Generate Mock Feedback
   */
  private generateMockFeedback(
    input: InstructorInput,
    responseId: string,
    timestamp: Date
  ): InstructorOutput {
    const data = input.actionData as any;
    const answer = data.learnerAnswer || '';
    const isCorrect = answer.toLowerCase().includes('5') || answer === '5';

    return {
      type: 'feedback',
      content: {
        assessment: isCorrect ? 'correct' : 'incorrect',
        feedbackText: isCorrect
          ? 'Great job! You correctly solved the equation. You isolated x by subtracting 5 from both sides and then dividing by 2.'
          : 'Not quite right. Try isolating x step by step. First, subtract 5 from both sides of the equation.',
        strengths: isCorrect ? ['Correct algebraic manipulation', 'Proper isolation of variable'] : [],
        weaknesses: isCorrect ? [] : ['Need to isolate x correctly'],
        suggestions: isCorrect
          ? []
          : ['Start by subtracting 5 from both sides', 'Then divide both sides by 2'],
        nextSteps: isCorrect
          ? ['You can proceed to the next problem']
          : ['Try revising your answer', 'Consider the steps: subtract 5, then divide by 2'],
      },
      metadata: {
        responseId,
        timestamp,
        instructorProfileId: 'default',
        sessionId: input.sessionId,
        screenId: input.screenId,
        action: input.action,
        isStreaming: false,
        isComplete: true,
      },
      nextActions: [
        { action: 'revise_answer', label: 'Revise Answer', enabled: !isCorrect },
        { action: 'proceed', label: 'Proceed', enabled: isCorrect },
        { action: 'request_hint', label: 'Request Hint', enabled: true },
      ],
    };
  }

  /**
   * Generate Mock Hint
   */
  private generateMockHint(
    input: InstructorInput,
    responseId: string,
    timestamp: Date
  ): InstructorOutput {
    const data = input.actionData as any;
    const level = data.hintLevel || 1;

    const hints = [
      'Try isolating x by performing the same operation on both sides of the equation.',
      'Start by subtracting 5 from both sides: 2x + 5 - 5 = 15 - 5',
      'After subtracting, you get 2x = 10. Now divide both sides by 2.',
    ];

    return {
      type: 'hint',
      content: {
        hintText: hints[level - 1] || hints[0],
        hintLevel: level,
        revealsAnswer: level >= 3,
        followUpHints: level < 3 ? [`Hint ${level + 1} available`] : undefined,
      },
      metadata: {
        responseId,
        timestamp,
        instructorProfileId: 'default',
        sessionId: input.sessionId,
        screenId: input.screenId,
        action: input.action,
        isStreaming: false,
        isComplete: true,
      },
      nextActions: [
        { action: 'submit_answer', label: 'Submit Answer', enabled: true },
        { action: 'request_hint', label: 'Request Another Hint', enabled: level < 3 },
      ],
    };
  }

  /**
   * Generate Mock Answer
   */
  private generateMockAnswer(
    input: InstructorInput,
    responseId: string,
    timestamp: Date
  ): InstructorOutput {
    const data = input.actionData as any;

    return {
      type: 'answer',
      content: {
        answerText: 'To solve 2x + 5 = 15, subtract 5 from both sides to get 2x = 10, then divide by 2 to get x = 5.',
        explanation: 'This is a linear equation. The goal is to isolate x by performing inverse operations.',
        relatedConcepts: ['linear equations', 'algebraic manipulation', 'solving for variables'],
        examples: ['3x + 2 = 11 → x = 3', '5x - 7 = 13 → x = 4'],
      },
      metadata: {
        responseId,
        timestamp,
        instructorProfileId: 'default',
        sessionId: input.sessionId,
        screenId: input.screenId,
        action: input.action,
        isStreaming: false,
        isComplete: true,
      },
      nextActions: [
        { action: 'submit_answer', label: 'Submit Answer', enabled: true },
        { action: 'ask_question', label: 'Ask Another Question', enabled: true },
      ],
    };
  }

  /**
   * Generate Mock Guidance
   */
  private generateMockGuidance(
    input: InstructorInput,
    responseId: string,
    timestamp: Date
  ): InstructorOutput {
    return {
      type: 'guidance',
      content: {
        guidanceText: 'When solving linear equations, always perform the same operation on both sides to maintain equality.',
        approach: 'Isolate the variable step by step',
        steps: [
          'Identify the operations affecting the variable',
          'Perform inverse operations on both sides',
          'Simplify after each step',
          'Check your answer by substituting back',
        ],
        warnings: ['Remember to perform operations on both sides', 'Be careful with signs'],
      },
      metadata: {
        responseId,
        timestamp,
        instructorProfileId: 'default',
        sessionId: input.sessionId,
        screenId: input.screenId,
        action: input.action,
        isStreaming: false,
        isComplete: true,
      },
      nextActions: [
        { action: 'submit_answer', label: 'Submit Answer', enabled: true },
        { action: 'request_hint', label: 'Request Hint', enabled: true },
      ],
    };
  }

  /**
   * Generate Mock Encouragement
   */
  private generateMockEncouragement(
    input: InstructorInput,
    responseId: string,
    timestamp: Date
  ): InstructorOutput {
    const data = input.actionData as any;

    return {
      type: 'encouragement',
      content: {
        message: 'You\'re making great progress! Keep up the good work.',
        achievements: data.achievements || ['Completed first problem', 'Understood key concepts'],
        progress: data.progress || 50,
        nextMilestone: 'Master linear equations',
      },
      metadata: {
        responseId,
        timestamp,
        instructorProfileId: 'default',
        sessionId: input.sessionId,
        screenId: input.screenId,
        action: input.action,
        isStreaming: false,
        isComplete: true,
      },
      nextActions: [
        { action: 'continue', label: 'Continue', enabled: true },
      ],
    };
  }

  /**
   * Generate Mock Explanation
   */
  private generateMockExplanation(
    input: InstructorInput,
    responseId: string,
    timestamp: Date
  ): InstructorOutput {
    const data = input.actionData as any;

    return {
      type: 'explanation',
      content: {
        explanation: 'Linear equations are equations where the highest power of the variable is 1. They can be solved using inverse operations.',
        concept: data.concept || 'linear equations',
        depth: data.depth || 'basic',
        examples: [
          '2x + 5 = 15',
          '3y - 7 = 8',
          '4z + 2 = 10',
        ],
        relatedConcepts: ['algebra', 'equations', 'variables'],
      },
      metadata: {
        responseId,
        timestamp,
        instructorProfileId: 'default',
        sessionId: input.sessionId,
        screenId: input.screenId,
        action: input.action,
        isStreaming: false,
        isComplete: true,
      },
      nextActions: [
        { action: 'continue', label: 'Continue', enabled: true },
        { action: 'ask_question', label: 'Ask Question', enabled: true },
      ],
    };
  }

  /**
   * Handle Error
   * 
   * Converts errors to InstructorError format.
   */
  private handleError(error: unknown): InstructorError {
    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      retryable: false,
    };
  }
}

// Export singleton instance
export const instructorGateway = InstructorGateway.getInstance();
