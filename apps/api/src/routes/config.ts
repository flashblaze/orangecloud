import Cloudflare from 'cloudflare';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod/v4';
import createDb from '../db';
import { configTable } from '../db/schema';
import authMiddleware from '../middlewares/auth';
import { createValidator } from '../middlewares/validator';
import type { AuthHonoEnv } from '../types';
import {
  createAwsClient,
  getPassphraseFromCookie,
  getUserConfig,
  getUserIdOrThrow,
} from '../utils';
import { logger } from '../utils/logger';
import { createSuccessResponse } from '../utils/responses';

const saveEncryptedConfigSchema = z.object({
  encryptedCredentials: z.string().min(1, 'Encrypted credentials are required'),
  wrappedDek: z.string().min(1, 'Wrapped DEK is required'),
  salt: z.string().min(1, 'Salt is required'),
  iv: z.string().min(1, 'IV is required'),
});

const decryptConfigSchema = z.object({
  passphrase: z.string().min(1, 'Passphrase is required'),
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
      const db = createDb(c.env);
      const userConfig = await db
        .select()
        .from(configTable)
        .where(eq(configTable.userId, userId))
        .get();

      if (!userConfig) {
        return c.json(createSuccessResponse(null, 'Config not found'));
      }

      return c.json(
        createSuccessResponse(
          {
            hasConfig: true,
          },
          'Encrypted config found'
        )
      );
    } catch (error) {
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .post('/decrypt', authMiddleware, createValidator('json', decryptConfigSchema), async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const { passphrase } = c.req.valid('json');
      const userConfig = await getUserConfig(userId, c.env, passphrase);

      if (!userConfig) {
        throw new HTTPException(404, {
          message: 'Configuration not found. Please save your configuration first.',
        });
      }

      return c.json(createSuccessResponse(userConfig, 'Credentials decrypted successfully'));
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .get('/validate', authMiddleware, async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const passphrase = getPassphraseFromCookie(c);
      const userConfig = await getUserConfig(userId, c.env, passphrase);

      if (!userConfig) {
        throw new HTTPException(404, {
          message: 'Configuration not found. Please save your configuration first.',
        });
      }

      const validation = await validateCloudflareCredentials(userConfig);

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
          message: error.errors[0].message || 'Failed to validate credentials',
        });
      }

      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .post('/', authMiddleware, createValidator('json', saveEncryptedConfigSchema), async (c) => {
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

      return c.json(
        createSuccessResponse({ hasConfig: true }, 'Encrypted configuration saved successfully')
      );
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
