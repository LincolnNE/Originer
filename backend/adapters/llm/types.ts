// LLM Adapter interface - LLM-agnostic abstraction

export interface LLMRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  // TODO: Add other LLM-agnostic parameters as needed
}

export interface LLMResponse {
  content: string;
  finishReason?: string;
  // TODO: Add other LLM-agnostic response fields as needed
}

export interface LLMStreamChunk {
  content: string;
  isComplete: boolean;
  finishReason?: string;
}

export interface LLMAdapter {
  /**
   * Generate a response from the LLM
   * @param request LLM request parameters
   * @returns Promise resolving to LLM response
   */
  generate(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Generate a streaming response from the LLM
   * @param request LLM request parameters (stream must be true)
   * @returns Async generator yielding stream chunks
   */
  generateStream(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;
}
