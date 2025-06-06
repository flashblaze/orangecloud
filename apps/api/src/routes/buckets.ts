import { AwsClient } from 'aws4fetch';
import Cloudflare from 'cloudflare';
import { XMLParser } from 'fast-xml-parser';
import { Hono } from 'hono';

import type { AuthHonoEnv, BucketContent } from '../types';

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
  .get('/exists/:name', async (c) => {
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
  .get('/:name', async (c) => {
    const { name } = c.req.param();

    const aws = new AwsClient({
      accessKeyId: c.env.CLOUDFLARE_R2_ACCESS_KEY,
      secretAccessKey: c.env.CLOUDFLARE_R2_SECRET_KEY,
      region: 'auto',
    });

    const bucketContent = await aws.fetch(
      `https://${c.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${name}?list-type=2&delimiter=/`,
      {
        method: 'GET',
      }
    );

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

    console.log(json);

    return c.json({
      data: json.ListBucketResult.Contents,
      message: 'Success',
    });
  });

export default bucketsRouter;
