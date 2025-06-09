import { useQuery } from '@tanstack/react-query';
import { createClient } from '~/utils/client';

type UsePdfContentProps = {
  bucketName: string;
  fileKey: string;
  enabled?: boolean;
  apiUrl?: string;
};

const usePdfContent = ({ bucketName, fileKey, enabled = true, apiUrl }: UsePdfContentProps) => {
  const client = createClient(undefined, false, apiUrl);

  return useQuery({
    queryKey: ['pdf-content', bucketName, fileKey],
    queryFn: async () => {
      const response = await client.buckets[':name'].file[':key'].$get({
        param: {
          name: bucketName,
          key: encodeURIComponent(fileKey),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDF content');
      }

      // Return Blob to avoid detached ArrayBuffer issues
      return await response.blob();
    },
    enabled,
    // Disable caching to avoid detached ArrayBuffer issues
    staleTime: 0,
    gcTime: 0,
  });
};

export default usePdfContent;
