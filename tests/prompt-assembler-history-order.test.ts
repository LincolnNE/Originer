import { PromptAssembler } from '../backend/core/PromptAssembler';
import type { InstructorProfile, LearnerMemory, Message, Session } from '../backend/core/types';

function minimalSession(overrides: Partial<Session> = {}): Session {
  const base: Session = {
    id: 'sess_1',
    instructorId: 'inst_1',
    learnerId: 'learner_1',
    instructorProfileId: 'inst_1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };
  return { ...base, ...overrides };
}

function minimalInstructor(): InstructorProfile {
  return {
    id: 'inst_1',
    instructorId: 'inst_1',
    name: 'Test',
    teachingPatterns: [],
    guidanceStyle: 'friendly',
    responseStructure: 'structured',
    questionPatterns: [],
    correctionStyle: 'gentle',
    consistencySettings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function minimalLearnerMemory(): LearnerMemory {
  return {
    learnerId: 'learner_1',
    learnedConcepts: [],
    misconceptions: [],
    strengths: [],
    weaknesses: [],
    progressMarkers: [],
    sessionSummaries: [],
    lastUpdated: new Date(),
  };
}

describe('PromptAssembler conversation history order', () => {
  it('keeps messageHistory in input order, not sorted by timestamp', async () => {
    const assembler = new PromptAssembler('config/prompts');

    const older = new Date('2020-01-01T00:00:00.000Z');
    const newer = new Date('2024-01-01T00:00:00.000Z');

    const firstSpoken: Message = {
      id: 'm1',
      sessionId: 'sess_1',
      role: 'learner',
      content: 'FIRST_LINE',
      messageType: 'question',
      timestamp: newer,
    };
    const secondSpoken: Message = {
      id: 'm2',
      sessionId: 'sess_1',
      role: 'instructor',
      content: 'SECOND_LINE',
      messageType: 'guidance',
      timestamp: older,
    };

    const prompt = await assembler.assemblePrompt({
      session: minimalSession(),
      instructorProfile: minimalInstructor(),
      learnerMemory: minimalLearnerMemory(),
      messageHistory: [firstSpoken, secondSpoken],
      currentMessage: 'latest',
    });

    const firstIdx = prompt.indexOf('Learner: FIRST_LINE');
    const secondIdx = prompt.indexOf('Instructor: SECOND_LINE');
    expect(firstIdx).toBeGreaterThan(-1);
    expect(secondIdx).toBeGreaterThan(-1);
    expect(firstIdx).toBeLessThan(secondIdx);
  });
});
