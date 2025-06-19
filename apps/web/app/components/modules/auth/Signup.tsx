import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Divider } from '@mantine/core';
import { type SVGProps, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import Turnstile from 'react-turnstile';
import { useTurnstile } from 'react-turnstile';
import { z } from 'zod';

import ControlledPasswordInput from '~/components/form/ControlledPasswordInput';
import ControlledTextInput from '~/components/form/ControlledTextInput';
import { useEnv } from '~/context/env-context';
import useSignupWithEmail from '~/queries/auth/useSignupWithEmail';
import useSignupWithGitHub from '~/queries/auth/useSignupWithGitHub';
import useSignupWithGoogle from '~/queries/auth/useSignupWithGoogle';

const schema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email format').trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long')
    .trim(),
});

const GitHub = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 1024 1024"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>GitHub</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
      transform="scale(64)"
      fill="currentColor"
    />
  </svg>
);

const Signup = () => {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const { apiUrl, baseUrl, turnstileSiteKey } = useEnv();
  const navigate = useNavigate();
  const signupWithGitHub = useSignupWithGitHub({ apiUrl, baseUrl });
  const signupWithGoogle = useSignupWithGoogle({ apiUrl, baseUrl });
  const signupWithEmail = useSignupWithEmail({ apiUrl });
  const turnstile = useTurnstile();

  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    await signupWithEmail.mutateAsync({
      email: data.email,
      password: data.password,
      turnstileToken: turnstileToken || '',
    });
    navigate('/');
  };

  const handleGithubSignup = async () => {
    await signupWithGitHub.mutateAsync();
    turnstile.reset();
  };

  const handleGoogleSignup = async () => {
    await signupWithGoogle.mutateAsync();
    turnstile.reset();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <section className="flex h-dvh flex-col items-center justify-center">
          <Card className="w-full max-w-sm border border-card-border shadow-md hover:bg-card-background!">
            <Card.Section className="space-y-4 px-6 py-8">
              <img src="/logo.svg" alt="OrangeCloud" className="h-12 w-12" />
              <h3 className="text-center font-semibold text-lg">Create an account</h3>
              <Divider />
              <ControlledTextInput
                name="email"
                placeholder="john@doe.com"
                label="Email"
                type="email"
                disabled={
                  signupWithGitHub.isPending ||
                  signupWithGoogle.isPending ||
                  signupWithEmail.isPending
                }
              />
              <ControlledPasswordInput
                name="password"
                label="Password"
                placeholder="Password"
                disabled={
                  signupWithGitHub.isPending ||
                  signupWithGoogle.isPending ||
                  signupWithEmail.isPending
                }
              />
              <Turnstile
                sitekey={turnstileSiteKey}
                onVerify={(token) => {
                  setTurnstileToken(token);
                }}
                fixedSize
              />

              <Button
                type="submit"
                className="w-full"
                disabled={signupWithGitHub.isPending || signupWithGoogle.isPending}
                loading={signupWithEmail.isPending}
              >
                Sign up
              </Button>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Divider className="flex-1" />
                  <span className="text-gray-500 text-sm">OR</span>
                  <Divider className="flex-1" />
                </div>
                <Button
                  variant="light"
                  className="w-full"
                  leftSection={<img src="/icons/google.svg" alt="Google" className="h-4 w-4" />}
                  disabled={signupWithGitHub.isPending || signupWithEmail.isPending}
                  loading={signupWithGoogle.isPending}
                  onClick={handleGoogleSignup}
                >
                  Sign up with Google
                </Button>
                <Button
                  variant="light"
                  className="w-full"
                  leftSection={<GitHub className="h-4 w-4 text-black dark:text-white" />}
                  disabled={signupWithGoogle.isPending || signupWithEmail.isPending}
                  loading={signupWithGitHub.isPending}
                  onClick={handleGithubSignup}
                >
                  Sign up with GitHub
                </Button>
              </div>
            </Card.Section>
          </Card>
          <div className="mt-4 text-center text-gray-500 text-sm">
            Already have an account?
            <Link to="/auth/login" className="ml-1 text-primary-500 underline">
              Log in
            </Link>
          </div>
        </section>
      </form>
    </FormProvider>
  );
};

export default Signup;
