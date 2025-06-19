import { zValidator } from '@hono/zod-validator';
import type { Context, MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { z } from 'zod';

type ValidationTarget = Parameters<typeof zValidator>[0];

export const createValidator = <T extends z.ZodSchema>(
  target: ValidationTarget,
  schema: T
): MiddlewareHandler => {
  return zValidator(target, schema, (result, _c: Context) => {
    if (!result.success) {
      const firstError = result.error.issues[0];
      throw new HTTPException(400, { message: firstError.message });
    }
  });
};
