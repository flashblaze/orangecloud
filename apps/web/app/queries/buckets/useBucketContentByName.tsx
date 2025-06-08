import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '~/utils/client';

type UseBucketContentByNameProps = {
  name: string;
  prefix?: string;
  enabled?: boolean;
  apiUrl?: string;
};

const useBucketContentByName = ({
  name,
  prefix = '',
  enabled = true,
  apiUrl,
}: UseBucketContentByNameProps) => {
  const client = createClient(undefined, false, apiUrl);

  return useQuery({
    queryKey: ['bucket', name, prefix],
    queryFn: async () => {
      const response = await client.buckets[':name'].$get({
        param: {
          name: name,
        },
        query: {
          prefix: prefix,
        },
      });
      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw notifications.show({
          message: errorData.message || 'Failed to fetch bucket content',
          color: 'red',
        });
      }
      const jsonData = await response.json();
      return jsonData;
    },
    enabled,
  });
};

export default useBucketContentByName;
