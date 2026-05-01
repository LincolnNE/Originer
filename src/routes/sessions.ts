/**
 * Session Routes
 * 
 * According to API Specification & DB Schema document
 * Routes for session management: start, message, end
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StorageAdapter } from '../../backend/adapters/storage/types';
import { SessionOrchestrator } from '../../backend/core/SessionOrchestrator';
import type { Session } from '../../backend/core/types';

interface StartSessionRequest {
  instructor_id: string;
  learner_id: string;
  subject?: string;
  topic?: string;
  learning_objective?: string;
}

interface SendMessageRequest {
  message: string;
}

interface CreateSessionBody {
  learnerId?: string;
  instructorProfileId: string;
  subject: string;
  topic: string;
  learningObjective: string;
}

function sessionToApiShape(session: Session) {
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

async function createTeachingSession(
  storageAdapter: StorageAdapter,
  params: {
    instructorId: string;
    learnerId: string;
    subject: string;
    topic: string;
    learningObjective: string;
  }
) {
  await storageAdapter.ensureInstructor({
    id: params.instructorId,
    name: params.instructorId === 'default' ? 'Default instructor' : `Instructor ${params.instructorId}`,
  });
  await storageAdapter.ensureLearner({
    id: params.learnerId,
    name: params.learnerId.startsWith('anon_') ? 'Learner' : `Learner ${params.learnerId}`,
  });

  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const session = {
    id: sessionId,
    instructorId: params.instructorId,
    learnerId: params.learnerId,
    instructorProfileId: params.instructorId,
    subject: params.subject,
    topic: params.topic,
    learningObjective: params.learningObjective,
    sessionState: 'active' as const,
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };

  await storageAdapter.saveSession(session);
  return session;
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
   * POST /api/v1/sessions
   * Create session (frontend / API spec shape)
   */
  server.post<{ Body: CreateSessionBody }>(
    '/api/v1/sessions',
    async (request: FastifyRequest<{ Body: CreateSessionBody }>, reply: FastifyReply) => {
      const body = request.body || ({} as CreateSessionBody);
      const {
        instructorProfileId,
        subject,
        topic,
        learningObjective,
        learnerId: bodyLearnerId,
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
        const learnerId = bodyLearnerId || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const session = await createTeachingSession(storageAdapter, {
          instructorId: instructorProfileId,
          learnerId,
          subject,
          topic,
          learningObjective,
        });

        return reply.send({
          success: true,
          data: {
            session: sessionToApiShape(session),
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
   * GET /api/v1/sessions/:id
   * Load session (used by frontend session hook)
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
            session: sessionToApiShape(session),
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
        const session = await createTeachingSession(storageAdapter, {
          instructorId: instructor_id,
          learnerId: learner_id,
          subject: subject || 'General',
          topic: topic || 'Introduction',
          learningObjective: learning_objective || 'Learn and practice',
        });

        return reply.send({
          success: true,
          data: {
            session_id: session.id,
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
