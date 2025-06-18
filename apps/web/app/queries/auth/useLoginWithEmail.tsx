import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';

import authClient from '~/utils/auth-client';

type UseLoginWithEmailProps = {
  apiUrl: string;
};

const useLoginWithEmail = ({ apiUrl }: UseLoginWithEmailProps) => {
  const auth = authClient(apiUrl);

  return useMutation({
    mutationKey: ['loginWithEmail'],
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await auth.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }
    },
    onError: (error: Error) => {
      notifications.show({
        message: error.message || 'Failed to login with email',
        color: 'red',
      });
    },
  });
};

export default useLoginWithEmail;
