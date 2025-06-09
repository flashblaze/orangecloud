import { zValidator } from '@hono/zod-validator';
import Cloudflare from 'cloudflare';
import { XMLParser } from 'fast-xml-parser';
import { Hono } from 'hono';
import { z } from 'zod/v4';

import type { AuthHonoEnv, BucketContent, FileSystemItem } from '../types';
import { createAwsClient } from '../utils';

const bucketsRouter = new Hono<AuthHonoEnv>()
  .get('/', async (c) => {
    const cloudflare = new Cloudflare({
      apiToken: c.env.CLOUDFLARE_API_TOKEN,
    });

    const response = await cloudflare.r2.buckets.list({
      account_id: c.env.CLOUDFLARE_ACCOUNT_ID,
    });

    return c.json({
      data: response.buckets,
      message: 'Success',
    });
  })
  .get('/:name/exists', async (c) => {
    const { name } = c.req.param();
    const cloudflare = new Cloudflare({
      apiToken: c.env.CLOUDFLARE_API_TOKEN,
    });

    try {
      await cloudflare.r2.buckets.get(name, {
        account_id: c.env.CLOUDFLARE_ACCOUNT_ID,
      });
    } catch (error) {
      if (error instanceof Cloudflare.APIError) {
        return c.json(
          {
            data: null,
            message: 'Bucket not found',
          },
          404
        );
      }
    }

    return c.json({
      data: null,
      message: 'Success',
    });
  })
  .get('/:name', zValidator('query', z.object({ prefix: z.string().optional() })), async (c) => {
    const { name } = c.req.param();
    const prefix = c.req.query('prefix') || '';

    const aws = createAwsClient(c.env.CLOUDFLARE_R2_ACCESS_KEY, c.env.CLOUDFLARE_R2_SECRET_KEY);

    // Build URL with optional prefix
    let url = `https://${c.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${name}?list-type=2&delimiter=/`;
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

    return c.json({
      data: {
        items,
        prefix,
        bucketName: name,
      },
      message: 'Success',
    });
  })
  .get(
    '/:name/file/:key',
    zValidator(
      'param',
      z.object({
        name: z.string({ error: 'Name is required' }),
        key: z.string({ error: 'Key is required' }),
      })
    ),
    async (c) => {
      const { name, key } = c.req.param();

      const aws = createAwsClient(c.env.CLOUDFLARE_R2_ACCESS_KEY, c.env.CLOUDFLARE_R2_SECRET_KEY);
      const url = `https://${c.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${name}/${decodeURIComponent(key)}`;

      try {
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
        console.error('Error fetching file:', error);
        return c.json(
          {
            data: null,
            message: 'Internal server error',
          },
          500
        );
      }
    }
  )
  .delete(
    '/:name/file/:key',
    zValidator(
      'param',
      z.object({
        name: z.string({ error: 'Name is required' }),
        key: z.string({ error: 'Key is required' }),
      })
    ),
    async (c) => {
      const { name, key } = c.req.param();

      const aws = createAwsClient(c.env.CLOUDFLARE_R2_ACCESS_KEY, c.env.CLOUDFLARE_R2_SECRET_KEY);
      const url = `https://${c.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${name}/${decodeURIComponent(key)}`;

      try {
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

        return c.json({
          data: { key, bucketName: name },
          message: 'Success',
        });
      } catch (error) {
        console.error('Error deleting file:', error);
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

export default bucketsRouter;
