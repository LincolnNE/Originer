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
    cachedServer = await createServer();
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
    // The path segments are in req.query.path as an array
    const pathSegments = req.query.path as string[] | string | undefined;
    let path = '/';
    
    if (Array.isArray(pathSegments)) {
      path = '/' + pathSegments.join('/');
    } else if (typeof pathSegments === 'string') {
      path = '/' + pathSegments;
    } else if (req.url) {
      // Fallback: extract from URL
      const urlMatch = req.url.match(/\/api\/serverless(\/.*)?$/);
      path = urlMatch ? (urlMatch[1] || '/') : '/';
    }
    
    // Ensure path starts with /api/v1 for backend routes
    // If path doesn't start with /api/v1, prepend it
    if (!path.startsWith('/api/v1') && !path.startsWith('/health') && path !== '/') {
      path = '/api/v1' + path;
    }
    
    // Use Fastify's inject method to handle the request
    const response = await server.inject({
      method: req.method || 'GET',
      url: path,
      headers: req.headers as Record<string, string>,
      payload: req.body,
      query: req.query as Record<string, any>,
    });

    // Set response headers
    if (response.headers) {
      Object.keys(response.headers).forEach(key => {
        const value = response.headers[key];
        if (value && typeof value === 'string') {
          res.setHeader(key, value);
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
      } catch {
        res.send(response.payload);
      }
    } else {
      res.send(response.payload);
    }
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An error occurred',
    });
  }
}
