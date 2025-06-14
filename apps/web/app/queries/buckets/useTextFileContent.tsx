import { useQuery } from '@tanstack/react-query';
import { createClient } from '~/utils/client';

type UseTextFileContentProps = {
  bucketName: string;
  fileKey: string;
  enabled?: boolean;
  apiUrl?: string;
};

const useTextFileContent = ({
  bucketName,
  fileKey,
  enabled = true,
  apiUrl,
}: UseTextFileContentProps) => {
  const client = createClient(undefined, false, apiUrl);

  return useQuery({
    queryKey: ['text-file-content', bucketName, fileKey],
    queryFn: async () => {
      const response = await client.buckets[':name'].file[':key'].$get({
        param: {
          name: bucketName,
          key: encodeURIComponent(fileKey),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }

      // For text files, we want the actual text content, not a blob
      return await response.text();
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

export default useTextFileContent;
