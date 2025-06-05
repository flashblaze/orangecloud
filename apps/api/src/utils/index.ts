import type { CookieOptions } from 'hono/utils/cookie';
import { customAlphabet } from 'nanoid';

import type {} from '../types';
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
