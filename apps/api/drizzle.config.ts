import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// https://github.com/neondatabase-labs/cloudflare-drizzle-neon/blob/main/migrate.ts
config({ path: '.dev.vars' });

/**
 * LOCAL_DB_PATH is set when running `bun run db:studio`
 * https://kevinkipp.com/blog/going-full-stack-on-astro-with-cloudflare-d1-and-drizzle/
 * https://github.com/drizzle-team/drizzle-orm/discussions/1545#discussioncomment-8689233
 */

export default process.env.LOCAL_DB_PATH
  ? {
      schema: './src/db/schema/index.ts',
      dialect: 'sqlite',
      dbCredentials: {
        url: process.env.LOCAL_DB_PATH,
      },
    }
  : defineConfig({
      schema: './src/db/schema/index.ts',
      dialect: 'sqlite',
      out: './drizzle/migrations',
      driver: 'd1-http',
    });
