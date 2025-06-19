import type auth from '../utils/auth';

export type Env = {
  Bindings: {
    ENVIRONMENT: string;
    ORANGECLOUD_RATE_LIMIT: RateLimit;
    ORIGIN_URLS: string;
    ORANGECLOUD_DB: D1Database;
    BASE_URL: string;
    TURNSTILE_SECRET_KEY: string;
    TURNSTILE_SITE_KEY: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    BETTER_AUTH_SECRET: string;
  };
  Variables: {
    user: ReturnType<typeof auth>['$Infer']['Session']['user'] | null;
    session: ReturnType<typeof auth>['$Infer']['Session']['session'] | null;
  };
};
