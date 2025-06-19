import { zodResolver } from '@hookform/resolvers/zod';
import { Accordion, Button, Card, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { FormProvider, useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { z } from 'zod/v4';
import ControlledTextInput from '~/components/form/ControlledTextInput';
import { useEnv } from '~/context/env-context';
import useCheckConfig from '~/queries/config/useCheckConfig';
import useSaveConfig from '~/queries/config/useSaveConfig';
import { createClient } from '~/utils/client';
import IconCheck from '~icons/solar/check-circle-bold-duotone';
import IconX from '~icons/solar/close-circle-bold-duotone';
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
  const checkConfig = useCheckConfig({ apiUrl });
  const [helpModalOpen, { open: openHelpModal, close: closeHelpModal }] = useDisclosure(false);

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

  const handleTestConfig = async () => {
    if (!loaderData.config) return;
    try {
      const result = await checkConfig.mutateAsync();

      if (result?.valid) {
        notifications.show({
          title: 'Configuration Valid',
          message: 'All credentials are valid and working correctly!',
          color: 'green',
          icon: <IconCheck />,
        });
      } else {
        // Show specific error messages for each invalid credential
        if (!result?.details.accountIdOrApiToken.valid) {
          notifications.show({
            title: 'Account ID or API Token Issue',
            message: result?.summary.accountIdOrApiToken,
            color: 'red',
            icon: <IconX />,
          });
        }

        if (!result?.details.r2Credentials.valid) {
          notifications.show({
            title: 'R2 Credentials Issue',
            message: result?.summary.r2Credentials,
            color: 'red',
            icon: <IconX />,
          });
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Configuration Test Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        color: 'red',
        icon: <IconX />,
      });
    }
  };

  return (
    <section>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-semibold text-2xl text-gray-900 dark:text-gray-100">Settings</h1>

        <Card padding="lg" className="border border-card-border">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-lg dark:text-gray-100">
              Cloudflare Configuration
            </h2>
            <Button variant="light" size="sm" onClick={openHelpModal}>
              Need Help?
            </Button>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
              <ControlledTextInput
                label="Cloudflare Account ID"
                placeholder="Enter your Cloudflare Account ID"
                name="cloudflareAccountId"
                disabled={saveConfig.isPending}
                defaultValue={loaderData.config?.cloudflareAccountId}
              />

              <ControlledTextInput
                label="Cloudflare API Token"
                placeholder="Enter your Cloudflare API Token"
                name="cloudflareApiToken"
                disabled={saveConfig.isPending}
                defaultValue={loaderData.config?.cloudflareApiToken}
              />

              <ControlledTextInput
                label="R2 Access Key"
                placeholder="Enter your R2 Access Key"
                name="cloudflareR2AccessKey"
                disabled={saveConfig.isPending}
                defaultValue={loaderData.config?.cloudflareR2AccessKey}
              />

              <ControlledTextInput
                label="R2 Secret Key"
                placeholder="Enter your R2 Secret Key"
                name="cloudflareR2SecretKey"
                disabled={saveConfig.isPending}
                defaultValue={loaderData.config?.cloudflareR2SecretKey}
              />

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handleTestConfig}
                  loading={checkConfig.isPending}
                  disabled={!loaderData.config}
                >
                  Test Configuration
                </Button>

                <Button type="submit" loading={saveConfig.isPending}>
                  Save Configuration
                </Button>
              </div>
            </form>
          </FormProvider>
        </Card>

        {/* Help Modal */}
        <Modal
          opened={helpModalOpen}
          onClose={closeHelpModal}
          title="How to get your Cloudflare credentials"
          size="lg"
          centered
        >
          <Accordion variant="separated">
            <Accordion.Item value="account-id">
              <Accordion.Control>How to get Cloudflare Account ID</Accordion.Control>
              <Accordion.Panel>
                <div className="space-y-3">
                  <p className="text-gray-700 dark:text-gray-300">
                    Your Account ID is available in multiple places in the Cloudflare dashboard:
                  </p>
                  <ol className="list-inside list-decimal space-y-2 text-gray-700 dark:text-gray-300">
                    <li>
                      Log in to the{' '}
                      <a
                        href="https://dash.cloudflare.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Cloudflare Dashboard
                      </a>
                    </li>
                    <li>Select any domain or go to the account overview page</li>
                    <li>Look for the "Account ID" in the right sidebar under "API" section</li>
                    <li>Click the copy button next to the Account ID to copy it</li>
                  </ol>
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    The Account ID is a string that looks like:{' '}
                    <code className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-800">
                      a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
                    </code>
                  </p>
                </div>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="api-token">
              <Accordion.Control>How to create Cloudflare API Token</Accordion.Control>
              <Accordion.Panel>
                <div className="space-y-3">
                  <p className="text-gray-700 dark:text-gray-300">
                    Create a custom API token with the necessary permissions for R2:
                  </p>
                  <ol className="list-inside list-decimal space-y-2 text-gray-700 dark:text-gray-300">
                    <li>
                      Go to{' '}
                      <a
                        href="https://dash.cloudflare.com/profile/api-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Cloudflare Dashboard → My Profile → API Tokens
                      </a>
                    </li>
                    <li>Click "Create Token"</li>
                    <li>Select "Custom token" template</li>
                    <li>
                      Set the following permissions:
                      <ul className="mt-2 ml-4 list-inside list-disc space-y-1">
                        <li>
                          <strong>Account</strong> - Cloudflare R2:Edit
                        </li>
                        <li>
                          <strong>Zone</strong> - Zone:Read (if you need to access zone-specific
                          features)
                        </li>
                      </ul>
                    </li>
                    <li>Under "Account Resources", select "Include - [Your Account]"</li>
                    <li>Optionally set Client IP Address Filtering for security</li>
                    <li>Click "Continue to summary" then "Create Token"</li>
                    <li>Copy the token immediately (it won't be shown again)</li>
                  </ol>
                </div>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="r2-credentials">
              <Accordion.Control>How to generate R2 Access Key and Secret Key</Accordion.Control>
              <Accordion.Panel>
                <div className="space-y-3">
                  <p className="text-gray-700 dark:text-gray-300">
                    Generate R2-specific credentials for API access:
                  </p>
                  <ol className="list-inside list-decimal space-y-2 text-gray-700 dark:text-gray-300">
                    <li>
                      Log in to the{' '}
                      <a
                        href="https://dash.cloudflare.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Cloudflare Dashboard
                      </a>
                    </li>
                    <li>
                      Navigate to <strong>R2 Object Storage</strong> in the left sidebar
                    </li>
                    <li>If you haven't set up R2 yet, you'll need to enable it first</li>
                    <li>Click on "Manage R2 API tokens" in the right sidebar</li>
                    <li>Click "Create API token"</li>
                    <li>Give your token a descriptive name (e.g., "OrangeCloud App")</li>
                    <li>
                      Set permissions:
                      <ul className="mt-2 ml-4 list-inside list-disc space-y-1">
                        <li>
                          <strong>Permissions</strong>: Admin Read & Write (or customize as needed)
                        </li>
                        <li>
                          <strong>Bucket scope</strong>: Apply to all buckets or specific buckets
                        </li>
                      </ul>
                    </li>
                    <li>Click "Create API token"</li>
                    <li>
                      Copy both the <strong>Access Key ID</strong> and{' '}
                      <strong>Secret Access Key</strong>
                    </li>
                  </ol>
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    Store these credentials securely - the secret key won't be shown again after
                    this page.
                  </p>
                </div>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Modal>
      </div>
    </section>
  );
};

export default Settings;
