import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card } from '@mantine/core';
import { serialize } from 'cookie-es';
import { FormProvider, useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { z } from 'zod/v4';
import ControlledPasswordInput from '~/components/form/ControlledPasswordInput';

import { useEnv } from '~/context/env-context';
import useDecryptConfig from '~/hooks/config/useDecryptConfig';
import { PASSPHRASE_KEY } from '~/utils/constants';

const getCookieDomain = () => {
  return window.location.hostname.includes('orangecloud.app') ? '.orangecloud.app' : undefined;
};

const schema = z.object({
  passphrase: z.string().min(6, 'At least 6 characters are required'),
});

export const createCookieOptions = (maxAge: number) => ({
  maxAge,
  path: '/',
  sameSite: 'lax' as const,
  secure: window.location.protocol === 'https:',
  domain: getCookieDomain(),
});
const SavePassphraseInBrowser = () => {
  const { apiUrl } = useEnv();
  const decryptConfig = useDecryptConfig({ apiUrl });
  const revalidator = useRevalidator();
  const form = useForm({
    defaultValues: {
      passphrase: '',
    },
    resolver: zodResolver(schema),
  });

  const handleDecryptPassphrase = async (data: { passphrase: string }) => {
    const { passphrase } = data;
    await decryptConfig.mutateAsync(passphrase);
    document.cookie = serialize(
      PASSPHRASE_KEY,
      passphrase,
      createCookieOptions(60 * 60 * 24 * 365)
    );
    revalidator.revalidate();
    form.reset();
  };

  return (
    <Card padding="lg" className="border border-card-border shadow-sm hover:bg-card-background!">
      <div className="flex flex-col">
        <h2 className="font-semibold text-gray-900 text-lg dark:text-gray-100">Save Passphrase</h2>
        <div className="p-4">
          <div className="mb-3 flex items-center gap-3">
            <p className="font-medium text-sm">Save Passphrase</p>
          </div>
          <p className="mb-3 text-gray-600 text-sm dark:text-gray-400">
            Save your passphrase to your browser. This will allow you to access your Cloudflare R2
            buckets.
          </p>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleDecryptPassphrase)} className="w-full">
              <ControlledPasswordInput
                label="Passphrase"
                placeholder="Enter your passphrase"
                name="passphrase"
                description="Enter your passphrase to decrypt and view your credentials"
                autoFocus
                disabled={decryptConfig.isPending}
              />
              <div className="mt-4 flex flex-end items-center gap-2">
                <Button
                  type="submit"
                  loading={decryptConfig.isPending}
                  disabled={!form.formState.isValid}
                >
                  Decrypt
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </Card>
  );
};

export default SavePassphraseInBrowser;
