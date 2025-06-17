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
    baseUrl: 'http://localhost:8787',
    trustedOrigins: ['http://localhost:5173'],
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    advanced: {
      cookieDomain: new URL('http://localhost:8787').hostname,
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
