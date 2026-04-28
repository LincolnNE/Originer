/**
 * Session API Client
 * 
 * Handles session-related API calls.
 */

import { apiClient } from './client';
import { CreateSessionRequest, GetSessionResponse, ApiResponse } from '../../types/api';

export const sessionsApi = {
  /**
   * Create a new session (POST /api/v1/sessions/start) then load full session (GET /api/v1/sessions/:id).
   */
  async createSession(request: CreateSessionRequest): Promise<GetSessionResponse> {
    const start = await apiClient.post<ApiResponse<{ session_id: string }>>(
      '/api/v1/sessions/start',
      {
        instructor_id: request.instructorProfileId,
        learner_id: request.learnerId ?? 'anonymous',
        subject: request.subject,
        topic: request.topic,
        learning_objective: request.learningObjective,
      }
    );
    if (!start.success || !start.data?.session_id) {
      throw new Error(start.error?.message || 'Failed to create session');
    }
    return sessionsApi.getSession(start.data.session_id);
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
