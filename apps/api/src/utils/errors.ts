import Cloudflare from 'cloudflare';

export interface ApiResponse<T = any> {
  data: T | null;
  message: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = 'Rate limit exceeded') {
    super(429, message);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error') {
    super(500, message, false);
  }
}

// Helper to create error response
export const createErrorResponse = (message: string): ApiResponse => ({
  data: null,
  message,
});

// Helper to create success response
export const createSuccessResponse = <T>(data: T, message = 'Success'): ApiResponse<T> => ({
  data,
  message,
});

// Helper to handle Cloudflare API errors (this one still needs special handling)
export const handleCloudflareError = (error: unknown): { status: number; message: string } => {
  if (error instanceof Cloudflare.APIError) {
    const message = error.errors?.[0]?.message || 'Cloudflare API error';
    const status = error.status || 500;

    return { status, message };
  }

  return { status: 500, message: 'Internal server error' };
};
