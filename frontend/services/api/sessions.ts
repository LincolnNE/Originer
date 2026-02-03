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
      '/api/v1/sessions',
      request
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create session');
    }
    return response.data;
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
