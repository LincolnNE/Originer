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

interface StartSessionRequest {
  instructor_id: string;
  learner_id: string;
  subject?: string;
  topic?: string;
  learning_objective?: string;
}

/** Contract used by Next.js server action and frontend API client (camelCase). */
interface CreateSessionRequest {
  instructorProfileId: string;
  learnerId?: string;
  subject: string;
  topic: string;
  learningObjective: string;
}

interface SendMessageRequest {
  message: string;
}

function asDb(storageAdapter: StorageAdapter): DatabaseStorageAdapter {
  return storageAdapter as DatabaseStorageAdapter;
}

/**
 * Ensure instructor and learner rows exist so session INSERT satisfies FK constraints
 * when SQLite foreign keys are enabled.
 */
async function ensureInstructorAndLearner(
  storageAdapter: StorageAdapter,
  instructorId: string,
  learnerId: string
): Promise<void> {
  const db = asDb(storageAdapter);
  try {
    await db.createInstructor({
      id: instructorId,
      name: instructorId === 'default' ? 'Default Instructor' : `Instructor ${instructorId}`,
      tone: 'friendly',
    });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (!msg.includes('UNIQUE') && !msg.includes('unique')) {
      throw e;
    }
  }
  try {
    await db.createLearner({
      id: learnerId,
      name: 'Learner',
      level: 'beginner',
    });
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (!msg.includes('UNIQUE') && !msg.includes('unique')) {
      throw e;
    }
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
  /**
   * POST /sessions
   * Create session (primary API for frontend / Next.js server actions)
   */
  server.post<{ Body: CreateSessionRequest }>(
    '/api/v1/sessions',
    async (request: FastifyRequest<{ Body: CreateSessionRequest }>, reply: FastifyReply) => {
      const body = request.body || ({} as CreateSessionRequest);
      const {
        instructorProfileId,
        learnerId: requestedLearnerId,
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

      const instructorId = instructorProfileId;
      const learnerId =
        requestedLearnerId ||
        `learner_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      try {
        await ensureInstructorAndLearner(storageAdapter, instructorId, learnerId);

        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const now = new Date();
        const session = {
          id: sessionId,
          instructorId,
          learnerId,
          instructorProfileId,
          subject,
          topic,
          learningObjective,
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
              id: sessionId,
              learnerId,
              instructorProfileId,
              subject,
              topic,
              learningObjective,
              sessionState: 'active',
              startedAt: now.toISOString(),
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
   * Load session (used by frontend session hook)
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
        await ensureInstructorAndLearner(storageAdapter, instructor_id, learner_id);

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
