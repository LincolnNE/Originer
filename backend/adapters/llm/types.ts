// LLM Adapter interface - LLM-agnostic abstraction

export interface LLMGenerateOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  // TODO: Add other LLM-agnostic parameters as needed
}

export interface LLMResponse {
  content: string;
  model?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
}

export interface LLMAdapter {
  /**
   * Generate a response from the LLM
   * @param options LLM generation options
   * @returns Promise resolving to LLM response
   */
  generate(options: LLMGenerateOptions): Promise<LLMResponse>;

  /**
   * Generate a streaming response from the LLM
   * @param options LLM generation options
   * @returns Async generator yielding stream chunks (strings)
   */
  generateStream(options: LLMGenerateOptions): AsyncGenerator<string, void, unknown>;
}
