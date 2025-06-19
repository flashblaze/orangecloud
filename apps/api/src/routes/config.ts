import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod/v4';

import createDb from '../db';
import { configTable } from '../db/schema';
import authMiddleware from '../middlewares/auth';
import type { AuthHonoEnv } from '../types';

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
      return c.json(
        {
          data: null,
          message: 'Unauthorized',
        },
        401
      );
    }

    try {
      const db = createDb(c.env);
      const config = await db
        .select()
        .from(configTable)
        .where(eq(configTable.userId, userId))
        .get();

      if (!config) {
        return c.json({
          data: null,
          message: 'Config not found',
        });
      }

      return c.json({
        data: {
          cloudflareAccountId: config.cloudflareAccountId,
          cloudflareApiToken: config.cloudflareApiToken,
          cloudflareR2AccessKey: config.cloudflareR2AccessKey,
          cloudflareR2SecretKey: config.cloudflareR2SecretKey,
        },
        message: 'Success',
      });
    } catch (error) {
      console.error('Error fetching config:', error);
      return c.json(
        {
          data: null,
          message: 'Internal server error',
        },
        500
      );
    }
  })
  .post(
    '/',
    authMiddleware,
    zValidator('json', saveConfigSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            data: null,
            message: result.error.issues[0].message,
          },
          400
        );
      }
    }),
    async (c) => {
      const userId = c.get('user')?.id;
      const data = c.req.valid('json');

      if (!userId) {
        return c.json(
          {
            data: null,
            message: 'Unauthorized',
          },
          401
        );
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
        } else {
          await db.insert(configTable).values({
            ...data,
            userId,
          });
        }

        return c.json({
          data: {
            cloudflareAccountId: data.cloudflareAccountId,
            cloudflareApiToken: data.cloudflareApiToken,
            cloudflareR2AccessKey: data.cloudflareR2AccessKey,
            cloudflareR2SecretKey: data.cloudflareR2SecretKey,
          },
          message: 'Configuration saved successfully',
        });
      } catch (error) {
        console.error('Error saving config:', error);
        return c.json(
          {
            data: null,
            message: 'Internal server error',
          },
          500
        );
      }
    }
  );

export default configRouter;
