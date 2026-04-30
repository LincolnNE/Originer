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
  /**
   * Insert message row and append session_messages index in one transaction,
   * optionally updating session row fields (last_activity_at, etc.).
   */
  appendMessage(
    sessionId: string,
    message: Message,
    sessionRowUpdates?: Partial<Pick<Session, 'lastActivityAt' | 'sessionState' | 'endedAt'>>
  ): Promise<void>;

  // Instructor profile operations
  loadInstructorProfile(profileId: string): Promise<InstructorProfile | null>;

  // Learner memory operations
  loadLearnerMemory(learnerId: string): Promise<LearnerMemory | null>;
  saveLearnerMemory(memory: LearnerMemory): Promise<void>;
}
