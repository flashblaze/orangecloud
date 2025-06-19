import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import type { Env } from '../types/hono-env.types';

const authMiddleware = createMiddleware(async (c: Context<Env>, next) => {
  const user = c.get('user');

  if (!user) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  await next();
});

export default authMiddleware;
