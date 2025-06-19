import { zValidator } from '@hono/zod-validator';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { z } from 'zod/v4';

export function createValidator<
  Target extends 'json' | 'query' | 'param' | 'header' | 'cookie',
  T extends z.ZodSchema,
>(target: Target, schema: T) {
  return zValidator(target, schema, (result, _c: Context) => {
    if (!result.success) {
      const firstError = result.error.issues[0];
      throw new HTTPException(400, { message: firstError.message });
    }
  });
}
