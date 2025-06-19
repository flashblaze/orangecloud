import { cloudflareRateLimiter } from '@hono-rate-limiter/cloudflare';
import { Hono } from 'hono';
import { deleteCookie, getCookie } from 'hono/cookie';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';

import { errorHandler } from './middlewares/errorHandler';
import sessionMiddleware from './middlewares/session';
import bucketsRouter from './routes/buckets';
import configRouter from './routes/config';
import type { Env } from './types/hono-env.types';
import { getCookieName, getCookieOptions } from './utils';
import auth from './utils/auth';

const app = new Hono<Env>();

app.onError(errorHandler);

app.use(
  cloudflareRateLimiter<Env>({
    rateLimitBinding: (c) => c.env.ORANGECLOUD_RATE_LIMIT,
    keyGenerator: (c) => {
      try {
        const cookieData = JSON.parse(getCookie(c, getCookieName(c.env.ENVIRONMENT)) ?? '{}');
        return cookieData.userId ?? c.req.header('CF-Connecting-IP') ?? '';
      } catch {
        deleteCookie(c, getCookieName(c.env.ENVIRONMENT), getCookieOptions(c.env.ENVIRONMENT));
        throw new HTTPException(401, { message: 'Unauthorized' });
      }
    },
    handler: (c) => {
      deleteCookie(c, getCookieName(c.env.ENVIRONMENT), getCookieOptions(c.env.ENVIRONMENT));
      throw new HTTPException(429, { message: 'Rate limit exceeded' });
    },
  }),
  (c, next) => {
    const origin = c.env.ORIGIN_URLS.split(',');
    return csrf({
      origin,
    })(c, next);
  },
  (c, next) => {
    const origin = c.env.ORIGIN_URLS.split(',');
    return cors({
      origin,
      credentials: true,
    })(c, next);
  }
);

app.use('*', sessionMiddleware);

const routes = app
  .route('/buckets', bucketsRouter)
  .route('/config', configRouter)
  .all('/auth/*', (c) => auth(c.env).handler(c.req.raw))
  .get('/session', async (c) => {
    const session = await auth(c.env).api.getSession(c.req.raw);
    return c.json(session);
  })
  .get('/', async (c) => {
    return c.json({
      message: 'Hello!',
    });
  });

export default routes;

export type AppType = typeof routes;
