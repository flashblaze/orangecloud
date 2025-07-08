import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';

import { getErrorMessage } from '~/utils';
import { createClient } from '~/utils/client';

const useValidateConfig = ({ apiUrl }: { apiUrl: string }) => {
  const client = createClient(undefined, false, apiUrl);
  return useMutation({
    mutationFn: async () => {
      const response = await client.config.validate.$get();

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData) || 'Failed to validate config');
      }

      return response.json();
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Validation Failed',
        message: getErrorMessage(error),
        color: 'red',
      });
    },
  });
};

export default useValidateConfig;
