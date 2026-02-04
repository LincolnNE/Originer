/**
 * Instructor Routes
 * 
 * According to API Specification & DB Schema document
 * Routes for instructor creation, material upload, profile building, and preview
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DatabaseStorageAdapter } from '../../backend/adapters/storage/database';
import { SessionOrchestrator } from '../../backend/core/SessionOrchestrator';

interface CreateInstructorRequest {
  name: string;
  bio?: string;
  tone?: string;
}

interface UploadMaterialRequest {
  type: 'pdf' | 'ppt' | 'code' | 'text';
  content_url?: string;
  content_text?: string;
}

interface PreviewRequest {
  question: string;
}

/**
 * Register instructor routes
 */
export async function registerInstructorRoutes(
  server: FastifyInstance,
  storageAdapter: DatabaseStorageAdapter,
  sessionOrchestrator: SessionOrchestrator
): Promise<void> {
  /**
   * POST /instructors
   * Create a new instructor
   */
  server.post<{ Body: CreateInstructorRequest }>(
    '/api/v1/instructors',
    async (request: FastifyRequest<{ Body: CreateInstructorRequest }>, reply: FastifyReply) => {
      const { name, bio, tone } = request.body;

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
        const instructorId = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await storageAdapter.createInstructor({
          id: instructorId,
          name,
          bio,
          tone: tone || 'friendly',
        });

        return reply.send({
          success: true,
          data: {
            instructor_id: instructorId,
          },
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'CREATION_ERROR',
            message: error.message || 'Failed to create instructor',
          },
        });
      }
    }
  );

  /**
   * POST /instructors/:id/materials
   * Upload teaching materials for an instructor
   */
  server.post<{ Params: { id: string }; Body: UploadMaterialRequest }>(
    '/api/v1/instructors/:id/materials',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UploadMaterialRequest }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { type, content_url, content_text } = request.body;

      if (!type) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required field: type',
          },
        });
      }

      if (!content_url && !content_text) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Either content_url or content_text must be provided',
          },
        });
      }

      try {
        const materialId = `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await storageAdapter.saveInstructorMaterial({
          id: materialId,
          instructorId: id,
          type,
          contentUrl: content_url,
          contentText: content_text,
        });

        return reply.send({
          success: true,
          data: {
            material_id: materialId,
          },
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: error.message || 'Failed to upload material',
          },
        });
      }
    }
  );

  /**
   * POST /instructors/:id/profile/build
   * Build AI instructor profile from materials
   */
  server.post<{ Params: { id: string } }>(
    '/api/v1/instructors/:id/profile/build',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        // TODO: Implement profile building logic
        // - Load instructor materials
        // - Analyze teaching patterns
        // - Extract explanation style
        // - Build instructor profile
        
        // For now, return processing status
        return reply.send({
          success: true,
          data: {
            status: 'processing',
            instructor_id: id,
          },
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'BUILD_ERROR',
            message: error.message || 'Failed to build instructor profile',
          },
        });
      }
    }
  );

  /**
   * POST /instructors/:id/preview
   * Preview AI instructor responses
   */
  server.post<{ Params: { id: string }; Body: PreviewRequest }>(
    '/api/v1/instructors/:id/preview',
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: PreviewRequest }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { question } = request.body;

      if (!question) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required field: question',
          },
        });
      }

      try {
        // Create a temporary session for preview
        const tempSessionId = `preview_${Date.now()}`;
        const tempLearnerId = `temp_learner_${Date.now()}`;
        
        // Create temporary session
        const tempSession = {
          id: tempSessionId,
          instructorId: id,
          learnerId: tempLearnerId,
          instructorProfileId: id,
          subject: 'Preview',
          topic: 'Preview',
          learningObjective: 'Preview AI instructor response',
          sessionState: 'active' as const,
          messageIds: [],
          startedAt: new Date(),
          lastActivityAt: new Date(),
          endedAt: null,
        };

        await storageAdapter.saveSession(tempSession);

        // Generate response
        const response = await sessionOrchestrator.processLearnerMessage(
          tempSessionId,
          question
        );

        // Clean up temporary session
        await storageAdapter.updateSession(tempSessionId, {
          sessionState: 'completed',
          endedAt: new Date(),
        });

        return reply.send({
          success: true,
          data: {
            ai_message: response,
          },
        });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({
          success: false,
          error: {
            code: 'PREVIEW_ERROR',
            message: error.message || 'Failed to generate preview',
          },
        });
      }
    }
  );
}
