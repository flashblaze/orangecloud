import { useQuery } from '@tanstack/react-query';
import { createClient } from '~/utils/client';

type UseBucketDomainsProps = {
  bucketName: string;
  enabled?: boolean;
  apiUrl?: string;
};

const useBucketDomains = ({ bucketName, enabled = true, apiUrl }: UseBucketDomainsProps) => {
  const client = createClient(undefined, false, apiUrl);

  return useQuery({
    queryKey: ['bucket-domains', bucketName],
    queryFn: async () => {
      const response = await client.buckets[':name'].domains.$get({
        param: {
          name: bucketName,
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || 'Failed to fetch bucket domains');
      }

      const jsonData = await response.json();
      return jsonData;
    },
    enabled: enabled && !!bucketName,
  });
};

export default useBucketDomains;
