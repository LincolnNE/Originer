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
   * Create a new session (POST /api/v1/sessions/start)
   */
  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    const response = await apiClient.post<
      ApiResponse<{ session_id: string }>
    >('/api/v1/sessions/start', {
      instructor_id: request.instructorProfileId,
      learner_id: request.learnerId ?? 'default',
      subject: request.subject,
      topic: request.topic,
      learning_objective: request.learningObjective,
    });
    if (!response.success || !response.data?.session_id) {
      throw new Error(response.error?.message || 'Failed to create session');
    }
    const sid = response.data.session_id;
    return {
      session: {
        id: sid,
        learnerId: request.learnerId ?? 'default',
        instructorProfileId: request.instructorProfileId,
        subject: request.subject,
        topic: request.topic,
        learningObjective: request.learningObjective,
        sessionState: 'active',
        startedAt: new Date().toISOString(),
      },
    };
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
