import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod/v4';

import createDb from '../db';
import { configTable } from '../db/schema';
import authMiddleware from '../middlewares/auth';
import type { AuthHonoEnv } from '../types';
import { createSuccessResponse } from '../utils/errors';
import { logger } from '../utils/logger';

const saveConfigSchema = z.object({
  cloudflareAccountId: z.string().min(1, 'Cloudflare Account ID is required'),
  cloudflareApiToken: z.string().min(1, 'Cloudflare API Token is required'),
  cloudflareR2AccessKey: z.string().min(1, 'R2 Access Key is required'),
  cloudflareR2SecretKey: z.string().min(1, 'R2 Secret Key is required'),
});

const configRouter = new Hono<AuthHonoEnv>()
  .get('/', authMiddleware, async (c) => {
    const userId = c.get('user')?.id;

    if (!userId) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    try {
      const db = createDb(c.env);
      const config = await db
        .select()
        .from(configTable)
        .where(eq(configTable.userId, userId))
        .get();

      if (!config) {
        return c.json(createSuccessResponse(null, 'Config not found'));
      }

      const configData = {
        cloudflareAccountId: config.cloudflareAccountId,
        cloudflareApiToken: config.cloudflareApiToken,
        cloudflareR2AccessKey: config.cloudflareR2AccessKey,
        cloudflareR2SecretKey: config.cloudflareR2SecretKey,
      };

      return c.json(createSuccessResponse(configData));
    } catch (error) {
      logger.error('Error fetching config:', error, { userId });
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  })
  .post(
    '/',
    authMiddleware,
    zValidator('json', saveConfigSchema, (result, _c) => {
      if (!result.success) {
        throw new HTTPException(400, { message: result.error.issues[0].message });
      }
    }),
    async (c) => {
      const userId = c.get('user')?.id;
      const data = c.req.valid('json');

      if (!userId) {
        throw new HTTPException(401, { message: 'Unauthorized' });
      }

      try {
        const db = createDb(c.env);

        const existingConfig = await db
          .select()
          .from(configTable)
          .where(eq(configTable.userId, userId))
          .get();

        if (existingConfig) {
          await db.update(configTable).set(data).where(eq(configTable.userId, userId));
          logger.info('Config updated', { userId });
        } else {
          await db.insert(configTable).values({
            ...data,
            userId,
          });
          logger.info('Config created', { userId });
        }

        const responseData = {
          cloudflareAccountId: data.cloudflareAccountId,
          cloudflareApiToken: data.cloudflareApiToken,
          cloudflareR2AccessKey: data.cloudflareR2AccessKey,
          cloudflareR2SecretKey: data.cloudflareR2SecretKey,
        };

        return c.json(createSuccessResponse(responseData, 'Configuration saved successfully'));
      } catch (error) {
        logger.error('Error saving config:', error, { userId });
        throw new HTTPException(500, { message: 'Internal server error' });
      }
    }
  );

export default configRouter;
