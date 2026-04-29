/**
 * Service Initialization
 * 
 * Creates and wires together core services:
 * - SessionOrchestrator (uses PromptAssembler, ResponseValidator internally)
 * - PromptAssembler (internal service, used by SessionOrchestrator)
 * - ResponseValidator (used by SessionOrchestrator, can also be middleware)
 */

import fs from 'fs';
import path from 'path';
import { SessionOrchestrator } from '../../backend/core/SessionOrchestrator';
import { PromptAssembler } from '../../backend/core/PromptAssembler';
import { ResponseValidator } from '../../backend/core/ResponseValidator';
import { LLMAdapter } from '../../backend/adapters/llm/types';
import { StorageAdapter } from '../../backend/adapters/storage/types';
import { DatabaseStorageAdapter } from '../../backend/adapters/storage/database';
import { OllamaAdapter } from '../../backend/adapters/llm/ollama';

export interface Services {
  sessionOrchestrator: SessionOrchestrator;
  promptAssembler: PromptAssembler;
  responseValidator: ResponseValidator;
  storageAdapter: StorageAdapter;
  llmAdapter: LLMAdapter;
}

/**
 * Resolve SQLite database file path.
 * When DATABASE_PATH is unset, uses a file under `./data` so data survives process restarts.
 * Set DATABASE_PATH=:memory: explicitly for ephemeral tests only.
 */
export function resolveDatabasePath(): string {
  const env = process.env.DATABASE_PATH;
  if (env !== undefined && env.trim() !== '') {
    return env.trim();
  }
  return path.join(process.cwd(), 'data', 'originer.db');
}

function ensureSqliteParentDirectory(dbPath: string): void {
  if (dbPath === ':memory:') return;
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Initialize all services
 * 
 * Data Flow:
 * StorageAdapter → SessionOrchestrator → PromptAssembler → LLMAdapter
 *                                      → ResponseValidator
 */
export function createServices(): Services {
  // Initialize storage adapter (SQLite for MVP)
  const dbPath = resolveDatabasePath();
  ensureSqliteParentDirectory(dbPath);
  const storageAdapter = new DatabaseStorageAdapter({
    type: 'sqlite',
    connectionString: dbPath,
  });

  // Initialize LLM adapter (Ollama for local inference)
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';
  const llmAdapter = new OllamaAdapter({
    baseUrl: ollamaBaseUrl,
    model: ollamaModel,
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2048', 10),
  });

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
