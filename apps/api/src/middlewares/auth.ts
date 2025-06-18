import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

import type { Env } from '../types/hono-env.types';

const authMiddleware = createMiddleware(async (c: Context<Env>, next) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
});

export default authMiddleware;
