import { AwsClient } from 'aws4fetch';
import Cloudflare from 'cloudflare';
import { XMLParser } from 'fast-xml-parser';
import { redirect } from 'react-router';

import type { BucketContent } from '~/types';
import type { Route } from './+types/bucket';

export function meta({ params }: Route.MetaArgs) {
  return [{ title: params.name }];
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const cloudflare = new Cloudflare({
    apiToken: context.cloudflare.env.CLOUDFLARE_API_TOKEN,
  });
  const aws = new AwsClient({
    accessKeyId: context.cloudflare.env.CLOUDFLARE_R2_ACCESS_KEY,
    secretAccessKey: context.cloudflare.env.CLOUDFLARE_R2_SECRET_KEY,
    region: 'auto',
  });

  try {
    const [_, bucketContent] = await Promise.all([
      cloudflare.r2.buckets.get(params.name, {
        account_id: context.cloudflare.env.CLOUDFLARE_ACCOUNT_ID,
      }),
      aws.fetch(
        `https://${context.cloudflare.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${params.name}?list-type=2`,
        {
          method: 'GET',
        }
      ),
    ]);

    const data = await bucketContent.text();
    const parser = new XMLParser();
    const json = parser.parse(data) as BucketContent;

    return {
      items: json.ListBucketResult.Contents,
    };
  } catch (error) {
    if (error instanceof Cloudflare.APIError) {
      console.error(error);
      throw redirect('/');
    }
    throw error;
  }
}

const Bucket = ({ loaderData }: Route.ComponentProps) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.isArray(loaderData.items) ? (
        loaderData.items.map((item) => <div key={item.Key}>{item.Key}</div>)
      ) : (
        <p>No items</p>
      )}
    </div>
  );
};

export default Bucket;
