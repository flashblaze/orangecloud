import { AwsClient } from 'aws4fetch';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import type { CookieOptions } from 'hono/utils/cookie';
import { customAlphabet } from 'nanoid';

import type { Context } from 'hono';
import createDb from '../db';
import { configTable } from '../db/schema';
import type { AuthHonoEnv } from '../types';
import type { Env } from '../types/hono-env.types';
import { COOKIE_NAME } from './constants';

export const convertDaysToSeconds = (days: number) => 60 * 60 * 24 * days;

export const getCookieName = (environment: string) => {
  return environment === 'production' ? COOKIE_NAME : `${environment}_${COOKIE_NAME}`;
};

export const getCookieOptions = (environment: string) => {
  return {
    // httpOnly: true,
    secure: environment !== 'local',
    domain: environment !== 'local' ? '.orangecloud.app' : undefined,
    path: '/',
    sameSite: 'Lax',
    maxAge: convertDaysToSeconds(7),
  } as CookieOptions;
};

export const generateUuid = (length = 24) => {
  const nanoid = customAlphabet(
    '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_',
    length
  );
  return nanoid();
};

export const setCookieData = (sessionId: string, userId: string) => {
  const dataToStore = {
    sessionId,
    userId,
  };

  return JSON.stringify(dataToStore);
};

export const createAwsClient = (accessKeyId: string, secretAccessKey: string) => {
  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    region: 'auto',
  });
};

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

export const getUserIdOrThrow = (c: Context<AuthHonoEnv>) => {
  const userId = c.get('user')?.id;
  if (!userId) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  return userId;
};
