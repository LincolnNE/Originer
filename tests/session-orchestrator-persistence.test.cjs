/**
 * Ensures failed chat turns do not write learner rows or session_messages IDs
 * (atomic persistence after LLM success).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { SessionOrchestrator } = require('../dist/backend/core/SessionOrchestrator');

function baseSession() {
  return {
    id: 'sess_test',
    instructorId: 'inst_1',
    learnerId: 'learn_1',
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
}

function minimalProfile() {
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

function minimalLearnerMemory() {
  return {
    learnerId: 'learn_1',
    learnedConcepts: [],
    misconceptions: [],
    strengths: [],
    weaknesses: [],
    progressMarkers: [],
    sessionSummaries: [],
    lastUpdated: new Date(),
  };
}

test('failed LLM turn leaves session messageIds and storage unchanged', async () => {
  const session = baseSession();
  const savedMessages = [];
  const storage = {
    async loadSession() {
      return { ...session, messageIds: [...session.messageIds] };
    },
    async loadInstructorProfile() {
      return minimalProfile();
    },
    async loadLearnerMemory() {
      return minimalLearnerMemory();
    },
    async loadMessages(ids) {
      return ids.map((id) => ({
        id,
        sessionId: session.id,
        role: 'learner',
        content: 'past',
        messageType: 'question',
        timestamp: new Date(),
      }));
    },
    async saveMessage(msg) {
      savedMessages.push(msg);
    },
    async updateSession(_id, updates) {
      if (updates.messageIds) {
        session.messageIds = updates.messageIds;
      }
    },
    async saveLearnerMemory() {},
  };

  const orchestrator = new SessionOrchestrator(
    {
      assemblePrompt: async () => 'prompt',
      assembleFallbackPrompt: async (base) => `${base}\nfallback`,
    },
    {
      validate: () => ({ isValid: true, violations: [], action: 'ACCEPT' }),
    },
    {
      generate: async () => {
        throw new Error('LLM unavailable');
      },
    },
    storage
  );

  await assert.rejects(
    () => orchestrator.processLearnerMessage(session.id, 'hello'),
    /LLM unavailable/
  );

  assert.equal(session.messageIds.length, 0);
  assert.equal(savedMessages.length, 0);
});

test('successful turn persists learner and instructor messages and updates ids', async () => {
  const session = baseSession();
  const savedMessages = [];
  const storage = {
    async loadSession() {
      return { ...session, messageIds: [...session.messageIds] };
    },
    async loadInstructorProfile() {
      return minimalProfile();
    },
    async loadLearnerMemory() {
      return minimalLearnerMemory();
    },
    async loadMessages(ids) {
      return ids.map((id) => ({
        id,
        sessionId: session.id,
        role: 'learner',
        content: 'past',
        messageType: 'question',
        timestamp: new Date(),
      }));
    },
    async saveMessage(msg) {
      savedMessages.push(msg);
    },
    async updateSession(_id, updates) {
      if (updates.messageIds) {
        session.messageIds = updates.messageIds;
      }
    },
    async saveLearnerMemory() {},
  };

  const orchestrator = new SessionOrchestrator(
    {
      assemblePrompt: async () => 'prompt',
      assembleFallbackPrompt: async (base) => `${base}\nfallback`,
    },
    {
      validate: () => ({ isValid: true, violations: [], action: 'ACCEPT' }),
    },
    {
      generate: async () => ({ content: 'AI reply' }),
    },
    storage
  );

  const out = await orchestrator.processLearnerMessage(session.id, 'hello');
  assert.equal(out, 'AI reply');
  assert.equal(savedMessages.length, 2);
  assert.equal(savedMessages[0].role, 'learner');
  assert.equal(savedMessages[1].role, 'instructor');
  assert.equal(session.messageIds.length, 2);
  assert.equal(session.messageIds[0], savedMessages[0].id);
  assert.equal(session.messageIds[1], savedMessages[1].id);
});
