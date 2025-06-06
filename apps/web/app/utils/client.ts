import * as process from 'node:process';
import { hc } from 'hono/client';
import type { ClientType as ApiType } from '../../../api/src/types';

export const createClient = (headers?: Headers, fromServer = false, apiUrl?: string) => {
  const client = hc<ClientType>(apiUrl || process.env.API_URL, {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      /**
       * Manual cookie handling for Cloudflare compatibility, instead of using credentials: 'include'
       * https://github.com/cloudflare/workers-sdk/issues/2514
       */
      const cookieHeader = headers?.get('Cookie') || '';
      let headersToUse = headers ? Object.fromEntries(headers.entries()) : init?.headers;

      if (cookieHeader) {
        headersToUse = {
          ...headersToUse,
          cookie: cookieHeader,
        };
      }

      try {
        const response = await fetch(input, {
          ...init,
          credentials: fromServer ? undefined : 'include',
          headers: headersToUse,
        });

        return response;
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    },
  });
  return client;
};

export type ClientType = ApiType;
