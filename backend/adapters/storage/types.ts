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
   * Atomically insert a message row and append it to the session's ordered message list.
   * Prefer this over saveMessage + updateSession(messageIds) so a crash cannot leave
   * a message persisted without session_messages linkage.
   */
  appendSessionMessage(
    message: Message,
    sessionUpdates?: { lastActivityAt?: Date }
  ): Promise<void>;

  // Instructor profile operations
  loadInstructorProfile(profileId: string): Promise<InstructorProfile | null>;

  // Learner memory operations
  loadLearnerMemory(learnerId: string): Promise<LearnerMemory | null>;
  saveLearnerMemory(memory: LearnerMemory): Promise<void>;
}
