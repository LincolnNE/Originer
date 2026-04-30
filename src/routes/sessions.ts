/**
 * Session Routes
 * 
 * According to API Specification & DB Schema document
 * Routes for session management: start, message, end
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StorageAdapter } from '../../backend/adapters/storage/types';
import { SessionOrchestrator } from '../../backend/core/SessionOrchestrator';

interface StartSessionRequest {
  instructor_id: string;
  learner_id: string;
  subject?: string;
  topic?: string;
  learning_objective?: string;
}

/** Body for POST /api/v1/sessions (camelCase, matches frontend types) */
interface CreateSessionRequestBody {
  instructorProfileId?: string;
  learnerId?: string;
  subject?: string;
  topic?: string;
  learningObjective?: string;
}

interface SendMessageRequest {
  message: string;
}

function normalizeCreateSessionFields(
  body: StartSessionRequest | CreateSessionRequestBody,
  options: { requireExplicitLearnerId?: boolean } = {}
): {
  instructorId: string;
  learnerId: string;
  subject: string;
  topic: string;
  learningObjective: string;
} | null {
  const instructorId =
    'instructor_id' in body && body.instructor_id !== undefined
      ? body.instructor_id
      : 'instructorProfileId' in body
        ? body.instructorProfileId
        : undefined;
  const hasLearnerId =
    'learner_id' in body && body.learner_id !== undefined && body.learner_id !== '';
  const hasLearnerIdCamel =
    'learnerId' in body && body.learnerId !== undefined && body.learnerId !== '';
  const learnerId = hasLearnerId
    ? body.learner_id!
    : hasLearnerIdCamel
      ? body.learnerId!
      : options.requireExplicitLearnerId
        ? undefined
        : 'default';
  const subject =
    'subject' in body && body.subject !== undefined ? body.subject : 'General';
  const topic = 'topic' in body && body.topic !== undefined ? body.topic : 'Introduction';
  const learningObjective =
    'learning_objective' in body && body.learning_objective !== undefined
      ? body.learning_objective
      : 'learningObjective' in body && body.learningObjective !== undefined
        ? body.learningObjective
        : 'Learn and practice';

  if (!instructorId || learnerId === undefined) {
    return null;
  }

  return { instructorId, learnerId, subject, topic, learningObjective };
}

type NormalizedCreateSession = NonNullable<ReturnType<typeof normalizeCreateSessionFields>>;

async function persistNewSession(
  storageAdapter: StorageAdapter,
  fields: NormalizedCreateSession
): Promise<{
  sessionId: string;
  session: {
    id: string;
    learnerId: string;
    instructorProfileId: string;
    subject: string;
    topic: string;
    learningObjective: string;
    sessionState: 'active';
    startedAt: string;
  };
}> {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sessionRecord = {
    id: sessionId,
    instructorId: fields.instructorId,
    learnerId: fields.learnerId,
    instructorProfileId: fields.instructorId,
    subject: fields.subject,
    topic: fields.topic,
    learningObjective: fields.learningObjective,
    sessionState: 'active' as const,
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };

  await storageAdapter.saveSession(sessionRecord);

  return {
    sessionId,
    session: {
      id: sessionId,
      learnerId: fields.learnerId,
      instructorProfileId: fields.instructorId,
      subject: fields.subject,
      topic: fields.topic,
      learningObjective: fields.learningObjective,
      sessionState: 'active',
      startedAt: sessionRecord.startedAt.toISOString(),
    },
  };
}

/**
 * Register session routes
 */
export async function registerSessionRoutes(
  server: FastifyInstance,
  storageAdapter: StorageAdapter,
  sessionOrchestrator: SessionOrchestrator
): Promise<void> {
  /**
   * POST /sessions
   * Create session (API contract used by the Next.js client)
   */
  server.post<{ Body: CreateSessionRequestBody }>(
    '/api/v1/sessions',
    async (request: FastifyRequest<{ Body: CreateSessionRequestBody }>, reply: FastifyReply) => {
      const normalized = normalizeCreateSessionFields(request.body);
      if (!normalized) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required field: instructorProfileId',
          },
        });
      }

      try {
        const { sessionId, session } = await persistNewSession(storageAdapter, normalized);
        return reply.send({
          success: true,
          data: {
            session,
            session_id: sessionId,
          },
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SESSION_CREATION_ERROR',
            message: error.message || 'Failed to create session',
          },
        });
      }
    }
  );

  /**
   * POST /sessions/start
   * Start a new teaching session
   */
  server.post<{ Body: StartSessionRequest }>(
    '/api/v1/sessions/start',
    async (request: FastifyRequest<{ Body: StartSessionRequest }>, reply: FastifyReply) => {
      const normalized = normalizeCreateSessionFields(request.body, {
        requireExplicitLearnerId: true,
      });

      if (!normalized) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: instructor_id, learner_id',
          },
        });
      }

      try {
        const { sessionId, session } = await persistNewSession(storageAdapter, normalized);

        return reply.send({
          success: true,
          data: {
            session,
            session_id: sessionId,
          },
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SESSION_CREATION_ERROR',
            message: error.message || 'Failed to create session',
          },
        });
      }
    }
  );

  /**
   * POST /sessions/:id/message
   * Send a message in a session (streaming possible)
   */
  server.post<{ Params: { id: string }; Body: SendMessageRequest }>(
    '/api/v1/sessions/:id/message',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: SendMessageRequest }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { message } = request.body;

      if (!message) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required field: message',
          },
        });
      }

      try {
        // Process message through SessionOrchestrator
        const aiMessage = await sessionOrchestrator.processLearnerMessage(id, message);

        return reply.send({
          success: true,
          data: {
            ai_message: aiMessage,
          },
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'MESSAGE_PROCESSING_ERROR',
            message: error.message || 'Failed to process message',
          },
        });
      }
    }
  );

  /**
   * POST /sessions/:id/end
   * End a teaching session
   */
  server.post<{ Params: { id: string } }>(
    '/api/v1/sessions/:id/end',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        const session = await storageAdapter.loadSession(id);
        if (!session) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'SESSION_NOT_FOUND',
              message: `Session not found: ${id}`,
            },
          });
        }

        await storageAdapter.updateSession(id, {
          sessionState: 'completed',
          endedAt: new Date(),
        });

        return reply.send({
          success: true,
          data: {
            session_id: id,
            ended_at: new Date().toISOString(),
          },
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SESSION_END_ERROR',
            message: error.message || 'Failed to end session',
          },
        });
      }
    }
  );
}
