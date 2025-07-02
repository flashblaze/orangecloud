import Cloudflare from 'cloudflare';
import { XMLParser } from 'fast-xml-parser';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod/v4';

import authMiddleware from '../middlewares/auth';
import { createValidator } from '../middlewares/validator';
import type { AuthHonoEnv, BucketContent, FileSystemItem } from '../types';
import { createAwsClient, getUserConfig, getUserIdOrThrow } from '../utils';
import { ensureBucketCors } from '../utils/cors';
import { createSuccessResponse } from '../utils/responses';
import {
  completeMultipartUpload,
  generateMultipartUploadUrls,
  generatePresignedUploadUrl,
  initializeMultipartUpload,
} from '../utils/upload';

const createBucketSchema = z.object({
  name: z
    .string({ error: 'Bucket name is required' })
    .min(3, 'Bucket name must be at least 3 characters')
    .max(64, 'Bucket name must be at most 64 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Bucket name can only contain lowercase letters (a-z), numbers (0-9), and hyphens (-)'
    ),
  locationHint: z.enum(['apac', 'eeur', 'enam', 'weur', 'wnam']).optional(),
  storageClass: z.enum(['Standard', 'InfrequentAccess']).optional(),
});

const contentByPrefixSchema = z.object({
  prefix: z.string().optional(),
});

const fileSchema = z.object({
  name: z.string({ error: 'Name is required' }),
  key: z.string({ error: 'Key is required' }),
});

const createFolderSchema = z.object({
  folderName: z
    .string()
    .min(1, 'Folder name is required')
    .regex(/^[^/\\:*?"<>|]+$/, 'Invalid folder name'),
});

const generateUploadUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().min(1, 'File size must be greater than 0'),
  contentType: z.string().optional(),
});

const multipartUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().min(1, 'File size must be greater than 0'),
  contentType: z.string().optional(),
  partCount: z.number().min(1).max(10000),
});

const bucketsRouter = new Hono<AuthHonoEnv>()
  .post('/', authMiddleware, createValidator('json', createBucketSchema), async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const userConfig = await getUserConfig(userId, c.env);

      if (!userConfig) {
        throw new HTTPException(400, {
          message: 'Please configure your Cloudflare settings first',
        });
      }

      const { name, locationHint, storageClass } = c.req.valid('json');

      const cloudflare = new Cloudflare({
        apiToken: userConfig.cloudflareApiToken,
      });

      const response = await cloudflare.r2.buckets.create({
        account_id: userConfig.cloudflareAccountId,
        name,
        locationHint,
        storageClass,
      });

      return c.json(createSuccessResponse(response, 'Bucket created successfully'));
    } catch (error) {
      if (error instanceof Cloudflare.APIError) {
        throw new HTTPException(error.status || 400, {
          message: error.errors[0].message || 'Failed to create bucket',
        });
      }

      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .get('/', authMiddleware, async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const userConfig = await getUserConfig(userId, c.env);

      if (!userConfig) {
        throw new HTTPException(400, {
          message: 'Please configure your Cloudflare settings first',
        });
      }

      const cloudflare = new Cloudflare({
        apiToken: userConfig.cloudflareApiToken,
      });

      const response = await cloudflare.r2.buckets.list({
        account_id: userConfig.cloudflareAccountId,
      });

      // Get size information for each bucket
      const aws = createAwsClient(
        userConfig.cloudflareR2AccessKey,
        userConfig.cloudflareR2SecretKey
      );

      const buckets = response.buckets || [];
      const bucketsWithSize = await Promise.all(
        buckets.map(async (bucket) => {
          try {
            const url = `https://${userConfig.cloudflareAccountId}.r2.cloudflarestorage.com/${bucket.name}?list-type=2`;
            const bucketContent = await aws.fetch(url, { method: 'GET' });

            if (bucketContent.ok) {
              const bucketContentText = await bucketContent.text();
              const parser = new XMLParser();
              const json = parser.parse(bucketContentText) as BucketContent;

              let totalSize = 0;
              let objectCount = 0;

              if (json.ListBucketResult.Contents) {
                const contents = Array.isArray(json.ListBucketResult.Contents)
                  ? json.ListBucketResult.Contents
                  : [json.ListBucketResult.Contents];

                for (const content of contents) {
                  // Only skip folder markers (keys ending with '/')
                  // Don't skip zero-byte files as they are legitimate empty files
                  if (content.Key.endsWith('/')) {
                    continue;
                  }

                  totalSize += content.Size;
                  objectCount += 1;
                }
              }

              return {
                ...bucket,
                size: totalSize,
                objectCount,
              };
            }
          } catch (error) {
            console.error(`Error fetching size for bucket ${bucket.name}:`, error);
          }

          return {
            ...bucket,
            size: 0,
            objectCount: 0,
          };
        })
      );

      return c.json(createSuccessResponse(bucketsWithSize));
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
  .get('/metrics', authMiddleware, async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const userConfig = await getUserConfig(userId, c.env);

      const cloudflare = new Cloudflare({
        apiToken: userConfig.cloudflareApiToken,
      });

      const metrics = await cloudflare.r2.buckets.metrics.list({
        account_id: userConfig.cloudflareAccountId,
      });

      return c.json(createSuccessResponse(metrics));
    } catch (error) {
      if (error instanceof Cloudflare.APIError) {
        throw new HTTPException(error.status || 400, {
          message: error.errors[0].message || 'Failed to fetch metrics',
        });
      }

      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .get('/:name/exists', authMiddleware, async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const userConfig = await getUserConfig(userId, c.env);

      const { name } = c.req.param();

      const cloudflare = new Cloudflare({
        apiToken: userConfig.cloudflareApiToken,
      });

      await cloudflare.r2.buckets.get(name, {
        account_id: userConfig.cloudflareAccountId,
      });

      return c.json(createSuccessResponse(true, 'Bucket exists'));
    } catch (error) {
      if (error instanceof Cloudflare.APIError) {
        throw new HTTPException(404, { message: 'Bucket not found' });
      }

      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .get('/:name', authMiddleware, createValidator('query', contentByPrefixSchema), async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const userConfig = await getUserConfig(userId, c.env);

      const { name } = c.req.param();
      const prefix = c.req.query('prefix') || '';

      const aws = createAwsClient(
        userConfig.cloudflareR2AccessKey,
        userConfig.cloudflareR2SecretKey
      );

      // Build URL with optional prefix
      let url = `https://${userConfig.cloudflareAccountId}.r2.cloudflarestorage.com/${name}?list-type=2&delimiter=/`;
      if (prefix) {
        url += `&prefix=${encodeURIComponent(prefix)}`;
      }

      const bucketContent = await aws.fetch(url, {
        method: 'GET',
      });

      if (!bucketContent.ok) {
        return c.json(
          {
            data: null,
            message: 'Bucket content not found',
          },
          404
        );
      }

      const bucketContentText = await bucketContent.text();
      const parser = new XMLParser();
      const json = parser.parse(bucketContentText) as BucketContent;

      // Process folders (CommonPrefixes)
      const folders: FileSystemItem[] = [];
      if (json.ListBucketResult.CommonPrefixes) {
        const prefixes = Array.isArray(json.ListBucketResult.CommonPrefixes)
          ? json.ListBucketResult.CommonPrefixes
          : [json.ListBucketResult.CommonPrefixes];

        for (const prefixObj of prefixes) {
          const folderName = prefixObj.Prefix.replace(prefix, '').replace('/', '');
          if (folderName) {
            folders.push({
              key: prefixObj.Prefix,
              name: folderName,
              type: 'folder',
            });
          }
        }
      }

      // Process files (Contents)
      const files: FileSystemItem[] = [];
      if (json.ListBucketResult.Contents) {
        const contents = Array.isArray(json.ListBucketResult.Contents)
          ? json.ListBucketResult.Contents
          : [json.ListBucketResult.Contents];

        for (const content of contents) {
          // Skip if this is a folder marker or the current prefix
          if (content.Key === prefix || content.Key.endsWith('/')) continue;

          const fileName = content.Key.replace(prefix, '');
          if (fileName) {
            files.push({
              key: content.Key,
              name: fileName,
              type: 'file',
              size: content.Size,
              lastModified: content.LastModified,
              etag: content.ETag,
            });
          }
        }
      }

      // Sort files by lastModified in descending order (most recent first)
      files.sort((a, b) => {
        const dateA = new Date(a.lastModified || 0);
        const dateB = new Date(b.lastModified || 0);
        return dateB.getTime() - dateA.getTime();
      });

      const items = [...folders, ...files];

      return c.json(createSuccessResponse({ items, prefix, bucketName: name }));
    } catch (error) {
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .get('/:name/file/:key', authMiddleware, createValidator('param', fileSchema), async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const userConfig = await getUserConfig(userId, c.env);

      const { name, key } = c.req.param();

      const aws = createAwsClient(
        userConfig.cloudflareR2AccessKey,
        userConfig.cloudflareR2SecretKey
      );
      const url = `https://${userConfig.cloudflareAccountId}.r2.cloudflarestorage.com/${name}/${decodeURIComponent(key)}`;

      const fileResponse = await aws.fetch(url, {
        method: 'GET',
      });

      if (!fileResponse.ok) {
        console.error(`File not found: ${fileResponse.status}`);
        return c.json(
          {
            data: null,
            message: 'File not found',
          },
          404
        );
      }

      // Add this critical fix - read the body completely before returning
      const fileBuffer = await fileResponse.arrayBuffer();

      return new Response(fileBuffer, {
        headers: {
          'Content-Type': fileResponse.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Length': fileBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch (error) {
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .delete('/:name/file/:key', authMiddleware, createValidator('param', fileSchema), async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const userConfig = await getUserConfig(userId, c.env);

      const { name, key } = c.req.param();

      const aws = createAwsClient(
        userConfig.cloudflareR2AccessKey,
        userConfig.cloudflareR2SecretKey
      );
      const url = `https://${userConfig.cloudflareAccountId}.r2.cloudflarestorage.com/${name}/${decodeURIComponent(key)}`;

      const deleteResponse = await aws.fetch(url, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        if (deleteResponse.status === 404) {
          return c.json(
            {
              data: null,
              message: 'File not found',
            },
            404
          );
        }

        console.error(`Failed to delete file: ${deleteResponse.status}`);
        return c.json(
          {
            data: null,
            message: 'Failed to delete file',
          },
          500
        );
      }

      return c.json(createSuccessResponse({ key, bucketName: name }));
    } catch (error) {
      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .get('/:name/domains', authMiddleware, async (c) => {
    try {
      const userId = getUserIdOrThrow(c);
      const userConfig = await getUserConfig(userId, c.env);

      const { name } = c.req.param();

      const cloudflare = new Cloudflare({
        apiToken: userConfig.cloudflareApiToken,
      });

      const response = await cloudflare.r2.buckets.domains.custom.list(name, {
        account_id: userConfig.cloudflareAccountId,
      });

      return c.json(createSuccessResponse(response.domains || []));
    } catch (error) {
      if (error instanceof Cloudflare.APIError) {
        throw new HTTPException(error.status || 400, {
          message: error.errors[0]?.message || 'Failed to fetch custom domains',
        });
      }

      throw new HTTPException(500, {
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  })
  .post(
    '/:name/file/:key/presigned-url',
    authMiddleware,
    createValidator(
      'json',
      z.object({
        expiresInSeconds: z.number().min(1).max(604800), // 1 second to 7 days
      })
    ),
    async (c) => {
      try {
        const userId = getUserIdOrThrow(c);
        const userConfig = await getUserConfig(userId, c.env);

        const { name, key } = c.req.param();
        const { expiresInSeconds } = c.req.valid('json');

        const aws = createAwsClient(
          userConfig.cloudflareR2AccessKey,
          userConfig.cloudflareR2SecretKey
        );

        const presignedUrl = await generatePresignedUploadUrl(
          aws,
          userConfig.cloudflareAccountId,
          name,
          key,
          expiresInSeconds
        );

        return c.json(
          createSuccessResponse({
            presignedUrl,
            expiresInSeconds,
            expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
          })
        );
      } catch (error) {
        throw new HTTPException(500, {
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  )
  .post(
    '/:name/folder',
    authMiddleware,
    createValidator('json', createFolderSchema),
    createValidator('query', contentByPrefixSchema),
    async (c) => {
      try {
        const userId = getUserIdOrThrow(c);
        const userConfig = await getUserConfig(userId, c.env);

        const { name } = c.req.param();
        const { folderName } = c.req.valid('json');
        const prefix = c.req.query('prefix') || '';

        // Construct the folder key with prefix and trailing slash
        const folderKey = prefix ? `${prefix}${folderName}/` : `${folderName}/`;

        const aws = createAwsClient(
          userConfig.cloudflareR2AccessKey,
          userConfig.cloudflareR2SecretKey
        );
        const url = `https://${userConfig.cloudflareAccountId}.r2.cloudflarestorage.com/${name}/${encodeURIComponent(folderKey)}`;

        // Create an empty object to represent the folder
        const createResponse = await aws.fetch(url, {
          method: 'PUT',
          body: '',
          headers: {
            'Content-Length': '0',
            'Content-Type': 'application/x-directory',
          },
        });

        if (!createResponse.ok) {
          console.error(`Failed to create folder: ${createResponse.status}`);
          return c.json(
            {
              data: null,
              message: 'Failed to create folder',
            },
            500
          );
        }

        return c.json(
          createSuccessResponse({
            folderKey,
            folderName,
            bucketName: name,
            prefix,
          })
        );
      } catch (error) {
        throw new HTTPException(500, {
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  )
  .post(
    '/:name/upload-url',
    authMiddleware,
    createValidator('json', generateUploadUrlSchema),
    createValidator('query', contentByPrefixSchema),
    async (c) => {
      try {
        const userId = getUserIdOrThrow(c);
        const userConfig = await getUserConfig(userId, c.env);

        const { name } = c.req.param();
        const { fileName, fileSize, contentType } = c.req.valid('json');
        const prefix = c.req.query('prefix') || '';

        // Check and configure CORS before generating upload URL
        const corsResult = await ensureBucketCors(name, userConfig, c.env);

        const fileKey = prefix ? `${prefix}${fileName}` : fileName;
        const aws = createAwsClient(
          userConfig.cloudflareR2AccessKey,
          userConfig.cloudflareR2SecretKey
        );

        const url = `https://${userConfig.cloudflareAccountId}.r2.cloudflarestorage.com/${name}/${encodeURIComponent(fileKey)}`;
        const urlObj = new URL(url);
        urlObj.searchParams.set('X-Amz-Expires', '7200'); // 2 hours expiry

        const headers: Record<string, string> = {};
        if (contentType) {
          headers['Content-Type'] = contentType;
        }

        const request = new Request(urlObj.toString(), {
          method: 'PUT',
          headers,
        });

        const signedUrl = await aws.sign(request, {
          aws: {
            signQuery: true,
          },
        });

        return c.json({
          data: {
            uploadUrl: signedUrl.url,
            fileKey,
            fileName,
            fileSize,
            bucketName: name,
            prefix,
            cors: corsResult,
          },
          message: 'Upload URL generated successfully',
        });
      } catch (error) {
        throw new HTTPException(500, {
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  )
  .post(
    '/:name/multipart-upload',
    authMiddleware,
    createValidator('json', multipartUploadSchema),
    createValidator('query', contentByPrefixSchema),
    async (c) => {
      try {
        const userId = getUserIdOrThrow(c);
        const userConfig = await getUserConfig(userId, c.env);

        const { name } = c.req.param();
        const { fileName, fileSize, contentType, partCount } = c.req.valid('json');
        const prefix = c.req.query('prefix') || '';

        // Check and configure CORS before generating multipart upload URLs
        const corsResult = await ensureBucketCors(name, userConfig, c.env);

        const fileKey = prefix ? `${prefix}${fileName}` : fileName;
        const aws = createAwsClient(
          userConfig.cloudflareR2AccessKey,
          userConfig.cloudflareR2SecretKey
        );

        const uploadId = await initializeMultipartUpload(
          aws,
          userConfig.cloudflareAccountId,
          name,
          fileKey,
          contentType
        );

        const partUrls = await generateMultipartUploadUrls(
          aws,
          userConfig.cloudflareAccountId,
          name,
          fileKey,
          uploadId,
          partCount
        );

        return c.json({
          data: {
            uploadId,
            fileKey,
            fileName,
            fileSize,
            partCount,
            partUrls,
            bucketName: name,
            prefix,
            cors: corsResult,
          },
          message: 'Multipart upload initialized successfully',
        });
      } catch (error) {
        throw new HTTPException(500, {
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  )
  .post(
    '/:name/complete-multipart',
    authMiddleware,
    createValidator(
      'json',
      z.object({
        uploadId: z.string().min(1, 'Upload ID is required'),
        fileKey: z.string().min(1, 'File key is required'),
        parts: z
          .array(
            z.object({
              partNumber: z.number().min(1),
              etag: z.string().min(1),
            })
          )
          .min(1, 'At least one part is required'),
      })
    ),
    async (c) => {
      try {
        const userId = getUserIdOrThrow(c);
        const userConfig = await getUserConfig(userId, c.env);

        const { name } = c.req.param();
        const { uploadId, fileKey, parts } = c.req.valid('json');

        const aws = createAwsClient(
          userConfig.cloudflareR2AccessKey,
          userConfig.cloudflareR2SecretKey
        );

        await completeMultipartUpload(
          aws,
          userConfig.cloudflareAccountId,
          name,
          fileKey,
          uploadId,
          parts
        );

        return c.json(createSuccessResponse({ fileKey, bucketName: name }));
      } catch (error) {
        throw new HTTPException(500, {
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  )
  .post(
    '/:name/abort-multipart',
    authMiddleware,
    createValidator(
      'json',
      z.object({
        uploadId: z.string().min(1, 'Upload ID is required'),
        fileKey: z.string().min(1, 'File key is required'),
      })
    ),
    async (c) => {
      try {
        const userId = getUserIdOrThrow(c);
        const userConfig = await getUserConfig(userId, c.env);

        const { name } = c.req.param();
        const { uploadId, fileKey } = c.req.valid('json');

        const aws = createAwsClient(
          userConfig.cloudflareR2AccessKey,
          userConfig.cloudflareR2SecretKey
        );

        const url = `https://${userConfig.cloudflareAccountId}.r2.cloudflarestorage.com/${name}/${encodeURIComponent(fileKey)}?uploadId=${uploadId}`;

        const abortResponse = await aws.fetch(url, {
          method: 'DELETE',
        });

        if (!abortResponse.ok) {
          console.error(`Failed to abort multipart upload: ${abortResponse.status}`);
          return c.json(
            {
              data: null,
              message: 'Failed to abort multipart upload',
            },
            500
          );
        }

        return c.json(createSuccessResponse({ uploadId, fileKey, bucketName: name }));
      } catch (error) {
        throw new HTTPException(500, {
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    }
  );

export default bucketsRouter;
