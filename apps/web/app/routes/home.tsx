import Cloudflare from 'cloudflare';
import { Link } from 'react-router';
import type { Route } from './+types/home';

export function meta() {
  return [{ title: 'OrangeCloud' }, { name: 'description', content: 'Welcome to OrangeCloud!' }];
}

export async function loader({ context }: Route.LoaderArgs) {
  const cloudflare = new Cloudflare({
    apiToken: context.cloudflare.env.CLOUDFLARE_API_TOKEN,
  });

  const response = await cloudflare.r2.buckets.list({
    account_id: context.cloudflare.env.CLOUDFLARE_ACCOUNT_ID,
  });

  return {
    buckets: response.buckets,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main className="flex flex-col gap-4">
      <h2 className="font-bold text-2xl">Buckets</h2>
      <ul className="list-disc">
        {loaderData.buckets?.map((bucket) => (
          <li className="list-item" key={bucket.name}>
            <Link to={`/buckets/${bucket.name}`}>{bucket.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
