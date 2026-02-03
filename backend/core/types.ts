// Core domain types for ORIGINER platform

export type MessageRole = 'instructor' | 'learner';
export type MessageType = 'question' | 'guidance' | 'correction' | 'explanation' | 'response' | 'clarification';
export type SessionState = 'active' | 'paused' | 'completed' | 'abandoned';
export type GuidanceLevel = 'minimal' | 'moderate' | 'scaffolded' | 'direct';

export interface TeachingMetadata {
  isLeadingQuestion?: boolean;
  revealedInformation?: string[];
  learnerStruggleLevel?: 'none' | 'low' | 'moderate' | 'high';
  correctionNeeded?: boolean;
  conceptIntroduced?: string;
  misconceptionAddressed?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  messageType: MessageType;
  teachingMetadata?: TeachingMetadata;
  timestamp: Date;
}

export interface Session {
  id: string;
  instructorId: string;
  learnerId: string;
  instructorProfileId: string;
  subject: string;
  topic: string;
  learningObjective: string;
  sessionState: SessionState;
  messageIds: string[];
  startedAt: Date;
  lastActivityAt: Date;
  endedAt: Date | null;
}

export interface InstructorProfile {
  id: string;
  instructorId: string;
  name: string;
  teachingPatterns: string[];
  guidanceStyle: string;
  responseStructure: string;
  questionPatterns: string[];
  correctionStyle: string;
  consistencySettings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearnerMemory {
  learnerId: string;
  learnedConcepts: LearnedConcept[];
  misconceptions: Misconception[];
  strengths: string[];
  weaknesses: string[];
  progressMarkers: ProgressMarker[];
  sessionSummaries: SessionSummary[];
  lastUpdated: Date;
}

export interface LearnedConcept {
  concept: string;
  masteryLevel: 'introduced' | 'practicing' | 'mastered';
  firstIntroducedAt: Date;
  lastPracticedAt: Date;
}

export interface Misconception {
  concept: string;
  incorrectUnderstanding: string;
  firstObservedAt: Date;
  correctionAttempts: number;
  resolved: boolean;
}

export interface ProgressMarker {
  marker: string;
  achievedAt: Date;
  sessionId: string;
}

export interface SessionSummary {
  sessionId: string;
  summary: string;
  keyConcepts: string[];
  learnerProgress: string;
  misconceptionsAddressed: string[];
  createdAt: Date;
}
