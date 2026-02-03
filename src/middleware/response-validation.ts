/**
 * Response Validation Middleware
 * 
 * Optional middleware to validate instructor responses before sending to client.
 * 
 * Note: ResponseValidator is already used internally by SessionOrchestrator,
 * but this middleware can provide additional validation at the HTTP layer.
 * 
 * Data Flow:
 * HTTP Response → ResponseValidator → HTTP Response (validated)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { ResponseValidator } from '../../backend/core/ResponseValidator';

/**
 * Middleware to validate instructor responses
 * 
 * This is optional - ResponseValidator is already used by SessionOrchestrator.
 * This middleware provides an additional validation layer at the HTTP boundary.
 */
export async function validateInstructorResponse(
  request: FastifyRequest,
  reply: FastifyReply,
  responseValidator: ResponseValidator,
  response: string,
  session: any,
  instructorProfile: any,
  learnerMessage: string
): Promise<boolean> {
  // Validate response using ResponseValidator
  const validationResult = responseValidator.validate({
    response,
    session,
    instructorProfile,
    learnerMessage,
  });

  if (!validationResult.isValid) {
    request.log.warn({
      violations: validationResult.violations,
      action: validationResult.action,
    }, 'Response validation failed');

    // If critical violation, reject response
    if (validationResult.action === 'REJECT') {
      return false;
    }

    // For REGENERATE/RETRY, log but allow response (SessionOrchestrator should handle)
    // In production, might want to regenerate here
  }

  return true;
}

/**
 * Fastify hook to validate responses
 * 
 * Example usage in route handler:
 * 
 * const isValid = await validateInstructorResponse(
 *   request,
 *   reply,
 *   responseValidator,
 *   instructorResponse,
 *   session,
 *   instructorProfile,
 *   learnerAnswer
 * );
 */
export { validateInstructorResponse as default };
