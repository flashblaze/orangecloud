import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getErrorMessage } from '~/utils';
import { createClient } from '~/utils/client';

const useDeleteConfig = ({ apiUrl }: { apiUrl: string }) => {
  const queryClient = useQueryClient();
  const client = createClient(undefined, false, apiUrl);

  return useMutation({
    mutationFn: async (): Promise<{ message: string }> => {
      const response = await client.config.$delete();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData) || 'Failed to delete config');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      notifications.show({
        title: 'Success',
        message: data.message,
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Error',
        message: getErrorMessage(error),
        color: 'red',
      });
    },
  });
};

export default useDeleteConfig;
