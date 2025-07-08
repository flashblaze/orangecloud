import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { getErrorMessage } from '~/utils';
import { createClient } from '~/utils/client';

const useDecryptConfig = ({ apiUrl }: { apiUrl: string }) => {
  const client = createClient(undefined, false, apiUrl);
  return useMutation({
    mutationFn: async (passphrase: string) => {
      const response = await client.config.decrypt.$post({
        json: { passphrase },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(getErrorMessage(errorData) || 'Failed to decrypt config');
      }

      return response.json();
    },
    onError: (error: unknown) => {
      notifications.show({
        title: 'Decryption Failed',
        message: getErrorMessage(error),
        color: 'red',
      });
    },
  });
};

export default useDecryptConfig;
