import { Link } from 'react-router';
import { createClient } from '~/utils/client';
import type { Route } from './+types/home';

export function meta() {
  return [{ title: 'OrangeCloud' }, { name: 'description', content: 'Welcome to OrangeCloud!' }];
}

export async function loader() {
  const client = createClient(undefined, true);

  const response = await client.buckets.$get();
  const json = await response.json();

  return {
    buckets: json.data,
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
