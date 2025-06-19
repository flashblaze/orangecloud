import Cloudflare from 'cloudflare';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { Env } from '../types/hono-env.types';
import { logger } from '../utils/logger';
import { createErrorResponse, handleCloudflareError } from '../utils/responses';

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
