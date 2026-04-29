/**
 * Session API Client
 * 
 * Handles session-related API calls.
 */

import { apiClient } from './client';
import {
  CreateSessionRequest,
  CreateSessionResponse,
  GetSessionResponse,
  ApiResponse,
} from '../../types/api';

/** Backend may return only `session_id`; always expose a full `session` for callers. */
function normalizeCreateSessionResponse(
  request: CreateSessionRequest,
  data: CreateSessionResponse & { session_id?: string }
): CreateSessionResponse {
  if (data.session?.id) {
    return { session: data.session };
  }
  const sessionId = data.session_id;
  if (!sessionId) {
    throw new Error('Invalid create session response: missing session id');
  }
  return {
    session: {
      id: sessionId,
      learnerId: request.learnerId ?? 'anonymous',
      instructorProfileId: request.instructorProfileId,
      subject: request.subject,
      topic: request.topic,
      learningObjective: request.learningObjective,
      sessionState: 'active',
      startedAt: new Date().toISOString(),
    },
  };
}

export const sessionsApi = {
  /**
   * Create a new session
   */
  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    const response = await apiClient.post<
      ApiResponse<CreateSessionResponse & { session_id?: string }>
    >('/api/v1/sessions/start', {
      instructor_id: request.instructorProfileId,
      learner_id: request.learnerId ?? 'anonymous',
      subject: request.subject,
      topic: request.topic,
      learning_objective: request.learningObjective,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create session');
    }
    return normalizeCreateSessionResponse(request, response.data);
  },

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<GetSessionResponse> {
    const response = await apiClient.get<ApiResponse<GetSessionResponse>>(
      `/api/v1/sessions/${sessionId}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get session');
    }
    return response.data;
  },
};
