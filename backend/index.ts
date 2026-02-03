/**
 * ORIGINER Backend Entry Point
 * 
 * Initializes adapters and core services, then starts HTTP server.
 */

import { startServer } from './server';
import { SessionOrchestrator } from './core/SessionOrchestrator';
import { PromptAssembler } from './core/PromptAssembler';
import { ResponseValidator } from './core/ResponseValidator';
import { LLMAdapter } from './adapters/llm/types';
import { StorageAdapter } from './adapters/storage/types';

// TODO: Import actual adapter implementations
// For now, these are placeholders that will fail at runtime
// until adapters are implemented

async function main() {
  const port = parseInt(process.env.PORT || '3000', 10);

  // TODO: Initialize adapters from environment/config
  // const llmAdapter = createLLMAdapter(process.env.LLM_PROVIDER);
  // const storageAdapter = createStorageAdapter(process.env.STORAGE_TYPE);

  // Placeholder adapters (will throw errors until implemented)
  const llmAdapter: LLMAdapter = {
    generate: async () => {
      throw new Error('LLM adapter not implemented');
    },
    async *generateStream() {
      throw new Error('LLM adapter streaming not implemented');
    },
  };

  const storageAdapter: StorageAdapter = {
    loadSession: async () => {
      throw new Error('Storage adapter not implemented');
    },
    saveSession: async () => {
      throw new Error('Storage adapter not implemented');
    },
    updateSession: async () => {
      throw new Error('Storage adapter not implemented');
    },
    loadInstructorProfile: async () => {
      throw new Error('Storage adapter not implemented');
    },
    loadLearnerMemory: async () => {
      throw new Error('Storage adapter not implemented');
    },
    saveLearnerMemory: async () => {
      throw new Error('Storage adapter not implemented');
    },
    loadMessage: async () => {
      throw new Error('Storage adapter not implemented');
    },
    loadMessages: async () => {
      throw new Error('Storage adapter not implemented');
    },
    saveMessage: async () => {
      throw new Error('Storage adapter not implemented');
    },
  };

  // Initialize core services
  const promptAssembler = new PromptAssembler(process.env.PROMPT_CONFIG_PATH || 'config/prompts');
  const responseValidator = new ResponseValidator();
  const sessionOrchestrator = new SessionOrchestrator(
    promptAssembler,
    responseValidator,
    llmAdapter,
    storageAdapter
  );

  // Start HTTP server
  await startServer(port, sessionOrchestrator, storageAdapter);
}

// Run server
if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
