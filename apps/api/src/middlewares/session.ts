import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

import type { Env } from '../types/hono-env.types';
import auth from '../utils/auth';

const sessionMiddleware = createMiddleware(async (c: Context<Env>, next) => {
  const authInstance = auth(c.env);
  const session = await authInstance.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set('user', null);
    c.set('session', null);
    return next();
  }

  c.set('user', session.user);
  c.set('session', session.session);
  await next();
});

export default sessionMiddleware;
