import { zValidator } from '@hono/zod-validator';
import { AwsClient } from 'aws4fetch';
import Cloudflare from 'cloudflare';
import { XMLParser } from 'fast-xml-parser';
import { Hono } from 'hono';
import { z } from 'zod/v4';

import type { AuthHonoEnv, BucketContent, FileSystemItem } from '../types';

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

    const aws = new AwsClient({
      accessKeyId: c.env.CLOUDFLARE_R2_ACCESS_KEY,
      secretAccessKey: c.env.CLOUDFLARE_R2_SECRET_KEY,
      region: 'auto',
    });

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
  });

export default bucketsRouter;
