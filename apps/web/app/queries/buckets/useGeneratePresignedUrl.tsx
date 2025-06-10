import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { createClient } from '~/utils/client';

type UseGeneratePresignedUrlProps = {
  apiUrl: string;
};

type GeneratePresignedUrlData = {
  bucketName: string;
  fileKey: string;
  expiresInSeconds: number;
};

const useGeneratePresignedUrl = ({ apiUrl }: UseGeneratePresignedUrlProps) => {
  const client = createClient(undefined, false, apiUrl);

  return useMutation({
    mutationFn: async ({ bucketName, fileKey, expiresInSeconds }: GeneratePresignedUrlData) => {
      const response = await client.buckets[':name'].file[':key']['presigned-url'].$post({
        param: {
          name: bucketName,
          key: fileKey,
        },
        json: {
          expiresInSeconds,
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || 'Failed to generate presigned URL');
      }

      const jsonData = await response.json();
      return jsonData;
    },
    onError: (error) => {
      notifications.show({
        message: error.message || 'Failed to generate presigned URL',
        color: 'red',
      });
    },
  });
};

export default useGeneratePresignedUrl;
