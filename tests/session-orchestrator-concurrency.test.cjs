/**
 * Regression: concurrent processLearnerMessage for the same session must not
 * lose message IDs (interleaved updateSession deletes in session_messages).
 *
 * Run from repo root: npm test
 */
'use strict';

const assert = require('assert');
const path = require('path');

// Compiled output (npm run build)
const { SessionOrchestrator } = require('../dist/backend/core/SessionOrchestrator');
const { PromptAssembler } = require('../dist/backend/core/PromptAssembler');
const { ResponseValidator } = require('../dist/backend/core/ResponseValidator');

async function main() {
  process.chdir(path.join(__dirname, '..'));

  const sessionId = 'sess_concurrency_test';
  let messageIds = [];
  const messages = new Map();

  const baseSession = {
    id: sessionId,
    instructorId: 'inst_1',
    learnerId: 'learn_1',
    instructorProfileId: 'inst_1',
    subject: 'Math',
    topic: 'Basics',
    learningObjective: 'Practice',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };

  const storageAdapter = {
    async loadSession(id) {
      return { ...baseSession, id, messageIds: [...messageIds] };
    },
    async saveSession() {},
    async loadInstructorProfile(profileId) {
      return {
        id: profileId,
        instructorId: profileId,
        name: 'Test Instructor',
        teachingPatterns: [],
        guidanceStyle: 'friendly',
        responseStructure: 'structured',
        questionPatterns: [],
        correctionStyle: 'gentle',
        consistencySettings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    async loadLearnerMemory(learnerId) {
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
    },
    async loadMessage(mid) {
      return messages.get(mid) ?? null;
    },
    async loadMids(ids) {
      return ids.map((id) => messages.get(id)).filter(Boolean);
    },
    async loadMessages(ids) {
      return this.loadMids(ids);
    },
    async saveMessage(m) {
      messages.set(m.id, m);
    },
    async updateSession(sid, updates) {
      // Yield like real I/O so two callers can interleave without serialization
      await new Promise((r) => setImmediate(r));
      if (updates.messageIds !== undefined) {
        messageIds = updates.messageIds;
      }
    },
    async saveLearnerMemory() {},
  };

  const llmAdapter = {
    async generate() {
      await new Promise((r) => setImmediate(r));
      return { content: 'Understood. What would you like to explore next?' };
    },
  };

  const orchestrator = new SessionOrchestrator(
    new PromptAssembler('config/prompts'),
    new ResponseValidator(),
    llmAdapter,
    storageAdapter
  );

  await Promise.all([
    orchestrator.processLearnerMessage(sessionId, 'first concurrent message'),
    orchestrator.processLearnerMessage(sessionId, 'second concurrent message'),
  ]);

  const finalSession = await storageAdapter.loadSession(sessionId);
  assert.strictEqual(
    finalSession.messageIds.length,
    4,
    `expected 4 message ids (2 learner + 2 instructor), got ${finalSession.messageIds.length}`
  );
  assert.strictEqual(messages.size, 4, `expected 4 stored messages, got ${messages.size}`);

  console.log('session-orchestrator-concurrency: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
