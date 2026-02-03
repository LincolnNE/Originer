/**
 * Vercel Serverless Function Wrapper for Fastify Backend
 * 
 * This file wraps the Fastify server to work as a Vercel serverless function.
 * It handles all API routes and proxies them to the Fastify server instance.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from '../src/server';

// Cache the server instance across invocations (Vercel keeps functions warm)
let cachedServer: any = null;

async function getServer() {
  if (!cachedServer) {
    try {
      cachedServer = await createServer();
    } catch (error) {
      console.error('Failed to create server:', error);
      throw error;
    }
  }
  return cachedServer;
}

/**
 * Vercel serverless function handler (catch-all)
 * 
 * This function handles all API requests and routes them through Fastify
 * Path is extracted from the catch-all route parameter
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const server = await getServer();
    
    // Extract path from catch-all route: /api/serverless/[...path]
    // Vercel passes path segments in req.query.path as an array
    const pathSegments = req.query.path as string[] | string | undefined;
    let path = '/';
    
    if (Array.isArray(pathSegments)) {
      // Multiple path segments: ['sessions', '123'] -> '/sessions/123'
      path = '/' + pathSegments.join('/');
    } else if (typeof pathSegments === 'string') {
      // Single path segment: 'sessions' -> '/sessions'
      path = '/' + pathSegments;
    } else if (req.url) {
      // Fallback: extract from full URL
      // Remove query string first
      const urlWithoutQuery = req.url.split('?')[0];
      // Match /api/serverless(/...)?
      const urlMatch = urlWithoutQuery.match(/\/api\/serverless(\/.*)?$/);
      if (urlMatch && urlMatch[1]) {
        path = urlMatch[1];
      }
    }
    
    // Handle special routes that don't need /api/v1 prefix
    if (path === '/health' || path === '/') {
      // Keep as-is for health check and root
    } else if (!path.startsWith('/api/v1')) {
      // Prepend /api/v1 for API routes
      path = '/api/v1' + path;
    }
    
    // Prepare headers (exclude host header which can cause issues)
    const headers: Record<string, string> = {};
    if (req.headers) {
      Object.keys(req.headers).forEach(key => {
        const value = req.headers[key];
        if (value && typeof value === 'string' && key.toLowerCase() !== 'host') {
          headers[key] = value;
        } else if (Array.isArray(value) && value.length > 0) {
          headers[key] = value[0];
        }
      });
    }
    
    // Prepare query parameters (exclude 'path' which is the route parameter)
    const query: Record<string, any> = {};
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (key !== 'path') {
          query[key] = req.query[key];
        }
      });
    }
    
    // Prepare body
    let payload: any = undefined;
    if (req.body) {
      if (typeof req.body === 'string') {
        try {
          payload = JSON.parse(req.body);
        } catch {
          payload = req.body;
        }
      } else {
        payload = req.body;
      }
    }
    
    // Use Fastify's inject method to handle the request
    const response = await server.inject({
      method: req.method || 'GET',
      url: path,
      headers,
      payload,
      query,
    });

    // Set response headers
    if (response.headers) {
      Object.keys(response.headers).forEach(key => {
        const value = response.headers[key];
        if (value) {
          if (typeof value === 'string') {
            res.setHeader(key, value);
          } else if (Array.isArray(value) && value.length > 0) {
            res.setHeader(key, value[0]);
          }
        }
      });
    }

    // Set status code
    res.status(response.statusCode);

    // Send response
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      try {
        const json = typeof response.payload === 'string' 
          ? JSON.parse(response.payload) 
          : response.payload;
        res.json(json);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        res.send(response.payload);
      }
    } else {
      res.send(response.payload);
    }
  } catch (error) {
    console.error('Handler error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error details for debugging
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      url: req.url,
      method: req.method,
      query: req.query,
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? errorMessage : 'An error occurred',
    });
  }
}
