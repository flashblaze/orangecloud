import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient } from '~/utils/client';

type UseDeleteConfigProps = {
  apiUrl: string;
};

const useDeleteConfig = ({ apiUrl }: UseDeleteConfigProps) => {
  const client = createClient(undefined, false, apiUrl);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['deleteConfig'],
    mutationFn: async () => {
      const response = await client.config.$delete();

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || 'Failed to delete configuration');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      notifications.show({
        message: 'Configuration deleted successfully',
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        message: error.message || 'Failed to delete configuration',
        color: 'red',
      });
    },
  });
};

export default useDeleteConfig;
