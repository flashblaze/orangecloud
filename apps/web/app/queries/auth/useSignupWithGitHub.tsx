import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';

import authClient from '~/utils/auth-client';

type UseSignupWithGitHubProps = {
  apiUrl: string;
  baseUrl: string;
};

const useSignupWithGitHub = ({ apiUrl, baseUrl }: UseSignupWithGitHubProps) => {
  const auth = authClient(apiUrl);

  return useMutation({
    mutationKey: ['signupWithGitHub'],
    mutationFn: async () => {
      const response = await auth.signIn.social({
        provider: 'github',
        callbackURL: baseUrl,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }
    },
    onError: (error: Error) => {
      notifications.show({
        message: error.message || 'Failed to sign up with GitHub',
        color: 'red',
      });
    },
  });
};

export default useSignupWithGitHub;
