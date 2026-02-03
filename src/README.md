# ORIGINER Backend Server

Minimal HTTP server setup using Fastify.

## Framework Choice: Fastify

**Why Fastify over Express?**

1. **Better TypeScript Support**: Built-in TypeScript types, no need for `@types/fastify`
2. **Built-in JSON Schema Validation**: Perfect for API contracts - validate requests/responses automatically
3. **Performance**: ~2x faster than Express (important for AI workloads)
4. **Modern Async/Await**: No callback hell, cleaner code
5. **Plugin Architecture**: Better code organization with plugins
6. **Built-in Logging**: Pino logger included, better observability
7. **Schema-based**: Request/response validation reduces bugs

**Trade-offs:**
- Smaller ecosystem than Express (but sufficient for our needs)
- Less Stack Overflow answers (but better documentation)

## File Structure

```
src/
└── server.ts          # Server entry point (this file)
```

## Running the Server

```bash
# Development (with hot reload via ts-node)
npm run dev

# Production (after build)
npm run build
npm start
```

## Environment Variables

- `PORT`: Server port (default: 4094)
- `HOST`: Server host (default: 0.0.0.0)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level (default: info)
- `CORS_ORIGIN`: CORS allowed origin (default: *)

## Endpoints

### GET /health
Health check endpoint. Returns server status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-02T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

### GET /
Root endpoint. Returns API information.

**Response:**
```json
{
  "name": "ORIGINER API",
  "version": "0.1.0",
  "status": "running"
}
```

## Next Steps

1. Add API routes (lessons, sessions, etc.)
2. Add authentication middleware
3. Add request validation schemas
4. Add rate limiting
5. Add error handling for specific error types
6. Add request ID middleware for tracing
