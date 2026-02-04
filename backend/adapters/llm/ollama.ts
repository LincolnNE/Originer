/**
 * Ollama LLM Adapter
 * 
 * Implements LLMAdapter interface using Ollama for local inference
 * Follows user rules: free, open-source, local execution
 */

import { LLMAdapter, LLMGenerateOptions, LLMResponse } from './types';

export interface OllamaConfig {
  baseUrl?: string; // Default: http://localhost:11434
  model?: string; // Default: llama3.2 or available model
  temperature?: number;
  maxTokens?: number;
}

export class OllamaAdapter implements LLMAdapter {
  private baseUrl: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'llama3.2';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 2048;
  }

  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: options.prompt,
          stream: false,
          options: {
            temperature: options.temperature ?? this.temperature,
            num_predict: options.maxTokens ?? this.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json() as {
        response?: string;
        prompt_eval_count?: number;
        eval_count?: number;
      };
      return {
        content: data.response || '',
        model: this.model,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    } catch (error) {
      throw new Error(`Failed to generate response from Ollama: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async *generateStream(options: LLMGenerateOptions): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: options.prompt,
          stream: true,
          options: {
            temperature: options.temperature ?? this.temperature,
            num_predict: options.maxTokens ?? this.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line) as { response?: string; done?: boolean };
              if (data.response) {
                yield data.response;
              }
              if (data.done) {
                return;
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to stream response from Ollama: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if Ollama is available and list available models
   */
  async checkAvailability(): Promise<{ available: boolean; models?: string[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        return { available: false };
      }

      const data = await response.json() as { models?: Array<{ name: string }> };
      const models = data.models?.map((m) => m.name) || [];
      return { available: true, models };
    } catch {
      return { available: false };
    }
  }
}
