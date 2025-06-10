import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { createClient } from '~/utils/client';

type UseCreateBucketProps = {
  apiUrl: string;
};

type CreateBucketVariables = {
  name: string;
  locationHint?: 'apac' | 'eeur' | 'enam' | 'weur' | 'wnam';
  storageClass?: 'Standard' | 'InfrequentAccess';
};

const useCreateBucket = ({ apiUrl }: UseCreateBucketProps) => {
  const client = createClient(undefined, false, apiUrl);

  return useMutation({
    mutationKey: ['createBucket'],
    mutationFn: async (variables: CreateBucketVariables) => {
      const response = await client.buckets.$post({
        json: variables,
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || 'Failed to create bucket');
      }

      return await response.json();
    },
    onSuccess: () => {
      notifications.show({
        message: 'Bucket created successfully',
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        message: error.message || 'Failed to create bucket',
        color: 'red',
      });
    },
  });
};

export default useCreateBucket;
