import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '~/utils/client';

type UseUpdateViewModeProps = {
  apiUrl: string;
};

const useUpdateViewMode = ({ apiUrl }: UseUpdateViewModeProps) => {
  const client = createClient(undefined, false, apiUrl);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateViewMode'],
    mutationFn: async (filesViewMode: 'list' | 'grid') => {
      const response = await client.user['view-mode'].$patch({
        json: { filesViewMode },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || 'Failed to update view mode');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate session queries to get updated user data
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error: Error) => {
      notifications.show({
        message: error.message || 'Failed to update view mode',
        color: 'red',
      });
    },
  });
};

export default useUpdateViewMode;
