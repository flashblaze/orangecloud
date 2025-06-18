import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';

import authClient from '~/utils/auth-client';

type UseSignupWithGoogleProps = {
  apiUrl: string;
  baseUrl: string;
};

const useSignupWithGoogle = ({ apiUrl, baseUrl }: UseSignupWithGoogleProps) => {
  const auth = authClient(apiUrl);

  return useMutation({
    mutationKey: ['signupWithGoogle'],
    mutationFn: async () => {
      const response = await auth.signIn.social({
        provider: 'google',
        callbackURL: baseUrl,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }
    },
    onError: (error: Error) => {
      notifications.show({
        message: error.message || 'Failed to sign up with Google',
        color: 'red',
      });
    },
  });
};

export default useSignupWithGoogle;
