import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

import createDb from '../db';
import { configTable } from '../db/schema';
import type { Env } from '../types/hono-env.types';

export async function getUserConfig(userId: string, env: Env['Bindings']) {
  try {
    const db = createDb(env);
    const userConfig = await db
      .select()
      .from(configTable)
      .where(eq(configTable.userId, userId))
      .get();

    if (!userConfig) {
      throw new HTTPException(400, { message: 'Please configure your Cloudflare settings first' });
    }

    return userConfig;
  } catch (error) {
    throw new HTTPException(500, {
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
