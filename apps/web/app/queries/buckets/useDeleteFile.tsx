import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '~/utils/client';

type UseDeleteFileProps = {
  apiUrl: string;
};

type DeleteFileVariables = {
  bucketName: string;
  fileKey: string;
};

const useDeleteFile = ({ apiUrl }: UseDeleteFileProps) => {
  const client = createClient(undefined, false, apiUrl);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['deleteFile'],
    mutationFn: async ({ bucketName, fileKey }: DeleteFileVariables) => {
      const response = await client.buckets[':name'].file[':key'].$delete({
        param: {
          name: bucketName,
          key: fileKey,
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || 'Failed to delete file');
      }

      return await response.json();
    },
    onSuccess: () => {
      notifications.show({
        message: 'File deleted successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['bucket'] });
    },
    onError: (error: Error) => {
      notifications.show({
        message: error.message || 'Failed to delete file',
        color: 'red',
      });
    },
  });
};

export default useDeleteFile;
