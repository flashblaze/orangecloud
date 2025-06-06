import { redirect, useLoaderData } from 'react-router';
import { useEnv } from '~/context/use-env';
import useBucketContentByName from '~/queries/buckets/useBucketContentByName';
import { createClient } from '~/utils/client';
import type { Route } from './+types/bucket';

export function meta({ params }: Route.MetaArgs) {
  return [{ title: params.name }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const client = createClient(undefined, true);

  const response = await client.buckets[':name'].exists.$get({
    param: {
      name: params.name,
    },
  });

  if (response.status === 404) {
    return redirect('/');
  }

  return {
    name: params.name,
  };
}

const Bucket = () => {
  const { apiUrl } = useEnv();
  const { name } = useLoaderData<typeof loader>();
  const bucketContentByName = useBucketContentByName({ name, enabled: !!name, apiUrl });

  return (
    <div className="grid grid-cols-4 gap-4">
      {bucketContentByName.isLoading ? (
        <p>Loading...</p>
      ) : Array.isArray(bucketContentByName.data?.data) ? (
        bucketContentByName.data.data.map((item) => <div key={item.Key}>{item.Key}</div>)
      ) : (
        <p>No items</p>
      )}
    </div>
  );
};

export default Bucket;
