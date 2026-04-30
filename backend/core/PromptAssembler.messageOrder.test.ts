import { PromptAssembler } from './PromptAssembler';
import type { Message, Session, InstructorProfile, LearnerMemory } from './types';

function baseSession(): Session {
  return {
    id: 's1',
    instructorId: 'i1',
    learnerId: 'l1',
    instructorProfileId: 'i1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };
}

function baseProfile(): InstructorProfile {
  return {
    id: 'i1',
    instructorId: 'i1',
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

function baseMemory(): LearnerMemory {
  return {
    learnerId: 'l1',
    learnedConcepts: [],
    misconceptions: [],
    strengths: [],
    weaknesses: [],
    progressMarkers: [],
    sessionSummaries: [],
    lastUpdated: new Date(),
  };
}

function msg(
  id: string,
  role: 'learner' | 'instructor',
  content: string,
  timestamp: Date
): Message {
  return {
    id,
    sessionId: 's1',
    role,
    content,
    messageType: 'question',
    timestamp,
  };
}

describe('PromptAssembler conversation order', () => {
  it('keeps message history in input order when timestamps are non-chronological', async () => {
    const same = new Date('2026-01-01T00:00:00.000Z');
    const earlier = new Date('2025-12-31T00:00:00.000Z');

    // Chronological order would be: second, first, third. Session order must stay first, second, third.
    const messageHistory: Message[] = [
      msg('m1', 'learner', 'FIRST', same),
      msg('m2', 'instructor', 'SECOND', earlier),
      msg('m3', 'learner', 'THIRD', same),
    ];

    const assembler = new PromptAssembler('config/prompts');
    const prompt = await assembler.assemblePrompt({
      session: baseSession(),
      instructorProfile: baseProfile(),
      learnerMemory: baseMemory(),
      messageHistory,
      currentMessage: 'current',
    });

    const firstIdx = prompt.indexOf('Learner: FIRST');
    const secondIdx = prompt.indexOf('Instructor: SECOND');
    const thirdIdx = prompt.indexOf('Learner: THIRD');

    expect(firstIdx).toBeGreaterThan(-1);
    expect(secondIdx).toBeGreaterThan(-1);
    expect(thirdIdx).toBeGreaterThan(-1);
    expect(firstIdx).toBeLessThan(secondIdx);
    expect(secondIdx).toBeLessThan(thirdIdx);
  });
});
