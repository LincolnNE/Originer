/**
 * ORIGINER Backend Server
 * 
 * Minimal HTTP server entry point for REST API.
 * 
 * Principles:
 * - Stateless: No in-memory session state
 * - REST API first: Standard HTTP endpoints
 * - Explicit session management: Load from storage on each request
 * - No frontend assumptions: Returns JSON, framework-agnostic
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { SessionOrchestrator } from './core/SessionOrchestrator';
import { PromptAssembler } from './core/PromptAssembler';
import { ResponseValidator } from './core/ResponseValidator';
import { LLMAdapter } from './adapters/llm/types';
import { StorageAdapter } from './adapters/storage/types';

// Request context for tracing and logging
export interface RequestContext {
  requestId: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
}

// Extend Express Request to include context
declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

/**
 * Create Express application with middleware
 */
function createApp(
  sessionOrchestrator: SessionOrchestrator,
  storageAdapter: StorageAdapter
): Express {
  const app = express();

  // Middleware: JSON body parsing
  app.use(express.json());

  // Middleware: Request context (for tracing)
  app.use((req: Request, res: Response, next: NextFunction) => {
    req.context = {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    };
    next();
  });

  // Middleware: CORS (basic, configure properly for production)
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Middleware: Error handling
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[${req.context.requestId}] Error:`, err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
      },
      meta: {
        timestamp: req.context.timestamp.toISOString(),
        requestId: req.context.requestId,
      },
    });
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
      meta: {
        timestamp: req.context.timestamp.toISOString(),
        requestId: req.context.requestId,
      },
    });
  });

  // Example: Start Lesson endpoint
  // This demonstrates the stateless pattern: load session from storage on each request
  app.post('/api/v1/lessons/start', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, screenId, screenType, clientTimestamp } = req.body;

      // Validate request
      if (!sessionId || !screenId || !screenType) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: sessionId, screenId, screenType',
          },
          meta: {
            timestamp: req.context.timestamp.toISOString(),
            requestId: req.context.requestId,
          },
        });
      }

      // STATELESS: Load session from storage (not from memory)
      const session = await storageAdapter.loadSession(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: `Session not found: ${sessionId}`,
          },
          meta: {
            timestamp: req.context.timestamp.toISOString(),
            requestId: req.context.requestId,
          },
        });
      }

      // TODO: Load screen definition, validate prerequisites, etc.
      // For now, return basic response structure

      res.json({
        success: true,
        data: {
          lesson: {
            screenId,
            sessionId,
            screenType,
            state: 'active',
          },
          progress: {
            attempts: 0,
            masteryScore: 0,
            canProceed: false,
          },
          constraints: {
            canSubmit: true,
            nextSubmissionAllowedAt: null,
            remainingAttempts: 5,
          },
        },
        meta: {
          timestamp: req.context.timestamp.toISOString(),
          requestId: req.context.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // Example: Submit Answer endpoint
  // This demonstrates connecting to SessionOrchestrator
  app.post('/api/v1/lessons/:screenId/submit', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { screenId } = req.params;
      const { sessionId, answer } = req.body;

      if (!sessionId || !answer) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required fields: sessionId, answer',
          },
          meta: {
            timestamp: req.context.timestamp.toISOString(),
            requestId: req.context.requestId,
          },
        });
      }

      // STATELESS: Load session from storage
      const session = await storageAdapter.loadSession(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: `Session not found: ${sessionId}`,
          },
          meta: {
            timestamp: req.context.timestamp.toISOString(),
            requestId: req.context.requestId,
          },
        });
      }

      // Connect to SessionOrchestrator
      // Note: This will fail until PromptAssembler and ResponseValidator are implemented
      const instructorResponse = await sessionOrchestrator.processLearnerMessage(
        sessionId,
        answer
      );

      // TODO: Return structured response with progress, constraints, navigation
      // For now, return basic response
      res.json({
        success: true,
        data: {
          feedback: {
            content: instructorResponse,
            type: 'guidance',
          },
          progress: {
            attempts: 1, // TODO: Track from storage
            masteryScore: 0, // TODO: Calculate from storage
            canProceed: false, // TODO: Check constraints
          },
        },
        meta: {
          timestamp: req.context.timestamp.toISOString(),
          requestId: req.context.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return app;
}

/**
 * Start HTTP server
 */
export async function startServer(
  port: number,
  sessionOrchestrator: SessionOrchestrator,
  storageAdapter: StorageAdapter
): Promise<void> {
  const app = createApp(sessionOrchestrator, storageAdapter);

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`ORIGINER backend server listening on port ${port}`);
      resolve();
    });

    server.on('error', (error: Error) => {
      console.error('Server error:', error);
      reject(error);
    });
  });
}
