export const logger = {
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    console.error('[ERROR]', message, {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
      context,
      timestamp: new Date().toISOString(),
    });
  },

  info: (message: string, data?: unknown) => {
    console.log('[INFO]', message, {
      data,
      timestamp: new Date().toISOString(),
    });
  },

  warn: (message: string, data?: unknown) => {
    console.warn('[WARN]', message, {
      data,
      timestamp: new Date().toISOString(),
    });
  },
};
