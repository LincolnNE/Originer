// Storage Adapter interface - storage-agnostic abstraction

import {
  Session,
  Message,
  InstructorProfile,
  LearnerMemory,
} from '../../core/types';

export interface StorageAdapter {
  // Session operations
  loadSession(sessionId: string): Promise<Session | null>;
  saveSession(session: Session): Promise<void>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<void>;

  // Message operations
  loadMessage(messageId: string): Promise<Message | null>;
  loadMessages(messageIds: string[]): Promise<Message[]>;
  saveMessage(message: Message): Promise<void>;

  // Instructor profile operations
  loadInstructorProfile(profileId: string): Promise<InstructorProfile | null>;

  // Learner memory operations
  loadLearnerMemory(learnerId: string): Promise<LearnerMemory | null>;
  saveLearnerMemory(memory: LearnerMemory): Promise<void>;

  /** Idempotent: create row only if missing (for FK-safe session start). */
  ensureInstructorExists(data: {
    id: string;
    name: string;
    bio?: string;
    tone?: string;
  }): Promise<void>;

  /** Idempotent: create row only if missing (for FK-safe session start). */
  ensureLearnerExists(data: {
    id: string;
    name: string;
    level?: string;
  }): Promise<void>;
}
