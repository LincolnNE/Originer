/**
 * ORIGINER Backend Server
 * 
 * Minimal HTTP server entry point.
 * 
 * Framework Choice: Fastify
 * - Better TypeScript support with built-in types
 * - Built-in JSON schema validation (useful for API contracts)
 * - Faster performance (~2x faster than Express)
 * - Better async/await support (no callback hell)
 * - Modern plugin architecture
 * - Built-in request logging
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createServices, Services } from './services';
import { registerLessonRoutes } from './routes/lessons';
import { registerSessionRoutes } from './routes/sessions';

/**
 * Create and configure Fastify server instance
 * 
 * Data Flow:
 * Server Creation → Service Initialization → Route Registration → Server Ready
 */
async function createServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' 
        ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' } }
        : undefined,
    },
  });

  // Register CORS plugin (basic configuration)
  await server.register(require('@fastify/cors'), {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Initialize services
  // This creates SessionOrchestrator, PromptAssembler, ResponseValidator, and adapters
  const services = createServices();

  // Register API routes
  // Lesson routes use SessionOrchestrator (which uses PromptAssembler and ResponseValidator internally)
  await registerLessonRoutes(server, services.sessionOrchestrator, services.storageAdapter);
  
  // Session routes use StorageAdapter directly
  await registerSessionRoutes(server, services.storageAdapter);

  // Health check endpoint
  server.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      };
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0c662f85-e502-4845-87fd-af769992dabf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:64',message:'Health check request',data:{accept:request.headers.accept,userAgent:request.headers['user-agent'],url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      request.log.info({ path: '/health', method: 'GET', accept: request.headers.accept }, 'Health check requested');
      
      // Check if browser request (wants HTML) - browsers send Accept: text/html,application/xhtml+xml,...
      const acceptHeader = (request.headers.accept || '').toLowerCase();
      const isBrowserRequest = acceptHeader.includes('text/html') || 
                               acceptHeader.includes('application/xhtml') ||
                               !acceptHeader.includes('application/json');
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0c662f85-e502-4845-87fd-af769992dabf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:72',message:'Browser detection',data:{acceptHeader,isBrowserRequest},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      if (isBrowserRequest) {
        reply.type('text/html');
        const htmlResponse = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ORIGINER API Health</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #4CAF50; margin-top: 0; }
    pre { background: #f9f9f9; padding: 15px; border-radius: 4px; overflow-x: auto; border: 1px solid #e0e0e0; }
    .status { display: inline-block; padding: 4px 8px; background: #4CAF50; color: white; border-radius: 4px; font-size: 12px; margin-left: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✅ ORIGINER API Health Check<span class="status">HEALTHY</span></h1>
    <pre>${JSON.stringify(response, null, 2)}</pre>
    <p style="color: #666; font-size: 14px; margin-top: 20px;">
      Server is running on port 4094. API endpoints are available at <code>/api/v1/*</code>
    </p>
  </div>
</body>
</html>`;
        
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/0c662f85-e502-4845-87fd-af769992dabf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:95',message:'Returning HTML response',data:{htmlLength:htmlResponse.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        return htmlResponse;
      }
      
      // JSON response for API clients
      reply.type('application/json');
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0c662f85-e502-4845-87fd-af769992dabf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:103',message:'Returning JSON response',data:{response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      return response;
    } catch (error) {
      request.log.error({ error }, 'Health check failed');
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/0c662f85-e502-4845-87fd-af769992dabf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server.ts:108',message:'Health check error',data:{error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      reply.code(500).send({
        status: 'error',
        message: 'Health check failed',
      });
    }
  });

  // Root endpoint
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.type('application/json');
    return {
      name: 'ORIGINER API',
      version: '0.1.0',
      status: 'running',
    };
  });

  // 404 handler
  server.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  // Global error handler
  server.setErrorHandler(async (error: any, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error(error);
    
    const statusCode = error.statusCode || 500;
    reply.code(statusCode).send({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
    });
  });

  return server;
}

/**
 * Start the server
 */
async function start() {
  try {
    const server = await createServer();
    const port = parseInt(process.env.PORT || '4094', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    
    console.log(`🚀 ORIGINER backend server running on http://${host}:${port}`);
    console.log(`📊 Health check: http://${host}:${port}/health`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  start();
}

export { createServer, start };
