/**
 * Lesson Routes
 * 
 * Data Flow:
 * HTTP Request → Route Handler → SessionOrchestrator → StorageAdapter
 *                                          ↓
 *                                    PromptAssembler → LLMAdapter
 *                                          ↓
 *                                    ResponseValidator
 *                                          ↓
 * HTTP Response ← Route Handler ← SessionOrchestrator
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SessionOrchestrator } from '../../backend/core/SessionOrchestrator';
import { StorageAdapter } from '../../backend/adapters/storage/types';

interface StartLessonRequest {
  sessionId: string;
  screenId: string;
  screenType: string;
  clientTimestamp?: string;
}

interface SubmitAnswerRequest {
  sessionId: string;
  answer: string;
  attemptNumber?: number;
  timeSpent?: number;
  clientTimestamp?: string;
}

interface RequestHintRequest {
  sessionId: string;
  hintLevel?: number;
}

interface CompleteLessonRequest {
  sessionId: string;
}

/**
 * Register lesson routes
 */
export async function registerLessonRoutes(
  server: FastifyInstance,
  sessionOrchestrator: SessionOrchestrator,
  storageAdapter: StorageAdapter
): Promise<void> {
  /**
   * POST /api/v1/lessons/start
   * 
   * Data Flow:
   * 1. Validate request body
   * 2. Load session from StorageAdapter (stateless)
   * 3. Validate screen prerequisites (placeholder)
   * 4. Return lesson content and initial state
   */
  server.post<{ Body: StartLessonRequest }>(
    '/api/v1/lessons/start',
    async (request: FastifyRequest<{ Body: StartLessonRequest }>, reply: FastifyReply) => {
      const { sessionId, screenId, screenType } = request.body;

      // Validate request
      if (!sessionId || !screenId || !screenType) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: sessionId, screenId, screenType',
          },
        });
      }

      // STATELESS: Load session from storage
      const session = await storageAdapter.loadSession(sessionId);
      if (!session) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: `Session not found: ${sessionId}`,
          },
        });
      }

      // TODO: Validate screen prerequisites
      // TODO: Check if screen is locked
      // TODO: Load screen definition/content
      // TODO: Initialize screen progress

      // Placeholder response showing data structure
      return reply.send({
        success: true,
        data: {
          lesson: {
            screenId,
            sessionId,
            screenType,
            concept: 'PLACEHOLDER', // TODO: Load from screen definition
            learningObjective: 'PLACEHOLDER',
            content: {
              problem: 'PLACEHOLDER',
              instructions: 'PLACEHOLDER',
              hintsAvailable: 3,
              maxAttempts: 5,
            },
            constraints: {
              minTimeOnScreen: 60,
              requiredAttempts: 1,
              masteryThreshold: 80,
              cooldownBetweenAttempts: 10,
              rateLimitPerMinute: 6,
            },
            state: 'active',
            startedAt: new Date().toISOString(),
          },
          progress: {
            attempts: 0,
            timeSpent: 0,
            canProceed: false,
            masteryScore: null,
          },
          navigation: {
            canGoBack: true,
            canGoForward: false,
            nextScreenId: null, // TODO: Determine from screen flow
            nextScreenUnlocked: false,
            unlockRequirements: [], // TODO: Calculate from constraints
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
  );

  /**
   * POST /api/v1/lessons/:screenId/submit
   * 
   * Data Flow:
   * 1. Validate request body
   * 2. Load session from StorageAdapter (stateless)
   * 3. Call SessionOrchestrator.processLearnerMessage()
   *    → PromptAssembler.assemblePrompt() (internal)
   *    → LLMAdapter.generate()
   *    → ResponseValidator.validate() (internal)
   *    → Update learner memory
   * 4. Return structured response with feedback and progress
   */
  server.post<{ Params: { screenId: string }; Body: SubmitAnswerRequest }>(
    '/api/v1/lessons/:screenId/submit',
    async (
      request: FastifyRequest<{ Params: { screenId: string }; Body: SubmitAnswerRequest }>,
      reply: FastifyReply
    ) => {
      const { screenId } = request.params;
      const { sessionId, answer } = request.body;

      if (!sessionId || !answer) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: sessionId, answer',
          },
        });
      }

      // STATELESS: Load session from storage
      const session = await storageAdapter.loadSession(sessionId);
      if (!session) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: `Session not found: ${sessionId}`,
          },
        });
      }

      // TODO: Validate constraints (rate limiting, cooldown, max attempts)
      // TODO: Track attempt number and time spent

      try {
        // CORE LOGIC: Process learner message through SessionOrchestrator
        // This internally uses:
        // - PromptAssembler to assemble prompts
        // - LLMAdapter to generate responses
        // - ResponseValidator to validate responses
        const instructorResponse = await sessionOrchestrator.processLearnerMessage(
          sessionId,
          answer
        );

        // TODO: Calculate progress from storage
        // TODO: Check mastery threshold
        // TODO: Determine if can proceed

        return reply.send({
          success: true,
          data: {
            feedback: {
              content: instructorResponse,
              type: 'guidance', // TODO: Determine from ResponseValidator or message type
            },
            progress: {
              attempts: 1, // TODO: Load from storage
              masteryScore: 0, // TODO: Calculate from attempts/responses
              canProceed: false, // TODO: Check against mastery threshold
            },
            constraints: {
              canSubmitAgain: true, // TODO: Check rate limits, cooldowns
              nextSubmissionAllowedAt: null, // TODO: Calculate from cooldown
              remainingAttempts: 4, // TODO: Calculate from max attempts
            },
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id,
          },
        });
      } catch (error: any) {
        // Handle errors from SessionOrchestrator
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'PROCESSING_ERROR',
            message: error.message || 'Failed to process answer',
          },
        });
      }
    }
  );

  /**
   * POST /api/v1/lessons/:screenId/hint
   * 
   * Data Flow:
   * 1. Validate request
   * 2. Load session from StorageAdapter
   * 3. Generate hint using SessionOrchestrator (with hint context)
   * 4. Return hint response
   */
  server.post<{ Params: { screenId: string }; Body: RequestHintRequest }>(
    '/api/v1/lessons/:screenId/hint',
    async (
      request: FastifyRequest<{ Params: { screenId: string }; Body: RequestHintRequest }>,
      reply: FastifyReply
    ) => {
      const { screenId } = request.params;
      const { sessionId, hintLevel } = request.body;

      if (!sessionId) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required field: sessionId',
          },
        });
      }

      // STATELESS: Load session
      const session = await storageAdapter.loadSession(sessionId);
      if (!session) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: `Session not found: ${sessionId}`,
          },
        });
      }

      // TODO: Check hint availability (hints remaining)
      // TODO: Generate hint using SessionOrchestrator with hint context
      // For now, placeholder

      return reply.send({
        success: true,
        data: {
          hint: {
            content: 'PLACEHOLDER: Hint content', // TODO: Generate via SessionOrchestrator
            level: hintLevel || 1,
            hintsRemaining: 2, // TODO: Calculate from screen state
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
  );

  /**
   * POST /api/v1/lessons/:screenId/complete
   * 
   * Data Flow:
   * 1. Validate request
   * 2. Load session from StorageAdapter
   * 3. Validate completion requirements (mastery, attempts, etc.)
   * 4. Update session state
   * 5. Return completion status
   */
  server.post<{ Params: { screenId: string }; Body: CompleteLessonRequest }>(
    '/api/v1/lessons/:screenId/complete',
    async (
      request: FastifyRequest<{ Params: { screenId: string }; Body: CompleteLessonRequest }>,
      reply: FastifyReply
    ) => {
      const { screenId } = request.params;
      const { sessionId } = request.body;

      if (!sessionId) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required field: sessionId',
          },
        });
      }

      // STATELESS: Load session
      const session = await storageAdapter.loadSession(sessionId);
      if (!session) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: `Session not found: ${sessionId}`,
          },
        });
      }

      // TODO: Validate completion requirements
      // TODO: Check mastery threshold
      // TODO: Check required attempts
      // TODO: Update screen progress in storage
      // TODO: Unlock next screen if requirements met

      return reply.send({
        success: true,
        data: {
          completed: true,
          screenId,
          masteryAchieved: false, // TODO: Calculate from progress
          nextScreenUnlocked: false, // TODO: Check unlock requirements
          nextScreenId: null, // TODO: Determine from screen flow
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
  );
}
