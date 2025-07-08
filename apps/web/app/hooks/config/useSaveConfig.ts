import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { getErrorMessage } from '~/utils';
import { createClient } from '~/utils/client';
import type { EncryptionResult } from '~/utils/crypto';

const useSaveConfig = ({ apiUrl }: { apiUrl: string }) => {
  const queryClient = useQueryClient();
  const client = createClient(undefined, false, apiUrl);

  return useMutation({
    mutationFn: async (encryptionResult: EncryptionResult) => {
      const response = await client.config.$post({
        json: encryptionResult,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData) || 'Failed to save config');
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

export default useSaveConfig;
