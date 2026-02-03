/**
 * API Type Definitions
 * 
 * Types for API requests and responses.
 * These should match backend API contracts.
 */

// Base API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  timestamp: string;
  requestId: string;
}

// Session API Types
export interface CreateSessionRequest {
  learnerId?: string;  // Optional for anonymous sessions (MVP)
  instructorProfileId: string;
  subject: string;
  topic: string;
  learningObjective: string;
}

export interface CreateSessionResponse {
  session: {
    id: string;
    learnerId: string;
    instructorProfileId: string;
    subject: string;
    topic: string;
    learningObjective: string;
    sessionState: 'active';
    startedAt: string;
  };
}

export interface GetSessionResponse {
  session: {
    id: string;
    learnerId: string;
    instructorProfileId: string;
    subject: string;
    topic: string;
    learningObjective: string;
    sessionState: 'active' | 'paused' | 'completed' | 'abandoned';
    startedAt: string;
    lastActivityAt: string;
    endedAt: string | null;
  };
}

// Lesson API Types
export interface StartLessonRequest {
  sessionId: string;
  screenId: string;
  screenType: string;
  clientTimestamp?: string;
}

export interface StartLessonResponse {
  lesson: {
    screenId: string;
    sessionId: string;
    screenType: string;
    concept: string;
    learningObjective: string;
    content: {
      problem: string;
      instructions: string;
      hintsAvailable: number;
      maxAttempts: number;
    };
    constraints: {
      minTimeOnScreen: number;
      requiredAttempts: number;
      masteryThreshold: number;
      cooldownBetweenAttempts: number;
      rateLimitPerMinute: number;
    };
    state: 'active';
    startedAt: string;
  };
  progress: {
    attempts: number;
    timeSpent: number;
    canProceed: boolean;
    masteryScore: number | null;
  };
  navigation: {
    canGoBack: boolean;
    canGoForward: boolean;
    nextScreenId: string | null;
    nextScreenUnlocked: boolean;
    unlockRequirements: UnlockRequirement[];
  };
}

export interface SubmitAnswerRequest {
  sessionId: string;
  answer: string;
  attemptNumber?: number;
  timeSpent?: number;
  clientTimestamp?: string;
}

export interface SubmitAnswerResponse {
  feedback: {
    content: string;
    type: 'guidance' | 'correction' | 'encouragement' | 'hint';
  };
  progress: {
    attempts: number;
    masteryScore: number;
    canProceed: boolean;
  };
  constraints: {
    canSubmitAgain: boolean;
    nextSubmissionAllowedAt: string | null;
    remainingAttempts: number;
  };
}

export interface RequestHintRequest {
  sessionId: string;
  hintLevel?: number;
}

export interface RequestHintResponse {
  hint: {
    content: string;
    level: number;
    hintsRemaining: number;
  };
}

export interface CompleteLessonRequest {
  sessionId: string;
}

export interface CompleteLessonResponse {
  completed: boolean;
  screenId: string;
  masteryAchieved: boolean;
  nextScreenUnlocked: boolean;
  nextScreenId: string | null;
}

export interface UnlockRequirement {
  type: 'prerequisite' | 'mastery' | 'time' | 'attempts';
  description: string;
  isMet: boolean;
  currentValue: number | string;
  requiredValue: number | string;
}
