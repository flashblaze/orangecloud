import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card } from '@mantine/core';
import { FormProvider, useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { z } from 'zod/v4';
import ControlledTextInput from '~/components/form/ControlledTextInput';
import { useEnv } from '~/context/env-context';
import useSaveConfig from '~/queries/config/useSaveConfig';
import { createClient } from '~/utils/client';
import type { Route } from './+types/settings';

const schema = z.object({
  cloudflareAccountId: z.string().min(1, 'Cloudflare Account ID is required'),
  cloudflareApiToken: z.string().min(1, 'Cloudflare API Token is required'),
  cloudflareR2AccessKey: z.string().min(1, 'R2 Access Key is required'),
  cloudflareR2SecretKey: z.string().min(1, 'R2 Secret Key is required'),
});

export function meta() {
  return [{ title: 'Settings | OrangeCloud' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const client = createClient(request.headers, true);

  try {
    const response = await client.config.$get();
    const config = await response.json();
    return { config: config.data };
  } catch {
    return { config: null };
  }
}

const Settings = ({ loaderData }: Route.ComponentProps) => {
  const { apiUrl } = useEnv();
  const revalidator = useRevalidator();
  const saveConfig = useSaveConfig({ apiUrl });

  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      cloudflareAccountId: loaderData.config?.cloudflareAccountId || '',
      cloudflareApiToken: loaderData.config?.cloudflareApiToken || '',
      cloudflareR2AccessKey: loaderData.config?.cloudflareR2AccessKey || '',
      cloudflareR2SecretKey: loaderData.config?.cloudflareR2SecretKey || '',
    },
  });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    await saveConfig.mutateAsync({
      json: data,
    });
    revalidator.revalidate();
  };

  return (
    <section>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-semibold text-2xl text-gray-900 dark:text-gray-100">Settings</h1>

        <Card padding="lg" className="border border-card-border">
          <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-gray-100">
            Cloudflare Configuration
          </h2>

          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
              <ControlledTextInput
                label="Cloudflare Account ID"
                placeholder="Enter your Cloudflare Account ID"
                name="cloudflareAccountId"
                disabled={saveConfig.isPending}
                description="Found in your Cloudflare dashboard URL"
                defaultValue={loaderData.config?.cloudflareAccountId}
              />

              <ControlledTextInput
                label="Cloudflare API Token"
                placeholder="Enter your Cloudflare API Token"
                name="cloudflareApiToken"
                disabled={saveConfig.isPending}
                description="Create a token with R2 permissions"
                defaultValue={loaderData.config?.cloudflareApiToken}
              />

              <ControlledTextInput
                label="R2 Access Key"
                placeholder="Enter your R2 Access Key"
                name="cloudflareR2AccessKey"
                disabled={saveConfig.isPending}
                description="Found in R2 > Manage R2 API tokens"
                defaultValue={loaderData.config?.cloudflareR2AccessKey}
              />

              <ControlledTextInput
                label="R2 Secret Key"
                placeholder="Enter your R2 Secret Key"
                name="cloudflareR2SecretKey"
                disabled={saveConfig.isPending}
                defaultValue={loaderData.config?.cloudflareR2SecretKey}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" loading={saveConfig.isPending}>
                  Save Configuration
                </Button>
              </div>
            </form>
          </FormProvider>
        </Card>
      </div>
    </section>
  );
};

export default Settings;
