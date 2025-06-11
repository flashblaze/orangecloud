import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient } from '~/utils/client';

type UseCreateFolderProps = {
  apiUrl: string;
};

type CreateFolderVariables = {
  bucketName: string;
  folderName: string;
  prefix?: string;
};

const useCreateFolder = ({ apiUrl }: UseCreateFolderProps) => {
  const queryClient = useQueryClient();
  const client = createClient(undefined, false, apiUrl);

  return useMutation({
    mutationKey: ['createFolder'],
    mutationFn: async ({ bucketName, folderName, prefix = '' }: CreateFolderVariables) => {
      const response = await client.buckets[':name'].folder.$post({
        param: {
          name: bucketName,
        },
        json: {
          folderName,
        },
        query: {
          prefix,
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || 'Failed to create folder');
      }

      return await response.json();
    },
    onSuccess: (_, variables) => {
      notifications.show({
        message: `Folder "${variables.folderName}" created successfully`,
        color: 'green',
      });

      // Invalidate the bucket content query to refresh the file list
      queryClient.invalidateQueries({
        queryKey: ['bucket', variables.bucketName, variables.prefix || ''],
      });
    },
    onError: (error: Error) => {
      notifications.show({
        message: error.message || 'Failed to create folder',
        color: 'red',
      });
    },
  });
};

export default useCreateFolder;
