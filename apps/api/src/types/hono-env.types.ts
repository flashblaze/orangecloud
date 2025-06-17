export type Env = {
  Bindings: {
    ENVIRONMENT: string;
    ORANGECLOUD_RATE_LIMIT: RateLimit;
    CLOUDFLARE_API_TOKEN: string;
    CLOUDFLARE_ACCOUNT_ID: string;
    CLOUDFLARE_R2_ACCESS_KEY: string;
    CLOUDFLARE_R2_SECRET_KEY: string;
    VALID_ORIGIN_URLS: string;
    ORANGECLOUD_DB: D1Database;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
  };
};
