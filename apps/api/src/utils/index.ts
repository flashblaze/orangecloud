import { AwsClient } from 'aws4fetch';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import type { CookieOptions } from 'hono/utils/cookie';
import { customAlphabet } from 'nanoid';
import createDb from '../db';
import { configTable } from '../db/schema';
import type { AuthHonoEnv } from '../types';
import type { Env } from '../types/hono-env.types';
import { COOKIE_NAME, PASSPHRASE_KEY } from './constants';
import { decryptCredentials, type EncryptionResult } from './crypto';

export const convertDaysToSeconds = (days: number) => 60 * 60 * 24 * days;

export const getCookieName = (environment: string) => {
  return environment === 'production' ? COOKIE_NAME : `${environment}_${COOKIE_NAME}`;
};

export const getCookieOptions = (environment: string) => {
  return {
    secure: environment !== 'local',
    domain: environment !== 'local' ? '.orangecloud.app' : undefined,
    path: '/',
    sameSite: 'Lax',
    maxAge: convertDaysToSeconds(7),
  } as CookieOptions;
};

export const nanoid = customAlphabet(
  '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  24
);

export const createAwsClient = (accessKeyId: string, secretAccessKey: string) => {
  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    region: 'auto',
  });
};

export const getUserConfigRaw = async (userId: string, env: Env['Bindings']) => {
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
};

export const getUserIdOrThrow = (c: Context<AuthHonoEnv>) => {
  const userId = c.get('user')?.id;
  if (!userId) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  return userId;
};

export const getUserConfig = async (
  userId: string,
  env: Env['Bindings'],
  passphrase: string
): Promise<{
  cloudflareAccountId: string;
  cloudflareApiToken: string;
  cloudflareR2AccessKey: string;
  cloudflareR2SecretKey: string;
}> => {
  try {
    const rawConfig = await getUserConfigRaw(userId, env);

    const encryptionResult: EncryptionResult = {
      encryptedCredentials: rawConfig.encryptedCredentials,
      wrappedDek: rawConfig.wrappedDek,
      salt: rawConfig.salt,
      iv: rawConfig.iv,
    };

    try {
      const decrypted = await decryptCredentials(encryptionResult, passphrase);
      return decrypted;
    } catch (error) {
      throw new HTTPException(400, {
        message: 'Invalid passphrase or corrupted data',
        cause: error,
      });
    }
  } catch (error) {
    throw new HTTPException(500, {
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

export const getPassphraseFromCookie = (c: Context<AuthHonoEnv>): string => {
  const passphrase = getCookie(c, PASSPHRASE_KEY);
  if (!passphrase) {
    throw new HTTPException(400, {
      message: `Passphrase required. Please provide ${PASSPHRASE_KEY} cookie.`,
    });
  }
  return passphrase;
};
