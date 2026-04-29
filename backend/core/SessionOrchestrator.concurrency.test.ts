import { SessionOrchestrator } from './SessionOrchestrator';
import { PromptAssembler } from './PromptAssembler';
import { ResponseValidator } from './ResponseValidator';
import { LLMAdapter } from '../adapters/llm/types';
import { StorageAdapter } from '../adapters/storage/types';
import {
  Session,
  InstructorProfile,
  LearnerMemory,
  Message,
} from './types';
import { DatabaseStorageAdapter } from '../adapters/storage/database';

function minimalProfile(id: string): InstructorProfile {
  const now = new Date();
  return {
    id,
    instructorId: id,
    name: 'Test',
    teachingPatterns: [],
    guidanceStyle: 'friendly',
    responseStructure: 'structured',
    questionPatterns: [],
    correctionStyle: 'gentle',
    consistencySettings: {},
    createdAt: now,
    updatedAt: now,
  };
}

function minimalMemory(learnerId: string): LearnerMemory {
  return {
    learnerId,
    learnedConcepts: [],
    misconceptions: [],
    strengths: [],
    weaknesses: [],
    progressMarkers: [],
    sessionSummaries: [],
    lastUpdated: new Date(),
  };
}

/**
 * In-memory adapter that mirrors DatabaseStorageAdapter behavior for session_messages:
 * updateSession replaces the full message ID list (DELETE + INSERT pattern).
 */
class RaceableStorage implements StorageAdapter {
  sessions = new Map<string, Session>();
  messages = new Map<string, Message>();

  async loadSession(sessionId: string): Promise<Session | null> {
    const s = this.sessions.get(sessionId);
    return s ? { ...s, messageIds: [...s.messageIds] } : null;
  }

  async saveSession(session: Session): Promise<void> {
    this.sessions.set(session.id, { ...session, messageIds: [...session.messageIds] });
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    if (updates.messageIds !== undefined) {
      this.sessions.set(sessionId, {
        ...s,
        ...updates,
        messageIds: [...updates.messageIds],
      });
    } else {
      this.sessions.set(sessionId, { ...s, ...updates });
    }
  }

  async loadMessage(messageId: string): Promise<Message | null> {
    return this.messages.get(messageId) ?? null;
  }

  async loadMessages(messageIds: string[]): Promise<Message[]> {
    return messageIds.map((id) => this.messages.get(id)!);
  }

  async saveMessage(message: Message): Promise<void> {
    this.messages.set(message.id, message);
  }

  async loadInstructorProfile(profileId: string): Promise<InstructorProfile | null> {
    return minimalProfile(profileId);
  }

  async loadLearnerMemory(learnerId: string): Promise<LearnerMemory | null> {
    return minimalMemory(learnerId);
  }

  async saveLearnerMemory(): Promise<void> {}
}

describe('SessionOrchestrator concurrent message handling', () => {
  const sessionId = 'sess_concurrency_test';

  beforeEach(() => {
    jest.spyOn(PromptAssembler.prototype, 'assemblePrompt').mockResolvedValue('prompt');
    jest.spyOn(PromptAssembler.prototype, 'assembleFallbackPrompt').mockResolvedValue('fallback');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('parallel requests do not drop message IDs when storage replaces session_messages wholesale', async () => {
    const storage = new RaceableStorage();
    storage.sessions.set(sessionId, {
      id: sessionId,
      instructorId: 'inst_1',
      learnerId: 'learn_1',
      instructorProfileId: 'inst_1',
      subject: 's',
      topic: 't',
      learningObjective: 'l',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    });

    const llm: LLMAdapter = {
      generate: async () => ({ content: 'reply' }),
      async *generateStream() {
        yield 'x';
      },
    };

    const orchestrator = new SessionOrchestrator(
      new PromptAssembler('config/prompts'),
      new ResponseValidator(),
      llm,
      storage
    );

    await Promise.all([
      orchestrator.processLearnerMessage(sessionId, 'first'),
      orchestrator.processLearnerMessage(sessionId, 'second'),
    ]);

    const session = await storage.loadSession(sessionId);
    expect(session).not.toBeNull();
    expect(session!.messageIds.length).toBe(4);
  });

  test('SQLite adapter retains all messages after concurrent turns', async () => {
    const dbPath = ':memory:';
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: dbPath });

    await storage.createInstructor({ id: 'inst_sql', name: 'I' });
    await storage.createLearner({ id: 'learn_sql', name: 'L' });

    const sess: Session = {
      id: sessionId,
      instructorId: 'inst_sql',
      learnerId: 'learn_sql',
      instructorProfileId: 'inst_sql',
      subject: 's',
      topic: 't',
      learningObjective: 'l',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    };
    await storage.saveSession(sess);

    const llm: LLMAdapter = {
      generate: async () => ({ content: 'reply' }),
      async *generateStream() {
        yield 'x';
      },
    };

    const orchestrator = new SessionOrchestrator(
      new PromptAssembler('config/prompts'),
      new ResponseValidator(),
      llm,
      storage
    );

    await Promise.all([
      orchestrator.processLearnerMessage(sessionId, 'a'),
      orchestrator.processLearnerMessage(sessionId, 'b'),
    ]);

    const loaded = await storage.loadSession(sessionId);
    expect(loaded?.messageIds.length).toBe(4);

    storage.close();
  });
});
