import { SessionOrchestrator } from './SessionOrchestrator';
import { PromptAssembler } from './PromptAssembler';
import { ResponseValidator } from './ResponseValidator';
import type { Session, InstructorProfile, LearnerMemory, Message } from './types';
import type { LLMAdapter } from '../adapters/llm/types';
import type { StorageAdapter } from '../adapters/storage/types';

describe('SessionOrchestrator prompt history', () => {
  it('passes the current learner message in messageHistory to assemblePrompt', async () => {
    const sessionId = 'sess_test';

    const session: Session = {
      id: sessionId,
      instructorId: 'inst_1',
      learnerId: 'learn_1',
      instructorProfileId: 'inst_1',
      subject: 'S',
      topic: 'T',
      learningObjective: 'L',
      sessionState: 'active',
      messageIds: ['msg_prev'],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    };

    const profile: InstructorProfile = {
      id: 'inst_1',
      instructorId: 'inst_1',
      name: 'T',
      teachingPatterns: [],
      guidanceStyle: 'friendly',
      responseStructure: 'structured',
      questionPatterns: [],
      correctionStyle: 'gentle',
      consistencySettings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const memory: LearnerMemory = {
      learnerId: 'learn_1',
      learnedConcepts: [],
      misconceptions: [],
      strengths: [],
      weaknesses: [],
      progressMarkers: [],
      sessionSummaries: [],
      lastUpdated: new Date(),
    };

    const priorFromDb: Message = {
      id: 'msg_prev',
      sessionId,
      role: 'learner',
      content: 'Earlier question',
      messageType: 'question',
      timestamp: new Date('2026-01-01T00:00:00Z'),
    };

    const assemblePrompt = jest
      .spyOn(PromptAssembler.prototype, 'assemblePrompt')
      .mockResolvedValue('assembled');

    const storageAdapter: StorageAdapter = {
      loadSession: jest.fn().mockResolvedValue(session),
      saveSession: jest.fn(),
      updateSession: jest.fn().mockResolvedValue(undefined),
      loadInstructorProfile: jest.fn().mockResolvedValue(profile),
      loadLearnerMemory: jest.fn().mockResolvedValue(memory),
      loadMessage: jest.fn(),
      loadMessages: jest.fn().mockResolvedValue([priorFromDb]),
      saveMessage: jest.fn().mockResolvedValue(undefined),
      saveLearnerMemory: jest.fn().mockResolvedValue(undefined),
    };

    const llmAdapter: LLMAdapter = {
      generate: jest.fn().mockResolvedValue({ content: 'OK', metadata: {} }),
      async *generateStream() {
        yield '';
      },
    };

    jest.spyOn(ResponseValidator.prototype, 'validate').mockReturnValue({
      isValid: true,
      violations: [],
      action: 'ACCEPT',
    });

    const orchestrator = new SessionOrchestrator(
      new PromptAssembler('config/prompts'),
      new ResponseValidator(),
      llmAdapter,
      storageAdapter
    );

    await orchestrator.processLearnerMessage(sessionId, 'Current answer');

    expect(assemblePrompt).toHaveBeenCalledTimes(1);
    const callArg = assemblePrompt.mock.calls[0][0];
    expect(callArg.messageHistory).toHaveLength(2);
    expect(callArg.messageHistory[0]).toEqual(priorFromDb);
    expect(callArg.messageHistory[1].role).toBe('learner');
    expect(callArg.messageHistory[1].content).toBe('Current answer');

    assemblePrompt.mockRestore();
  });
});
