import { redirect } from 'react-router';

import { createClient } from '~/utils/client';
import type { Route } from './+types/bucket';

export function meta({ params }: Route.MetaArgs) {
  return [{ title: params.name }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const client = createClient(undefined, true);

  const response = await client.buckets[':name'].$get({
    param: {
      name: params.name,
    },
  });

  if (response.status === 404) {
    return redirect('/');
  }

  const json = await response.json();

  return {
    items: json.data,
  };
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
