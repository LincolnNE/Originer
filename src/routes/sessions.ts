/**
 * Session Routes
 * 
 * Data Flow:
 * HTTP Request → Route Handler → StorageAdapter → SessionOrchestrator (if needed)
 * HTTP Response ← Route Handler ← StorageAdapter
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StorageAdapter } from '../../backend/adapters/storage/types';

interface CreateSessionRequest {
  learnerId: string;
  instructorProfileId: string;
  subject: string;
  topic: string;
  learningObjective: string;
}

/**
 * Register session routes
 */
export async function registerSessionRoutes(
  server: FastifyInstance,
  storageAdapter: StorageAdapter
): Promise<void> {
  /**
   * POST /api/v1/sessions
   * 
   * Data Flow:
   * 1. Validate request body
   * 2. Create session via StorageAdapter
   * 3. Return session data
   */
  server.post<{ Body: CreateSessionRequest }>(
    '/api/v1/sessions',
    async (request: FastifyRequest<{ Body: CreateSessionRequest }>, reply: FastifyReply) => {
      const { learnerId, instructorProfileId, subject, topic, learningObjective } = request.body;

      if (!learnerId || !instructorProfileId || !subject || !topic || !learningObjective) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields',
          },
        });
      }

      // TODO: Create session via StorageAdapter
      // For now, placeholder
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return reply.code(201).send({
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
            startedAt: new Date().toISOString(),
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
   * GET /api/v1/sessions/:sessionId
   * 
   * Data Flow:
   * 1. Load session from StorageAdapter (stateless)
   * 2. Return session data
   */
  server.get<{ Params: { sessionId: string } }>(
    '/api/v1/sessions/:sessionId',
    async (request: FastifyRequest<{ Params: { sessionId: string } }>, reply: FastifyReply) => {
      const { sessionId } = request.params;

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
            endedAt: session.endedAt?.toISOString() || null,
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
        },
      });
    }
  );
}
