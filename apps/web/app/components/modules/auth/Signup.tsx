import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Divider } from '@mantine/core';
import { useState } from 'react';
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
// import authClient from '~/utils/auth-client';

const schema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email format').trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long')
    .trim(),
});

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
                  leftSection={<img src="/icons/github.svg" alt="Google" className="h-4 w-4" />}
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
