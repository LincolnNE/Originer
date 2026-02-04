/**
 * Learner Routes
 * 
 * According to API Specification & DB Schema document
 * Routes for learner creation and memory retrieval
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DatabaseStorageAdapter } from '../../backend/adapters/storage/database';

interface CreateLearnerRequest {
  name: string;
  level?: string;
}

/**
 * Register learner routes
 */
export async function registerLearnerRoutes(
  server: FastifyInstance,
  storageAdapter: DatabaseStorageAdapter
): Promise<void> {
  /**
   * POST /learners
   * Create a new learner
   */
  server.post<{ Body: CreateLearnerRequest }>(
    '/api/v1/learners',
    async (request: FastifyRequest<{ Body: CreateLearnerRequest }>, reply: FastifyReply) => {
      const { name, level } = request.body;

      if (!name) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required field: name',
          },
        });
      }

      try {
        const learnerId = `learner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await storageAdapter.createLearner({
          id: learnerId,
          name,
          level: level || 'beginner',
        });

        return reply.send({
          success: true,
          data: {
            learner_id: learnerId,
          },
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'CREATION_ERROR',
            message: error.message || 'Failed to create learner',
          },
        });
      }
    }
  );

  /**
   * GET /learners/:id/memory
   * Get learner memory/learning state
   */
  server.get<{ Params: { id: string } }>(
    '/api/v1/learners/:id/memory',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        const memory = await storageAdapter.loadLearnerMemory(id);
        
        if (!memory) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: `Learner not found: ${id}`,
            },
          });
        }

        // Format response according to API spec
        const weakConcepts = memory.weaknesses || [];
        const explanationDepthLevel = 2; // Default, can be calculated from memory

        return reply.send({
          success: true,
          data: {
            weak_concepts: weakConcepts,
            explanation_depth_level: explanationDepthLevel,
            mastered_concepts: memory.learnedConcepts
              .filter(c => c.masteryLevel === 'mastered')
              .map(c => c.concept),
          },
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: error.message || 'Failed to fetch learner memory',
          },
        });
      }
    }
  );
}
