import { eq } from 'drizzle-orm';

import createDb from '../db';
import { configTable } from '../db/schema';
import type { Env } from '../types/hono-env.types';

export async function getUserConfig(userId: string, env: Env['Bindings']) {
  const db = createDb(env);
  const userConfig = await db
    .select()
    .from(configTable)
    .where(eq(configTable.userId, userId))
    .get();

  if (!userConfig) {
    throw new Error('Please configure your Cloudflare settings first');
  }

  return userConfig;
}
