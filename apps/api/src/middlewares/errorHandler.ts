import Cloudflare from 'cloudflare';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { Env } from '../types/hono-env.types';
import { createErrorResponse, handleCloudflareError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, c: Context<Env>) => {
  logger.error('API Error', err, {
    path: c.req.path,
    method: c.req.method,
    userId: c.get('user')?.id,
    sessionId: c.get('session')?.id,
  });

  // Handle Hono's HTTPException
  if (err instanceof HTTPException) {
    const response = err.getResponse();
    // If it's our custom formatted response, return it
    if (response.headers.get('content-type')?.includes('application/json')) {
      return response;
    }
    // Otherwise, format it according to our pattern
    const message = err.message || 'HTTP Exception';
    return c.json(createErrorResponse(message), response.status as any);
  }

  // Handle validation errors from Zod
  if (err.name === 'ZodError') {
    const zodError = err as any;
    const firstError = zodError.issues?.[0];
    const message = firstError?.message || 'Validation error';
    return c.json(createErrorResponse(message), 400);
  }

  // Handle database errors
  if (err.message?.includes('D1_') || err.message?.includes('SQLITE')) {
    logger.error('Database error', err);
    return c.json(createErrorResponse('Database error occurred'), 500);
  }

  // Handle Cloudflare API errors
  if (err instanceof Cloudflare.APIError) {
    const { status, message } = handleCloudflareError(err);
    return c.json(createErrorResponse(message), status as any);
  }

  // Default error
  const isProduction = c.env.ENVIRONMENT === 'production';
  const message = isProduction ? 'Internal server error' : err.message;

  return c.json(createErrorResponse(message), 500);
};
