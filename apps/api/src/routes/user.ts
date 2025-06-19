import { Hono } from 'hono';
import z from 'zod/v4';

import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import createDb from '../db';
import { userTable } from '../db/schema';
import authMiddleware from '../middlewares/auth';
import { createValidator } from '../middlewares/validator';
import type { AuthHonoEnv } from '../types';
import { getUserIdOrThrow } from '../utils';
import { createSuccessResponse } from '../utils/responses';

const userRouter = new Hono<AuthHonoEnv>().patch(
  '/view-mode',
  authMiddleware,
  createValidator(
    'json',
    z.object({
      filesViewMode: z.enum(['list', 'grid'], {
        error: 'Invalid value',
      }),
    })
  ),
  async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const { filesViewMode } = c.req.valid('json');
      const db = createDb(c.env);

      await db
        .update(userTable)
        .set({
          filesViewMode,
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, userId));

      return c.json(createSuccessResponse({ filesViewMode }));
    } catch (error) {
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
);

export default userRouter;
