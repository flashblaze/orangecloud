import Cloudflare from 'cloudflare';

import type { Config } from '../db/schema';
import { logger } from './logger';

export interface CorsCheckResult {
  isConfigured: boolean;
  hasRequiredOrigins: boolean;
  missingOrigins: string[];
  currentRules: Cloudflare.R2.Buckets.CORS.CORSGetResponse['rules'];
}

export interface EnsureCorsResult {
  configured: boolean;
  message: string;
  hasRequiredOrigins: boolean;
}

/**
 * Get required origins from environment
 */
export function getRequiredOrigins(env: { ORIGIN_URLS?: string; BASE_URL?: string }): string[] {
  const origins: string[] = [];

  if (env.ORIGIN_URLS) {
    origins.push(...env.ORIGIN_URLS.split(',').map((url) => url.trim()));
  }

  if (env.BASE_URL) {
    origins.push(env.BASE_URL.trim());
  }

  return origins;
}

/**
 * Check if a bucket has proper CORS configuration for required origins
 */
export async function checkBucketCors(
  bucketName: string,
  userConfig: Config,
  requiredOrigins: string[]
): Promise<CorsCheckResult> {
  try {
    const cloudflare = new Cloudflare({
      apiToken: userConfig.cloudflareApiToken,
    });

    const response = await cloudflare.r2.buckets.cors.get(bucketName, {
      account_id: userConfig.cloudflareAccountId,
    });

    const rules = response.rules || [];

    // Check if all required origins are present in any rule
    const allConfiguredOrigins = new Set<string>();

    for (const rule of rules) {
      for (const origin of rule.allowed.origins) {
        allConfiguredOrigins.add(origin);
        // Also check for wildcard
        if (origin === '*') {
          // Wildcard covers all origins
          requiredOrigins.forEach((req) => allConfiguredOrigins.add(req));
        }
      }
    }

    const missingOrigins = requiredOrigins.filter((origin) => !allConfiguredOrigins.has(origin));

    return {
      isConfigured: rules.length > 0,
      hasRequiredOrigins: missingOrigins.length === 0,
      missingOrigins,
      currentRules: rules,
    };
  } catch (error) {
    if (error instanceof Cloudflare.APIError && error.status === 404) {
      // No CORS policy configured
      return {
        isConfigured: false,
        hasRequiredOrigins: false,
        missingOrigins: requiredOrigins,
        currentRules: [],
      };
    }
    throw error;
  }
}

/**
 * Generate a basic CORS rule for the required origins
 */
export function generateBasicCorsRule(
  requiredOrigins: string[]
): NonNullable<CorsCheckResult['currentRules']>[number] {
  return {
    id: 'OrangeCloud Basic CORS',
    allowed: {
      methods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      origins: requiredOrigins,
      headers: ['*'],
    },
    exposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
    maxAgeSeconds: 3600,
  };
}

/**
 * Ensure bucket has proper CORS configuration, auto-configuring if needed
 */
export async function ensureBucketCors(
  bucketName: string,
  userConfig: Config,
  env: { ORIGIN_URLS?: string; BASE_URL?: string }
): Promise<EnsureCorsResult> {
  const requiredOrigins = getRequiredOrigins(env);
  const corsStatus = await checkBucketCors(bucketName, userConfig, requiredOrigins);

  let corsMessage = '';
  let corsConfigured = false;

  if (!corsStatus.hasRequiredOrigins) {
    // Auto-configure CORS
    const cloudflare = new Cloudflare({
      apiToken: userConfig.cloudflareApiToken,
    });

    let existingRules: NonNullable<CorsCheckResult['currentRules']> = [];
    try {
      const existingResponse = await cloudflare.r2.buckets.cors.get(bucketName, {
        account_id: userConfig.cloudflareAccountId,
      });
      existingRules = existingResponse.rules || [];
    } catch (error) {
      logger.error('Failed to get existing CORS rules', { error });
    }

    const basicCorsRule = generateBasicCorsRule(requiredOrigins);
    const updatedRules = [basicCorsRule, ...existingRules];

    await cloudflare.r2.buckets.cors.update(bucketName, {
      account_id: userConfig.cloudflareAccountId,
      rules: updatedRules,
    });

    corsMessage = `CORS configured automatically for domains: ${requiredOrigins.join(', ')}`;
    corsConfigured = true;
  } else {
    corsMessage = 'CORS already properly configured';
  }

  return {
    configured: corsConfigured,
    message: corsMessage,
    hasRequiredOrigins: corsStatus.hasRequiredOrigins || corsConfigured,
  };
}
