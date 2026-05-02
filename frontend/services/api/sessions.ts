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
    const learnerId =
      request.learnerId ||
      `learner_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const response = await apiClient.post<
      ApiResponse<CreateSessionResponse & { session_id?: string }>
    >('/api/v1/sessions/start', {
      instructor_id: request.instructorProfileId,
      learner_id: learnerId,
      subject: request.subject,
      topic: request.topic,
      learning_objective: request.learningObjective,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create session');
    }
    const data = response.data;
    if (!data.session && data.session_id) {
      return {
        session: {
          id: data.session_id,
          learnerId,
          instructorProfileId: request.instructorProfileId,
          subject: request.subject,
          topic: request.topic,
          learningObjective: request.learningObjective,
          sessionState: 'active',
          startedAt: new Date().toISOString(),
        },
      };
    }
    return data;
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
