import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';

import authClient from '~/utils/auth-client';

type UseSignupWithEmailProps = {
  apiUrl: string;
};

const useSignupWithEmail = ({ apiUrl }: UseSignupWithEmailProps) => {
  const auth = authClient(apiUrl);

  return useMutation({
    mutationKey: ['signupWithEmail'],
    mutationFn: async (data: { email: string; password: string; turnstileToken: string }) => {
      const response = await auth.signUp.email({
        email: data.email,
        password: data.password,
        name: '',
        fetchOptions: {
          headers: {
            'x-captcha-response': data.turnstileToken,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }
    },
    onError: (error: Error) => {
      notifications.show({
        message: error.message || 'Failed to sign up with email',
        color: 'red',
      });
    },
  });
};

export default useSignupWithEmail;
