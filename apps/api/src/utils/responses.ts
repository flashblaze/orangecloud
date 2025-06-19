import Cloudflare from 'cloudflare';

export interface ApiResponse<T = any> {
  data: T | null;
  message: string;
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
