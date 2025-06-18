import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import db from '../db';
import { account, session, user, verification } from '../db/schema';
import type { Env } from '../types/hono-env.types';

const auth = (env: Env['Bindings']) =>
  betterAuth({
    database: drizzleAdapter(db(env), {
      provider: 'sqlite',
      schema: {
        user,
        session,
        account,
        verification,
      },
    }),
    basePath: '/auth',
    baseUrl: env.BASE_URL,
    trustedOrigins: env.ORIGIN_URLS.split(','),
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    advanced: {
      cookieDomain: new URL(env.BASE_URL).hostname,
      useSecureCookies: env.ENVIRONMENT === 'production',
      sameSite: 'lax',
      cookiePrefix: 'orangecloud',
      crossSubDomainCookies: {
        enabled: true,
        domain: env.ENVIRONMENT === 'production' ? 'orangecloud.app' : 'localhost',
      },
    },
    emailAndPassword: {
      enabled: true,
    },
  });

export default auth;
