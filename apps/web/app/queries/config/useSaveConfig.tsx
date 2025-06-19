import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createClient } from '~/utils/client';

type UseSaveConfigProps = {
  apiUrl: string;
};

const useSaveConfig = ({ apiUrl }: UseSaveConfigProps) => {
  const client = createClient(undefined, false, apiUrl);
  const queryClient = useQueryClient();
  type Variables = Parameters<typeof client.config.$post>[0];

  return useMutation({
    mutationKey: ['saveConfig'],
    mutationFn: async (variables: Variables) => {
      const response = await client.config.$post(variables);

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message || 'Failed to save configuration');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
      notifications.show({
        message: 'Configuration saved successfully',
        color: 'green',
      });
    },
    onError: (error: Error) => {
      notifications.show({
        message: error.message || 'Failed to save configuration',
        color: 'red',
      });
    },
  });
};

export default useSaveConfig;
