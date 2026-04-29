/**
 * Session Routes
 * 
 * According to API Specification & DB Schema document
 * Routes for session management: start, message, end
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StorageAdapter } from '../../backend/adapters/storage/types';
import { DatabaseStorageAdapter } from '../../backend/adapters/storage/database';
import { SessionOrchestrator } from '../../backend/core/SessionOrchestrator';
import { Session } from '../../backend/core/types';

const DEFAULT_INSTRUCTOR_ID = 'default';
const DEFAULT_LEARNER_ID = 'default';

/** API session payload (ISO date strings) for GET/POST session responses */
function sessionToJson(session: Session) {
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

interface StartSessionRequest {
  instructor_id?: string;
  learner_id?: string;
  subject?: string;
  topic?: string;
  learning_objective?: string;
}

interface SendMessageRequest {
  message: string;
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
   * POST /sessions/start
   * Start a new teaching session
   */
  server.post<{ Body: StartSessionRequest }>(
    '/api/v1/sessions/start',
    async (request: FastifyRequest<{ Body: StartSessionRequest }>, reply: FastifyReply) => {
      const instructor_id =
        (typeof request.body.instructor_id === 'string' && request.body.instructor_id.trim()) ||
        DEFAULT_INSTRUCTOR_ID;
      const learner_id =
        (typeof request.body.learner_id === 'string' && request.body.learner_id.trim()) ||
        DEFAULT_LEARNER_ID;
      const { subject, topic, learning_objective } = request.body;

      try {
        if (storageAdapter instanceof DatabaseStorageAdapter) {
          storageAdapter.ensureDefaultInstructorAndLearner(instructor_id, learner_id);
        }

        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const session = {
          id: sessionId,
          instructorId: instructor_id,
          learnerId: learner_id,
          instructorProfileId: instructor_id, // Use instructor_id as profile_id for MVP
          subject: subject || 'General',
          topic: topic || 'Introduction',
          learningObjective: learning_objective || 'Learn and practice',
          sessionState: 'active' as const,
          messageIds: [],
          startedAt: new Date(),
          lastActivityAt: new Date(),
          endedAt: null,
        };

        await storageAdapter.saveSession(session);

        return reply.send({
          success: true,
          data: {
            session_id: sessionId,
            session: sessionToJson(session),
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
   * GET /sessions/:id
   * Load session by id (used by the Next.js app after redirect)
   */
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
            session: sessionToJson(session),
          },
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SESSION_LOAD_ERROR',
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
