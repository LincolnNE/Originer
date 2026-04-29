/**
 * Regression: conversation history in prompts must follow session message order,
 * not timestamp order. Out-of-order timestamps must not swap learner/instructor turns.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PromptAssembler } from '../dist/backend/core/PromptAssembler.js';

test('formatMessageHistory preserves array order when timestamps are inconsistent', async () => {
  const assembler = new PromptAssembler('config/prompts');
  const sessionId = 'sess_prompt_order';
  const baseTime = new Date('2026-01-01T12:00:00.000Z');

  const instructorProfile = {
    id: 'inst_1',
    instructorId: 'inst_1',
    name: 'Test',
    teachingPatterns: [],
    guidanceStyle: 'friendly',
    responseStructure: 'structured',
    questionPatterns: [],
    correctionStyle: 'gentle',
    consistencySettings: {},
    createdAt: baseTime,
    updatedAt: baseTime,
  };

  const learnerMemory = {
    learnerId: 'learn_1',
    learnedConcepts: [],
    misconceptions: [],
    strengths: [],
    weaknesses: [],
    progressMarkers: [],
    sessionSummaries: [],
    lastUpdated: baseTime,
  };

  const session = {
    id: sessionId,
    instructorId: 'inst_1',
    learnerId: 'learn_1',
    instructorProfileId: 'inst_1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: ['m1', 'm2'],
    startedAt: baseTime,
    lastActivityAt: baseTime,
    endedAt: null,
  };

  // Learner turn first in session order, but learner timestamp is *later* than instructor.
  // Timestamp-only sorting would incorrectly put the instructor message first.
  const messageHistory = [
    {
      id: 'm1',
      sessionId,
      role: 'learner',
      content: 'Learner line',
      messageType: 'question',
      timestamp: new Date('2026-01-02T12:00:00.000Z'),
    },
    {
      id: 'm2',
      sessionId,
      role: 'instructor',
      content: 'Instructor line',
      messageType: 'guidance',
      timestamp: new Date('2026-01-01T12:00:00.000Z'),
    },
  ];

  const prompt = await assembler.assemblePrompt({
    session,
    instructorProfile,
    learnerMemory,
    messageHistory,
    currentMessage: 'New question',
  });

  const historyIdx = prompt.indexOf('[CONVERSATION HISTORY]');
  assert.ok(historyIdx >= 0, 'expected conversation history section');
  const learnerIdx = prompt.indexOf('Learner: Learner line', historyIdx);
  const instructorIdx = prompt.indexOf('Instructor: Instructor line', historyIdx);
  assert.ok(learnerIdx >= 0 && instructorIdx >= 0, 'expected both turns in prompt');
  assert.ok(
    learnerIdx < instructorIdx,
    'session order must be learner then instructor even when timestamps disagree'
  );
});
