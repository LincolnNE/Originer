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

export const sessionsApi = {
  /**
   * Create a new session
   */
  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    const response = await apiClient.post<ApiResponse<CreateSessionResponse>>(
      '/api/v1/sessions/start',
      {
        instructor_id: request.instructorProfileId,
        learner_id: request.learnerId,
        subject: request.subject,
        topic: request.topic,
        learning_objective: request.learningObjective,
      }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create session');
    }
    // apiClient returns the full envelope { success, data }; callers expect CreateSessionResponse (data only).
    const { session } = response.data as CreateSessionResponse & {
      session_id?: string;
    };
    if (!session) {
      throw new Error('Failed to create session: missing session in response');
    }
    return { session };
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
