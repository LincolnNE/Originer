/**
 * Ensures a failed LLM turn does not leave session_messages pointing at
 * a learner message without a completed instructor reply.
 */

import { SessionOrchestrator } from '../core/SessionOrchestrator';
import { PromptAssembler } from '../core/PromptAssembler';
import { ResponseValidator } from '../core/ResponseValidator';
import { LLMAdapter } from '../adapters/llm/types';
import { StorageAdapter } from '../adapters/storage/types';
import { DatabaseStorageAdapter } from '../adapters/storage/database';
import { Session } from '../core/types';

function makeOrchestratorWithFailingLlm(
  storage: DatabaseStorageAdapter,
  failOnCall: number
): SessionOrchestrator {
  let calls = 0;
  const llmAdapter: LLMAdapter = {
    generate: async () => {
      calls += 1;
      if (calls === failOnCall) {
        throw new Error('simulated LLM failure');
      }
      return { content: 'Instructor reply.', finishReason: 'stop' };
    },
    async *generateStream() {
      yield '';
    },
  };

  return new SessionOrchestrator(
    new PromptAssembler('config/prompts'),
    new ResponseValidator(),
    llmAdapter,
    storage as unknown as StorageAdapter
  );
}

describe('SessionOrchestrator processLearnerMessage', () => {
  const sessionId = 'sess_test_atomicity';
  const instructorId = 'instr_test';
  const learnerId = 'learner_test';

  async function seedSession(storage: DatabaseStorageAdapter): Promise<void> {
    await storage.createInstructor({
      id: instructorId,
      name: 'Test Instructor',
    });
    await storage.createLearner({
      id: learnerId,
      name: 'Test Learner',
      level: 'beginner',
    });
    const session: Session = {
      id: sessionId,
      instructorId,
      learnerId,
      instructorProfileId: instructorId,
      subject: 'Math',
      topic: 'Fractions',
      learningObjective: 'Practice',
      sessionState: 'active',
      messageIds: [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
      endedAt: null,
    };
    await storage.saveSession(session);
  }

  it('does not append learner message to session when LLM throws', async () => {
    const storage = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: ':memory:',
    });
    await seedSession(storage);

    const orchestrator = makeOrchestratorWithFailingLlm(storage, 1);

    await expect(
      orchestrator.processLearnerMessage(sessionId, 'Hello?')
    ).rejects.toThrow('simulated LLM failure');

    const session = await storage.loadSession(sessionId);
    expect(session?.messageIds).toEqual([]);

    storage.close();
  });

  it('appends both message ids after successful turn', async () => {
    const storage = new DatabaseStorageAdapter({
      type: 'sqlite',
      connectionString: ':memory:',
    });
    await seedSession(storage);

    const orchestrator = makeOrchestratorWithFailingLlm(storage, 999);

    await orchestrator.processLearnerMessage(sessionId, 'Hello');

    const session = await storage.loadSession(sessionId);
    expect(session?.messageIds.length).toBe(2);

    storage.close();
  });
});
