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
   * Atomically persist new message rows and replace session_messages order.
   * Use this instead of saveMessage + updateSession({ messageIds }) to avoid
   * orphan rows when the second step fails.
   */
  saveMessagesAndSetMessageIds(
    sessionId: string,
    messages: Message[],
    orderedMessageIds: string[],
    sessionUpdates?: Partial<Pick<Session, 'sessionState' | 'lastActivityAt' | 'endedAt'>>
  ): Promise<void>;

  // Instructor profile operations
  loadInstructorProfile(profileId: string): Promise<InstructorProfile | null>;

  // Learner memory operations
  loadLearnerMemory(learnerId: string): Promise<LearnerMemory | null>;
  saveLearnerMemory(memory: LearnerMemory): Promise<void>;
}
