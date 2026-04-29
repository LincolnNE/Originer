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
  instructor_id: string;
  learner_id: string;
  subject?: string;
  topic?: string;
  learning_objective?: string;
}

/** Matches frontend CreateSessionRequest / landing page flow */
interface CreateSessionRestRequest {
  instructorProfileId: string;
  subject?: string;
  topic?: string;
  learningObjective?: string;
  learnerId?: string;
}

interface SendMessageRequest {
  message: string;
}

function asDbStorage(adapter: StorageAdapter): DatabaseStorageAdapter {
  return adapter as DatabaseStorageAdapter;
}

async function ensureSessionParticipants(
  db: DatabaseStorageAdapter,
  instructorId: string,
  learnerId: string
): Promise<void> {
  try {
    await db.createInstructor({
      id: instructorId,
      name: 'Instructor',
      tone: 'friendly',
    });
  } catch {
    // Already exists (or race); ignore
  }
  try {
    await db.createLearner({
      id: learnerId,
      name: 'Learner',
      level: 'beginner',
    });
  } catch {
    // Already exists (or race); ignore
  }
}

/**
 * Register session routes
 */
export async function registerSessionRoutes(
  server: FastifyInstance,
  storageAdapter: StorageAdapter,
  sessionOrchestrator: SessionOrchestrator
): Promise<void> {
  const dbStorage = asDbStorage(storageAdapter);

  /**
   * POST /api/v1/sessions
   * Create session (REST shape expected by frontend api client and landing page)
   */
  server.post<{ Body: CreateSessionRestRequest }>(
    '/api/v1/sessions',
    async (request: FastifyRequest<{ Body: CreateSessionRestRequest }>, reply: FastifyReply) => {
      const body = request.body || ({} as CreateSessionRestRequest);
      const {
        instructorProfileId,
        subject,
        topic,
        learningObjective,
        learnerId: bodyLearnerId,
      } = body;

      if (!instructorProfileId) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required field: instructorProfileId',
          },
        });
      }

      const learnerId = bodyLearnerId || 'anonymous';
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      try {
        await ensureSessionParticipants(dbStorage, instructorProfileId, learnerId);

        const session = {
          id: sessionId,
          instructorId: instructorProfileId,
          learnerId,
          instructorProfileId,
          subject: subject || 'General',
          topic: topic || 'Introduction',
          learningObjective: learningObjective || 'Learn and practice',
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
      } catch (error: unknown) {
        const err = error as { message?: string };
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SESSION_CREATION_ERROR',
            message: err.message || 'Failed to create session',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/sessions/:sessionId
   * Load session for client hydration
   */
  server.get<{ Params: { sessionId: string } }>(
    '/api/v1/sessions/:sessionId',
    async (
      request: FastifyRequest<{ Params: { sessionId: string } }>,
      reply: FastifyReply
    ) => {
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
      } catch (error: unknown) {
        const err = error as { message?: string };
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'SESSION_LOAD_ERROR',
            message: err.message || 'Failed to load session',
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
        await ensureSessionParticipants(dbStorage, instructor_id, learner_id);

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
