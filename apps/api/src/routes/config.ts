import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod/v4';

import Cloudflare from 'cloudflare';
import createDb from '../db';
import { configTable } from '../db/schema';
import authMiddleware from '../middlewares/auth';
import { createValidator } from '../middlewares/validator';
import type { AuthHonoEnv } from '../types';
import { createAwsClient, getUserConfig, getUserIdOrThrow } from '../utils';
import { logger } from '../utils/logger';
import { createSuccessResponse } from '../utils/responses';

const saveConfigSchema = z.object({
  cloudflareAccountId: z.string().min(1, 'Cloudflare Account ID is required'),
  cloudflareApiToken: z.string().min(1, 'Cloudflare API Token is required'),
  cloudflareR2AccessKey: z.string().min(1, 'R2 Access Key is required'),
  cloudflareR2SecretKey: z.string().min(1, 'R2 Secret Key is required'),
});

const checkAccountIdAndToken = async (config: {
  cloudflareAccountId: string;
  cloudflareApiToken: string;
}) => {
  const validation = {
    accountIdOrApiToken: { valid: false, error: null as string | null },
  };

  try {
    const cloudflare = new Cloudflare({
      apiToken: config.cloudflareApiToken,
    });

    await cloudflare.accounts.get({
      account_id: config.cloudflareAccountId,
    });

    validation.accountIdOrApiToken.valid = true;
  } catch (error) {
    logger.error('Invalid Account ID or API Token', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    validation.accountIdOrApiToken.error = 'Invalid Account ID or API Token';
  }

  return validation;
};

const checkR2Credentials = async (config: {
  cloudflareAccountId: string;
  cloudflareApiToken: string;
  cloudflareR2AccessKey: string;
  cloudflareR2SecretKey: string;
}) => {
  const validation = {
    r2Credentials: { valid: false, error: null as string | null },
  };
  try {
    const aws = createAwsClient(config.cloudflareR2AccessKey, config.cloudflareR2SecretKey);

    const url = `https://${config.cloudflareAccountId}.r2.cloudflarestorage.com`;
    const bucketContent = await aws.fetch(url, { method: 'GET' });

    if (bucketContent.ok) {
      validation.r2Credentials.valid = true;
    } else {
      validation.r2Credentials.error = 'Invalid R2 credentials';
    }
  } catch (error) {
    logger.error('Invalid R2 credentials', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    validation.r2Credentials.error = 'Invalid R2 credentials';
  }

  return validation;
};

// Helper function to validate Cloudflare credentials
async function validateCloudflareCredentials(config: {
  cloudflareAccountId: string;
  cloudflareApiToken: string;
  cloudflareR2AccessKey: string;
  cloudflareR2SecretKey: string;
}) {
  const validation = {
    accountIdOrApiToken: { valid: false, error: null as string | null },
    r2Credentials: { valid: false, error: null as string | null },
  };

  try {
    const accountIdAndTokenResult = await checkAccountIdAndToken(config);
    validation.accountIdOrApiToken.valid = accountIdAndTokenResult.accountIdOrApiToken.valid;
    validation.accountIdOrApiToken.error = accountIdAndTokenResult.accountIdOrApiToken.error;

    const r2CredentialsResult = await checkR2Credentials(config);
    validation.r2Credentials.valid = r2CredentialsResult.r2Credentials.valid;
    validation.r2Credentials.error = r2CredentialsResult.r2Credentials.error;
  } catch (error) {
    logger.error('Error validating Cloudflare credentials', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    validation.accountIdOrApiToken.error = 'Error validating Cloudflare credentials';
    validation.r2Credentials.error = 'Error validating Cloudflare credentials';
  }

  return validation;
}

const configRouter = new Hono<AuthHonoEnv>()
  .get('/', authMiddleware, async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const userConfig = await getUserConfig(userId, c.env);

      if (!userConfig) {
        return c.json(createSuccessResponse(null, 'Config not found'));
      }

      const configData = {
        cloudflareAccountId: userConfig.cloudflareAccountId,
        cloudflareApiToken: userConfig.cloudflareApiToken,
        cloudflareR2AccessKey: userConfig.cloudflareR2AccessKey,
        cloudflareR2SecretKey: userConfig.cloudflareR2SecretKey,
      };

      return c.json(createSuccessResponse(configData));
    } catch (error) {
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .get('/check', authMiddleware, async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const userConfig = await getUserConfig(userId, c.env);

      if (!userConfig) {
        throw new HTTPException(404, {
          message: 'Configuration not found. Please save your configuration first.',
        });
      }

      const validation = await validateCloudflareCredentials({
        cloudflareAccountId: userConfig.cloudflareAccountId,
        cloudflareApiToken: userConfig.cloudflareApiToken,
        cloudflareR2AccessKey: userConfig.cloudflareR2AccessKey,
        cloudflareR2SecretKey: userConfig.cloudflareR2SecretKey,
      });

      const allValid = validation.accountIdOrApiToken.valid && validation.r2Credentials.valid;

      return c.json(
        createSuccessResponse(
          {
            valid: allValid,
            details: validation,
            summary: {
              accountIdOrApiToken: validation.accountIdOrApiToken.valid
                ? 'Valid'
                : validation.accountIdOrApiToken.error,
              r2Credentials: validation.r2Credentials.valid
                ? 'Valid'
                : validation.r2Credentials.error,
            },
          },
          allValid ? 'All credentials are valid' : 'Some credentials have issues'
        )
      );
    } catch (error) {
      if (error instanceof Cloudflare.APIError) {
        throw new HTTPException(error.status || 400, {
          message: error.errors[0].message || 'Failed to list buckets',
        });
      }

      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .post('/', authMiddleware, createValidator('json', saveConfigSchema), async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const db = createDb(c.env);
      const userConfig = await db
        .select()
        .from(configTable)
        .where(eq(configTable.userId, userId))
        .get();

      const data = c.req.valid('json');

      if (userConfig) {
        await db.update(configTable).set(data).where(eq(configTable.userId, userId));
      } else {
        await db.insert(configTable).values({
          ...data,
          userId,
        });
      }

      const responseData = {
        cloudflareAccountId: data.cloudflareAccountId,
        cloudflareApiToken: data.cloudflareApiToken,
        cloudflareR2AccessKey: data.cloudflareR2AccessKey,
        cloudflareR2SecretKey: data.cloudflareR2SecretKey,
      };

      return c.json(createSuccessResponse(responseData, 'Configuration saved successfully'));
    } catch (error) {
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .delete('/', authMiddleware, async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const db = createDb(c.env);
      await db.delete(configTable).where(eq(configTable.userId, userId));
      return c.json(createSuccessResponse(null, 'Configuration deleted successfully'));
    } catch (error) {
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

export default configRouter;
