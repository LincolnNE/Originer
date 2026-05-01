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

/** Body for POST /api/v1/sessions (frontend contract) */
interface CreateSessionBody {
  instructorProfileId?: string;
  learnerId?: string;
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
  const DEFAULT_INSTRUCTOR_ID = 'default';
  const ANONYMOUS_LEARNER_ID = 'learner_anonymous';

  async function ensureDefaultInstructorAndLearner(): Promise<void> {
    const db = storageAdapter as any;
    if (typeof db.createInstructor === 'function' && typeof db.createLearner === 'function') {
      try {
        await db.createInstructor({
          id: DEFAULT_INSTRUCTOR_ID,
          name: 'Default Instructor',
          bio: 'Built-in instructor for MVP sessions',
          tone: 'friendly',
        });
      } catch {
        // already exists
      }
      try {
        await db.createLearner({
          id: ANONYMOUS_LEARNER_ID,
          name: 'Anonymous',
          level: 'beginner',
        });
      } catch {
        // already exists
      }
    }
  }

  /** Satisfy SQLite FK on sessions.learner_id for arbitrary client-supplied IDs. */
  async function ensureLearnerRow(learnerId: string): Promise<void> {
    const db = storageAdapter as any;
    if (typeof db.createLearner !== 'function') return;
    try {
      await db.createLearner({
        id: learnerId,
        name: 'Learner',
        level: 'beginner',
      });
    } catch {
      // already exists
    }
  }

  /** Satisfy SQLite FK on sessions.instructor_id when clients omit instructor setup. */
  async function ensureInstructorRow(instructorId: string): Promise<void> {
    const db = storageAdapter as any;
    if (typeof db.createInstructor !== 'function') return;
    try {
      await db.createInstructor({
        id: instructorId,
        name: 'Instructor',
        bio: null,
        tone: 'friendly',
      });
    } catch {
      // already exists
    }
  }

  /**
   * POST /api/v1/sessions
   * Create session (shape expected by frontend: data.session.id)
   */
  server.post<{ Body: CreateSessionBody }>(
    '/api/v1/sessions',
    async (request: FastifyRequest<{ Body: CreateSessionBody }>, reply: FastifyReply) => {
      const {
        instructorProfileId,
        learnerId,
        subject,
        topic,
        learningObjective,
      } = request.body || {};

      const instructorId = instructorProfileId?.trim() || DEFAULT_INSTRUCTOR_ID;
      const resolvedLearnerId = learnerId?.trim() || ANONYMOUS_LEARNER_ID;

      try {
        await ensureDefaultInstructorAndLearner();
        await ensureLearnerRow(resolvedLearnerId);

        // Validate instructor *before* any stub insert: ensureInstructorRow would create a row
        // that makes loadInstructorProfile succeed and bypass this check.
        const existingInstructor = await storageAdapter.loadInstructorProfile(instructorId);
        if (!existingInstructor && instructorId !== DEFAULT_INSTRUCTOR_ID) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: `Instructor not found: ${instructorId}`,
            },
          });
        }

        await ensureInstructorRow(instructorId);

        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();

        const session = {
          id: sessionId,
          instructorId,
          learnerId: resolvedLearnerId,
          instructorProfileId: instructorId,
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
              lastActivityAt: session.lastActivityAt.toISOString(),
              endedAt: session.endedAt,
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
   * GET /api/v1/sessions/:id
   * Load session (frontend sessionsApi.getSession)
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
        const instructorProfile = await storageAdapter.loadInstructorProfile(instructor_id);
        if (!instructorProfile) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: `Instructor not found: ${instructor_id}`,
            },
          });
        }

        await ensureLearnerRow(learner_id);

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
