/**
 * Lesson API Client
 * 
 * Handles lesson-related API calls.
 */

import { apiClient } from './client';
import {
  StartLessonRequest,
  StartLessonResponse,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  RequestHintRequest,
  RequestHintResponse,
  CompleteLessonRequest,
  CompleteLessonResponse,
  ApiResponse,
} from '../../types/api';

export const lessonsApi = {
  /**
   * Start a lesson screen
   */
  async startLesson(request: StartLessonRequest): Promise<StartLessonResponse> {
    const response = await apiClient.post<ApiResponse<StartLessonResponse>>(
      '/api/v1/lessons/start',
      request
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to start lesson');
    }
    return response.data;
  },

  /**
   * Submit answer
   */
  async submitAnswer(
    screenId: string,
    request: SubmitAnswerRequest
  ): Promise<SubmitAnswerResponse> {
    const response = await apiClient.post<ApiResponse<SubmitAnswerResponse>>(
      `/api/v1/lessons/${screenId}/submit`,
      request
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to submit answer');
    }
    return response.data;
  },

  /**
   * Request hint
   */
  async requestHint(
    screenId: string,
    request: RequestHintRequest
  ): Promise<RequestHintResponse> {
    const response = await apiClient.post<ApiResponse<RequestHintResponse>>(
      `/api/v1/lessons/${screenId}/hint`,
      request
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to request hint');
    }
    return response.data;
  },

  /**
   * Complete lesson screen
   */
  async completeLesson(
    screenId: string,
    request: CompleteLessonRequest
  ): Promise<CompleteLessonResponse> {
    const response = await apiClient.post<ApiResponse<CompleteLessonResponse>>(
      `/api/v1/lessons/${screenId}/complete`,
      request
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to complete lesson');
    }
    return response.data;
  },
};
