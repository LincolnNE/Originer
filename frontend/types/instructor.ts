/**
 * Instructor AI Contract Types
 * 
 * Strict input/output contracts for Instructor AI interactions.
 * 
 * Rules:
 * - AI responses must be structured (no free text)
 * - Frontend must never assemble prompts directly
 * - All AI communication goes through InstructorGateway
 */

/**
 * Instructor Input Contract
 * 
 * Structured input that frontend sends to InstructorGateway.
 * Frontend never constructs prompts - only provides structured data.
 */
export interface InstructorInput {
  // Session context
  sessionId: string;
  screenId: string;
  
  // Learner action
  action: InstructorAction;
  
  // Action-specific data
  actionData: InstructorActionData;
  
  // Context (optional, for additional context)
  context?: InstructorContext;
}

/**
 * Instructor Action Types
 * 
 * Explicit actions that trigger instructor responses.
 */
export type InstructorAction =
  | 'present_problem'      // Present initial problem/instruction
  | 'provide_feedback'    // Provide feedback on submitted answer
  | 'give_hint'           // Provide hint when requested
  | 'answer_question'     // Answer learner's question
  | 'provide_guidance'    // Provide general guidance
  | 'encourage'            // Provide encouragement
  | 'explain_concept';     // Explain a concept

/**
 * Action-Specific Data
 * 
 * Data required for each action type.
 */
export type InstructorActionData =
  | PresentProblemData
  | ProvideFeedbackData
  | GiveHintData
  | AnswerQuestionData
  | ProvideGuidanceData
  | EncourageData
  | ExplainConceptData;

export interface PresentProblemData {
  problem: string;
  instructions: string;
  concept: string;
  learningObjective: string;
}

export interface ProvideFeedbackData {
  learnerAnswer: string;
  attemptNumber: number;
  previousAttempts?: string[];
  timeSpent: number;
}

export interface GiveHintData {
  hintLevel: number;
  previousHints?: string[];
  currentAnswer?: string;
}

export interface AnswerQuestionData {
  question: string;
  context?: string; // Additional context about what learner is asking
}

export interface ProvideGuidanceData {
  guidanceType: 'approach' | 'method' | 'strategy';
  currentState: string; // What learner is currently doing
}

export interface EncourageData {
  progress: number; // 0-100
  achievements: string[];
}

export interface ExplainConceptData {
  concept: string;
  depth: 'basic' | 'intermediate' | 'advanced';
  context?: string;
}

/**
 * Instructor Context
 * 
 * Optional context that can be provided with any action.
 */
export interface InstructorContext {
  sessionProgress?: {
    screensCompleted: number;
    totalScreens: number;
    conceptsMastered: string[];
  };
  screenProgress?: {
    attempts: number;
    timeSpent: number;
    masteryScore: number | null;
  };
  learnerProfile?: {
    strengths: string[];
    weaknesses: string[];
    learningStyle?: string;
  };
}

/**
 * Instructor Output Contract
 * 
 * Structured output that InstructorGateway returns.
 * All responses are structured - no free text.
 */
export interface InstructorOutput {
  // Response type
  type: InstructorResponseType;
  
  // Structured content
  content: InstructorContent;
  
  // Metadata
  metadata: InstructorMetadata;
  
  // Next actions (what learner can do next)
  nextActions: InstructorNextAction[];
}

/**
 * Instructor Response Types
 */
export type InstructorResponseType =
  | 'problem_presentation'  // Presenting a problem
  | 'feedback'              // Feedback on answer
  | 'assessment'           // Assessment result (determines screen lock/advance)
  | 'hint'                  // Hint provided
  | 'answer'                // Answer to question
  | 'guidance'              // General guidance
  | 'encouragement'         // Encouragement message
  | 'explanation';          // Concept explanation

/**
 * Instructor Content
 * 
 * Structured content based on response type.
 */
export type InstructorContent =
  | ProblemPresentationContent
  | FeedbackContent
  | AssessmentContent
  | HintContent
  | AnswerContent
  | GuidanceContent
  | EncouragementContent
  | ExplanationContent;

export interface ProblemPresentationContent {
  problem: string;
  instructions: string;
  examples?: string[];
  keyConcepts: string[];
  expectedApproach?: string;
}

export interface FeedbackContent {
  assessment: 'correct' | 'partially_correct' | 'incorrect' | 'needs_clarification';
  feedbackText: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  nextSteps: string[];
}

export interface AssessmentContent {
  assessment: 'correct' | 'partially_correct' | 'incorrect' | 'needs_clarification';
  feedbackText: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  canProceed: boolean;  // Whether learner can proceed to next screen
  screenLocked: boolean; // Whether current screen is locked
  lockReason?: string;  // Reason for locking (if applicable)
  masteryScore?: number; // Mastery score (0-100)
  masteryThreshold: number; // Required mastery threshold
}

export interface HintContent {
  hintText: string;
  hintLevel: number;
  revealsAnswer: boolean; // Whether this hint reveals the answer
  followUpHints?: string[]; // Available follow-up hints
}

export interface AnswerContent {
  answerText: string;
  explanation: string;
  relatedConcepts: string[];
  examples?: string[];
}

export interface GuidanceContent {
  guidanceText: string;
  approach: string;
  steps?: string[];
  warnings?: string[];
}

export interface EncouragementContent {
  message: string;
  achievements: string[];
  progress: number; // 0-100
  nextMilestone?: string;
}

export interface ExplanationContent {
  explanation: string;
  concept: string;
  depth: 'basic' | 'intermediate' | 'advanced';
  examples: string[];
  relatedConcepts: string[];
}

/**
 * Instructor Metadata
 * 
 * Metadata about the response.
 */
export interface InstructorMetadata {
  responseId: string;
  timestamp: Date;
  instructorProfileId: string;
  sessionId: string;
  screenId: string;
  action: InstructorAction;
  isStreaming: boolean; // Whether response is streaming
  isComplete: boolean;  // Whether response is complete
}

/**
 * Instructor Next Actions
 * 
 * What actions the learner can take next.
 */
export interface InstructorNextAction {
  action: string; // e.g., 'submit_answer', 'request_hint', 'ask_question'
  label: string;  // Human-readable label
  enabled: boolean;
  reason?: string; // Why disabled (if applicable)
}

/**
 * Instructor Error
 * 
 * Error response from InstructorGateway.
 */
export interface InstructorError {
  code: InstructorErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export type InstructorErrorCode =
  | 'INVALID_INPUT'
  | 'GATEWAY_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'SESSION_INVALID'
  | 'SCREEN_INVALID'
  | 'UNKNOWN_ERROR';
