/**
 * Regression: conversation history in prompts must follow session order, not timestamp order.
 * Pair with session-message-order-regression.sh (storage) and formatMessageHistory behavior.
 */
import { PromptAssembler } from '../backend/core/PromptAssembler';
import type { InstructorProfile, LearnerMemory, Message, Session } from '../backend/core/types';

const assembler = new PromptAssembler('config/prompts');

const session: Session = {
  id: 's1',
  instructorId: 'inst',
  learnerId: 'learn',
  instructorProfileId: 'inst',
  subject: 'math',
  topic: 'algebra',
  learningObjective: 'solve',
  sessionState: 'active',
  messageIds: ['m1', 'm2'],
  startedAt: new Date(),
  lastActivityAt: new Date(),
  endedAt: null,
};

const instructorProfile: InstructorProfile = {
  id: 'inst',
  instructorId: 'inst',
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

const learnerMemory: LearnerMemory = {
  learnerId: 'learn',
  learnedConcepts: [],
  misconceptions: [],
  strengths: [],
  weaknesses: [],
  progressMarkers: [],
  sessionSummaries: [],
  lastUpdated: new Date(),
};

// Learner spoke first, but timestamps are reversed (clock skew / backfill)
const messages: Message[] = [
  {
    id: 'm1',
    sessionId: 's1',
    role: 'learner',
    content: 'learner_first',
    messageType: 'question',
    timestamp: new Date('2026-05-02T14:00:00Z'),
  },
  {
    id: 'm2',
    sessionId: 's1',
    role: 'instructor',
    content: 'instructor_second',
    messageType: 'response',
    timestamp: new Date('2026-05-02T12:00:00Z'),
  },
];

async function main(): Promise<void> {
  const prompt = await assembler.assemblePrompt({
    session,
    instructorProfile,
    learnerMemory,
    messageHistory: messages,
    currentMessage: 'current_q',
  });

  const learnerMarker = 'Learner: learner_first';
  const instructorMarker = 'Instructor: instructor_second';
  const learnerIdx = prompt.indexOf(learnerMarker);
  const instructorIdx = prompt.indexOf(instructorMarker);

  if (learnerIdx === -1 || instructorIdx === -1) {
    console.error('Expected both dialogue lines in assembled prompt');
    process.exit(1);
  }
  if (learnerIdx >= instructorIdx) {
    console.error(
      'Expected session order (learner then instructor) in [CONVERSATION HISTORY], got learner at',
      learnerIdx,
      'instructor at',
      instructorIdx
    );
    process.exit(1);
  }

  console.log('prompt-assembler-history-order: ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
