/**
 * Service Initialization
 * 
 * Creates and wires together core services:
 * - SessionOrchestrator (uses PromptAssembler, ResponseValidator internally)
 * - PromptAssembler (internal service, used by SessionOrchestrator)
 * - ResponseValidator (used by SessionOrchestrator, can also be middleware)
 */

import { SessionOrchestrator } from '../../backend/core/SessionOrchestrator';
import { PromptAssembler } from '../../backend/core/PromptAssembler';
import { ResponseValidator } from '../../backend/core/ResponseValidator';
import { LLMAdapter } from '../../backend/adapters/llm/types';
import { StorageAdapter } from '../../backend/adapters/storage/types';

export interface Services {
  sessionOrchestrator: SessionOrchestrator;
  promptAssembler: PromptAssembler;
  responseValidator: ResponseValidator;
  storageAdapter: StorageAdapter;
  llmAdapter: LLMAdapter;
}

/**
 * Initialize all services
 * 
 * Data Flow:
 * StorageAdapter → SessionOrchestrator → PromptAssembler → LLMAdapter
 *                                      → ResponseValidator
 */
export function createServices(): Services {
  // TODO: Initialize adapters from config/environment
  // For now, placeholders that will throw errors until implemented
  
  const storageAdapter: StorageAdapter = {
    loadSession: async () => {
      throw new Error('StorageAdapter.loadSession not implemented');
    },
    saveSession: async () => {
      throw new Error('StorageAdapter.saveSession not implemented');
    },
    updateSession: async () => {
      throw new Error('StorageAdapter.updateSession not implemented');
    },
    loadInstructorProfile: async () => {
      throw new Error('StorageAdapter.loadInstructorProfile not implemented');
    },
    loadLearnerMemory: async () => {
      throw new Error('StorageAdapter.loadLearnerMemory not implemented');
    },
    saveLearnerMemory: async () => {
      throw new Error('StorageAdapter.saveLearnerMemory not implemented');
    },
    loadMessage: async () => {
      throw new Error('StorageAdapter.loadMessage not implemented');
    },
    loadMessages: async () => {
      throw new Error('StorageAdapter.loadMessages not implemented');
    },
    saveMessage: async () => {
      throw new Error('StorageAdapter.saveMessage not implemented');
    },
  };

  const llmAdapter: LLMAdapter = {
    generate: async () => {
      throw new Error('LLMAdapter.generate not implemented');
    },
    async *generateStream() {
      throw new Error('LLMAdapter.generateStream not implemented');
    },
  };

  // Initialize core services
  const promptAssembler = new PromptAssembler(
    process.env.PROMPT_CONFIG_PATH || 'config/prompts'
  );
  
  const responseValidator = new ResponseValidator();
  
  const sessionOrchestrator = new SessionOrchestrator(
    promptAssembler,      // Used internally for prompt assembly
    responseValidator,    // Used internally for response validation
    llmAdapter,
    storageAdapter
  );

  return {
    sessionOrchestrator,
    promptAssembler,
    responseValidator,
    storageAdapter,
    llmAdapter,
  };
}
