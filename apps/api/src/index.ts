import { cloudflareRateLimiter } from '@hono-rate-limiter/cloudflare';
import { Hono } from 'hono';
import { deleteCookie, getCookie } from 'hono/cookie';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';

import bucketsRouter from './routes/buckets';
import type { Env } from './types/hono-env.types';
import { getCookieName, getCookieOptions } from './utils';

const app = new Hono<Env>();

app.use(
  cloudflareRateLimiter<Env>({
    rateLimitBinding: (c) => c.env.ORANGECLOUD_RATE_LIMIT,
    keyGenerator: (c) => {
      try {
        const cookieData = JSON.parse(getCookie(c, getCookieName(c.env.ENVIRONMENT)) ?? '{}');
        return cookieData.userId ?? c.req.header('CF-Connecting-IP') ?? '';
      } catch (_err) {
        deleteCookie(c, getCookieName(c.env.ENVIRONMENT), getCookieOptions(c.env.ENVIRONMENT));
        return c.json({ message: 'Unauthorized' }, 401);
      }
    },
    handler: (c) => {
      deleteCookie(c, getCookieName(c.env.ENVIRONMENT), getCookieOptions(c.env.ENVIRONMENT));
      return c.json(
        {
          message: 'Rate limit exceeded',
        },
        429
      );
    },
  }),
  (c, next) => {
    const origin = ['https://orangecloud.app', 'https://grove.orangecloud.app'];
    if (c.env.ENVIRONMENT === 'local') {
      origin.push('http://localhost:5173');
    } else if (c.env.ENVIRONMENT === 'development') {
      origin.push('https://dev.grove.orangecloud.app');
    }
    return csrf({
      origin,
    })(c, next);
  },
  (c, next) => {
    const origin = ['https://orangecloud.app', 'https://grove.orangecloud.app'];
    if (c.env.ENVIRONMENT === 'local') {
      origin.push('http://localhost:5173');
    } else if (c.env.ENVIRONMENT === 'development') {
      origin.push('https://dev.grove.orangecloud.app');
    }
    return cors({
      origin,
      credentials: true,
    })(c, next);
  }
);

const routes = app.route('/buckets', bucketsRouter).get('/', async (c) => {
  const token = getCookie(c, getCookieName(c.env.ENVIRONMENT));
  return c.json({
    message: 'Hello!',
    token,
  });
});

export default routes;

export type AppType = typeof routes;
