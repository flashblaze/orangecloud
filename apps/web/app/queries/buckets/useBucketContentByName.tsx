import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';

import { createClient } from '~/utils/client';

type UseBucketContentByNameProps = {
  name: string;
  enabled?: boolean;
  apiUrl?: string;
};

const useBucketContentByName = ({ name, enabled = true, apiUrl }: UseBucketContentByNameProps) => {
  const client = createClient(undefined, false, apiUrl);

  return useQuery({
    queryKey: ['bucket', name],
    queryFn: async () => {
      const response = await client.buckets[':name'].$get({
        param: {
          name,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw notifications.show({
          message: errorData.message || 'Failed to fetch activity',
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
