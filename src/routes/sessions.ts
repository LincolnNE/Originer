/**
 * Session Routes
 *
 * According to API Specification & DB Schema document
 * Routes for session management: start, message, end
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StorageAdapter } from '../../backend/adapters/storage/types';
import { SessionOrchestrator } from '../../backend/core/SessionOrchestrator';
import { Session } from '../../backend/core/types';

/** Accept both snake_case (API spec) and camelCase (frontend) bodies */
interface CreateSessionBody {
  instructor_id?: string;
  learner_id?: string;
  instructorProfileId?: string;
  subject?: string;
  topic?: string;
  learning_objective?: string;
  learningObjective?: string;
}

interface SendMessageRequest {
  message: string;
}

const DEFAULT_INSTRUCTOR_ID = 'default';
const ANONYMOUS_LEARNER_ID = 'anonymous';

function resolveCreateSessionFields(body: CreateSessionBody): {
  instructorId: string;
  learnerId: string;
  subject: string;
  topic: string;
  learningObjective: string;
} {
  const instructorId =
    body.instructor_id?.trim() ||
    body.instructorProfileId?.trim() ||
    DEFAULT_INSTRUCTOR_ID;
  const learnerId = body.learner_id?.trim() || ANONYMOUS_LEARNER_ID;
  const subject = body.subject?.trim() || 'General';
  const topic = body.topic?.trim() || 'Introduction';
  const learningObjective =
    body.learning_objective?.trim() ||
    body.learningObjective?.trim() ||
    'Learn and practice';

  return { instructorId, learnerId, subject, topic, learningObjective };
}

function sessionToApiSession(session: Session) {
  return {
    id: session.id,
    learnerId: session.learnerId,
    instructorProfileId: session.instructorProfileId,
    subject: session.subject,
    topic: session.topic,
    learningObjective: session.learningObjective,
    sessionState: session.sessionState,
    startedAt: session.startedAt.toISOString(),
    lastActivityAt: session.lastActivityAt.toISOString(),
    endedAt: session.endedAt ? session.endedAt.toISOString() : null,
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
  const handleCreateSession = async (
    request: FastifyRequest<{ Body: CreateSessionBody }>,
    reply: FastifyReply
  ) => {
    const { instructorId, learnerId, subject, topic, learningObjective } =
      resolveCreateSessionFields(request.body || {});

    try {
      await storageAdapter.ensureParticipantRowsForSession(instructorId, learnerId);

      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const session: Session = {
        id: sessionId,
        instructorId,
        learnerId,
        instructorProfileId: instructorId,
        subject,
        topic,
        learningObjective,
        sessionState: 'active',
        messageIds: [],
        startedAt: new Date(),
        lastActivityAt: new Date(),
        endedAt: null,
      };

      await storageAdapter.saveSession(session);

      return reply.send({
        success: true,
        data: {
          session: sessionToApiSession(session),
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
  };

  /** Primary path used by Next.js app and API client */
  server.post<{ Body: CreateSessionBody }>(
    '/api/v1/sessions',
    handleCreateSession
  );

  /** Spec alias */
  server.post<{ Body: CreateSessionBody & { instructor_id?: string; learner_id?: string } }>(
    '/api/v1/sessions/start',
    handleCreateSession
  );

  server.get<{ Params: { id: string } }>(
    '/api/v1/sessions/:id',
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
        return reply.send({
          success: true,
          data: {
            session: sessionToApiSession(session),
          },
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SESSION_FETCH_ERROR',
            message: error.message || 'Failed to load session',
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
