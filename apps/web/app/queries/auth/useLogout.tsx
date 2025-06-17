import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';

import authClient from '~/utils/auth-client';

type UseLogoutProps = {
  apiUrl: string;
};

const useLogout = ({ apiUrl }: UseLogoutProps) => {
  const auth = authClient(apiUrl);

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: async () => {
      const response = await auth.signOut();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response;
    },
    onError: (error: Error) => {
      notifications.show({
        message: error.message || 'Failed to logout',
        color: 'red',
      });
    },
  });
};

export default useLogout;
