/**
 * Session Routes
 * 
 * According to API Specification & DB Schema document
 * Routes for session management: start, message, end
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StorageAdapter } from '../../backend/adapters/storage/types';
import { SessionOrchestrator } from '../../backend/core/SessionOrchestrator';
import { DatabaseStorageAdapter } from '../../backend/adapters/storage/database';

interface StartSessionRequest {
  instructor_id?: string;
  learner_id?: string;
  subject?: string;
  topic?: string;
  learning_objective?: string;
}

/** Body from frontend api client (camelCase, matches CreateSessionRequest). */
interface CreateSessionBody {
  learnerId?: string;
  instructorProfileId?: string;
  subject?: string;
  topic?: string;
  learningObjective?: string;
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
      const { instructor_id, learner_id, subject, topic, learning_objective } = request.body;

      try {
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const resolvedInstructorId =
          instructor_id || DatabaseStorageAdapter.DEFAULT_INSTRUCTOR_ID;
        const resolvedLearnerId = learner_id || DatabaseStorageAdapter.DEFAULT_LEARNER_ID;

        const session = {
          id: sessionId,
          instructorId: resolvedInstructorId,
          learnerId: resolvedLearnerId,
          instructorProfileId: resolvedInstructorId, // Use instructor_id as profile_id for MVP
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
   * POST /sessions
   * Create session (camelCase body) — used by frontend sessionsApi.createSession / useSession.
   * Mirrors POST /sessions/start but matches documented path and response shape.
   */
  server.post<{ Body: CreateSessionBody }>(
    '/api/v1/sessions',
    async (request: FastifyRequest<{ Body: CreateSessionBody }>, reply: FastifyReply) => {
      const {
        learnerId,
        instructorProfileId,
        subject,
        topic,
        learningObjective,
      } = request.body || {};

      try {
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const resolvedInstructorId =
          instructorProfileId || DatabaseStorageAdapter.DEFAULT_INSTRUCTOR_ID;
        const resolvedLearnerId = learnerId || DatabaseStorageAdapter.DEFAULT_LEARNER_ID;
        const now = new Date();

        const session = {
          id: sessionId,
          instructorId: resolvedInstructorId,
          learnerId: resolvedLearnerId,
          instructorProfileId: resolvedInstructorId,
          subject: subject || 'General',
          topic: topic || 'Introduction',
          learningObjective: learningObjective || 'Learn and practice',
          sessionState: 'active' as const,
          messageIds: [],
          startedAt: now,
          lastActivityAt: now,
          endedAt: null,
        };

        await storageAdapter.saveSession(session);

        return reply.send({
          success: true,
          data: {
            session: {
              id: session.id,
              learnerId: session.learnerId,
              instructorProfileId: session.instructorProfileId,
              subject: session.subject,
              topic: session.topic,
              learningObjective: session.learningObjective,
              sessionState: session.sessionState,
              startedAt: session.startedAt.toISOString(),
            },
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
   * GET /sessions/:sessionId
   * Load session for client-side lesson flow (SessionProvider / useSession).
   */
  server.get<{ Params: { sessionId: string } }>(
    '/api/v1/sessions/:sessionId',
    async (request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) => {
      const { sessionId } = request.params;

      try {
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

        return reply.send({
          success: true,
          data: {
            session: {
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
            },
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
