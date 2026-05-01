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
  /**
   * Atomically append a message to the session transcript order and bump last_activity_at.
   * Use this instead of read-modify-write on messageIds to avoid lost updates under concurrency.
   */
  appendSessionMessage(sessionId: string, messageId: string): Promise<void>;

  // Message operations
  loadMessage(messageId: string): Promise<Message | null>;
  loadMessages(messageIds: string[]): Promise<Message[]>;
  saveMessage(message: Message): Promise<void>;

  // Instructor profile operations
  loadInstructorProfile(profileId: string): Promise<InstructorProfile | null>;

  // Learner memory operations
  loadLearnerMemory(learnerId: string): Promise<LearnerMemory | null>;
  saveLearnerMemory(memory: LearnerMemory): Promise<void>;
}
