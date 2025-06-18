import { createAuthClient } from 'better-auth/react';

// Explicitly typing to fix The inferred type of 'authClient' cannot be named without a reference to error
const authClient = (apiUrl: string): ReturnType<typeof createAuthClient> =>
  createAuthClient({
    baseURL: apiUrl,
    basePath: '/auth',
  });

export default authClient;
