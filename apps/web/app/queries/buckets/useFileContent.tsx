import { useQuery } from '@tanstack/react-query';
import { createClient } from '~/utils/client';

type UseFileContentProps = {
  bucketName: string;
  fileKey: string;
  enabled?: boolean;
  apiUrl?: string;
};

const useFileContent = ({ bucketName, fileKey, enabled = true, apiUrl }: UseFileContentProps) => {
  const client = createClient(undefined, false, apiUrl);

  return useQuery({
    queryKey: ['file-content', bucketName, fileKey],
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

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

export default useFileContent;
