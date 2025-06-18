export type Env = {
  Bindings: {
    ENVIRONMENT: string;
    ORANGECLOUD_RATE_LIMIT: RateLimit;
    CLOUDFLARE_API_TOKEN: string;
    CLOUDFLARE_ACCOUNT_ID: string;
    CLOUDFLARE_R2_ACCESS_KEY: string;
    CLOUDFLARE_R2_SECRET_KEY: string;
    ORIGIN_URLS: string;
    ORANGECLOUD_DB: D1Database;
    BASE_URL: string;
    TURNSTILE_SECRET_KEY: string;
    TURNSTILE_SITE_KEY: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  };
};
