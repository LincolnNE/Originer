/**
 * Session Routes
 *
 * According to API Specification & DB Schema document
 * Routes for session management: create, get, start, message, end
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StorageAdapter } from '../../backend/adapters/storage/types';
import { DatabaseStorageAdapter } from '../../backend/adapters/storage/database';
import { SessionOrchestrator } from '../../backend/core/SessionOrchestrator';

interface StartSessionRequest {
  instructor_id: string;
  learner_id: string;
  subject?: string;
  topic?: string;
  learning_objective?: string;
}

interface CreateSessionBody {
  instructorProfileId: string;
  learnerId?: string;
  subject: string;
  topic: string;
  learningObjective: string;
}

interface SendMessageRequest {
  message: string;
}

function isDatabaseAdapter(adapter: StorageAdapter): adapter is DatabaseStorageAdapter {
  return adapter instanceof DatabaseStorageAdapter;
}

/**
 * Register session routes
 */
export async function registerSessionRoutes(
  server: FastifyInstance,
  storageAdapter: StorageAdapter,
  sessionOrchestrator: SessionOrchestrator
): Promise<void> {
  async function persistNewSession(session: {
    id: string;
    instructorId: string;
    learnerId: string;
    instructorProfileId: string;
    subject: string;
    topic: string;
    learningObjective: string;
    sessionState: 'active';
    messageIds: string[];
    startedAt: Date;
    lastActivityAt: Date;
    endedAt: null;
  }): Promise<void> {
    if (isDatabaseAdapter(storageAdapter)) {
      await storageAdapter.ensureSessionParticipants(session.instructorId, session.learnerId, {
        instructorProfileId: session.instructorProfileId,
      });
    }
    await storageAdapter.saveSession(session);
  }

  /**
   * POST /sessions
   * Create session (frontend / API contract shape)
   */
  server.post<{ Body: CreateSessionBody }>(
    '/api/v1/sessions',
    async (request: FastifyRequest<{ Body: CreateSessionBody }>, reply: FastifyReply) => {
      const body = request.body || ({} as CreateSessionBody);
      const {
        instructorProfileId,
        learnerId,
        subject,
        topic,
        learningObjective,
      } = body;

      if (!instructorProfileId || !subject || !topic || !learningObjective) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message:
              'Missing required fields: instructorProfileId, subject, topic, learningObjective',
          },
        });
      }

      try {
        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const resolvedLearnerId = learnerId ?? `anon_${sessionId}`;

        const session = {
          id: sessionId,
          instructorId: instructorProfileId,
          learnerId: resolvedLearnerId,
          instructorProfileId,
          subject,
          topic,
          learningObjective,
          sessionState: 'active' as const,
          messageIds: [],
          startedAt: new Date(),
          lastActivityAt: new Date(),
          endedAt: null,
        };

        await persistNewSession(session);

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
              sessionState: 'active' as const,
              startedAt: session.startedAt.toISOString(),
            },
          },
        });
      } catch (error: unknown) {
        request.log.error(error);
        const message = error instanceof Error ? error.message : 'Failed to create session';
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SESSION_CREATION_ERROR',
            message,
          },
        });
      }
    }
  );

  /**
   * GET /sessions/:sessionId
   */
  server.get<{ Params: { sessionId: string } }>(
    '/api/v1/sessions/:sessionId',
    async (
      request: FastifyRequest<{ Params: { sessionId: string } }>,
      reply: FastifyReply
    ) => {
      const { sessionId } = request.params;
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
    }
  );

  /**
   * POST /sessions/start
   * Start a new teaching session
   */
  server.post<{ Body: StartSessionRequest }>(
    '/api/v1/sessions/start',
    async (request: FastifyRequest<{ Body: StartSessionRequest }>, reply: FastifyReply) => {
      const { instructor_id, learner_id, subject, topic, learning_objective } = request.body;

      if (!instructor_id || !learner_id) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: instructor_id, learner_id',
          },
        });
      }

      try {
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

        await persistNewSession(session);

        return reply.send({
          success: true,
          data: {
            session_id: sessionId,
          },
        });
      } catch (error: unknown) {
        request.log.error(error);
        const message = error instanceof Error ? error.message : 'Failed to create session';
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SESSION_CREATION_ERROR',
            message,
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
      } catch (error: unknown) {
        request.log.error(error);
        const messageText =
          error instanceof Error ? error.message : 'Failed to process message';
        return reply.code(500).send({
          success: false,
          error: {
            code: 'MESSAGE_PROCESSING_ERROR',
            message: messageText,
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
      } catch (error: unknown) {
        request.log.error(error);
        const message = error instanceof Error ? error.message : 'Failed to end session';
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SESSION_END_ERROR',
            message,
          },
        });
      }
    }
  );
}
