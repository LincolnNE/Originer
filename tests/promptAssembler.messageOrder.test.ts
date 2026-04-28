/**
 * Ensures formatMessageHistory does not re-sort by timestamp, so prompt text
 * matches session turn order (same contract as loadMessages + messageIds).
 */

import assert from 'assert';
import { PromptAssembler } from '../backend/core/PromptAssembler';
import type { Message, Session } from '../backend/core/types';
import type { InstructorProfile, LearnerMemory } from '../backend/core/types';

const minimalSession: Session = {
  id: 's',
  instructorId: 'i',
  learnerId: 'l',
  instructorProfileId: 'i',
  subject: '',
  topic: '',
  learningObjective: '',
  sessionState: 'active',
  messageIds: [],
  startedAt: new Date(),
  lastActivityAt: new Date(),
  endedAt: null,
};

const now = new Date('2026-01-01T00:00:00.000Z');
const minimalProfile: InstructorProfile = {
  id: 'i',
  instructorId: 'i',
  name: 'T',
  teachingPatterns: [],
  guidanceStyle: 'g',
  responseStructure: 'r',
  questionPatterns: [],
  correctionStyle: 'c',
  consistencySettings: {},
  createdAt: now,
  updatedAt: now,
};

const minimalMemory: LearnerMemory = {
  learnerId: 'l',
  learnedConcepts: [],
  misconceptions: [],
  strengths: [],
  weaknesses: [],
  progressMarkers: [],
  sessionSummaries: [],
  lastUpdated: now,
};

async function run() {
  const asm = new PromptAssembler('config/prompts');
  const format = (asm as unknown as { formatMessageHistory(msgs: Message[]): string })
    .formatMessageHistory.bind(asm);

  const mFirst: Message = {
    id: '1',
    sessionId: 's',
    role: 'learner',
    content: 'first',
    messageType: 'question',
    timestamp: new Date('2026-01-01T00:00:01.000Z'),
  };
  const mSecond: Message = {
    id: '2',
    sessionId: 's',
    role: 'instructor',
    content: 'second',
    messageType: 'guidance',
    // Earlier than mFirst: old bug reordered so instructor appeared first in history.
    timestamp: new Date('2026-01-01T00:00:00.500Z'),
  };

  const out = format([mFirst, mSecond]);
  const firstIdx = out.indexOf('Learner: first');
  const secondIdx = out.indexOf('Instructor: second');
  assert.ok(firstIdx >= 0 && secondIdx >= 0, 'expected both lines');
  assert.ok(firstIdx < secondIdx, 'turn order in prompt must follow message array order');

  // Full assemble path: still lists learner before instructor when files may be missing
  // (warn paths) — we only assert conversation block structure.
  const full = await asm.assemblePrompt({
    session: minimalSession,
    instructorProfile: minimalProfile,
    learnerMemory: minimalMemory,
    messageHistory: [mFirst, mSecond],
    currentMessage: 'new',
  });
  const l1 = full.indexOf('Learner: first');
  const l2 = full.indexOf('Instructor: second');
  assert.ok(l1 >= 0 && l2 >= 0, 'assemblePrompt should include history in order');
  assert.ok(l1 < l2, 'assemblePrompt must not reorder history by timestamp');

  console.log('promptAssembler.messageOrder.test.ts: ok');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
