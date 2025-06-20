import { zodResolver } from '@hookform/resolvers/zod';
import { Accordion, ActionIcon, Button, Card, Modal, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { FormProvider, useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { z } from 'zod/v4';

import { DeleteConfirmation } from '~/components/DeleteConfirmation';
import ControlledTextInput from '~/components/form/ControlledTextInput';
import { useEnv } from '~/context/env-context';
import useCheckConfig from '~/queries/config/useCheckConfig';
import useDeleteConfig from '~/queries/config/useDeleteConfig';
import useSaveConfig from '~/queries/config/useSaveConfig';
import IconCheck from '~icons/solar/check-circle-broken';
import IconX from '~icons/solar/close-circle-broken';
import IconQuestion from '~icons/solar/question-circle-broken';

interface ConfigurationProps {
  config: {
    cloudflareAccountId: string;
    cloudflareApiToken: string;
    cloudflareR2AccessKey: string;
    cloudflareR2SecretKey: string;
  } | null;
}

const schema = z.object({
  cloudflareAccountId: z.string().min(1, 'Cloudflare Account ID is required'),
  cloudflareApiToken: z.string().min(1, 'Cloudflare API Token is required'),
  cloudflareR2AccessKey: z.string().min(1, 'R2 Access Key is required'),
  cloudflareR2SecretKey: z.string().min(1, 'R2 Secret Key is required'),
});

const Configuration = ({ config }: ConfigurationProps) => {
  const { apiUrl } = useEnv();
  const revalidator = useRevalidator();
  const saveConfig = useSaveConfig({ apiUrl });
  const checkConfig = useCheckConfig({ apiUrl });
  const deleteConfig = useDeleteConfig({ apiUrl });
  const [helpModalOpen, { open: openHelpModal, close: closeHelpModal }] = useDisclosure(false);
  const [deleteConfirmOpened, { open: openDeleteConfirm, close: closeDeleteConfirm }] =
    useDisclosure(false);

  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      cloudflareAccountId: config?.cloudflareAccountId || '',
      cloudflareApiToken: config?.cloudflareApiToken || '',
      cloudflareR2AccessKey: config?.cloudflareR2AccessKey || '',
      cloudflareR2SecretKey: config?.cloudflareR2SecretKey || '',
    },
  });

  const handleTestConfig = async () => {
    try {
      const result = await checkConfig.mutateAsync();

      if (result?.valid) {
        notifications.show({
          title: 'Configuration Valid',
          message: 'All credentials are valid and are working correctly',
          color: 'green',
          icon: <IconCheck />,
        });
      } else {
        // Show specific error messages for each invalid credential
        if (!result?.details.accountIdOrApiToken.valid) {
          notifications.show({
            title: 'Account ID or API Token is invalid',
            message: result?.summary.accountIdOrApiToken,
            color: 'red',
            icon: <IconX />,
          });
        }

        if (!result?.details.r2Credentials.valid) {
          notifications.show({
            title: 'R2 Credentials are invalid',
            message: result?.summary.r2Credentials,
            color: 'red',
            icon: <IconX />,
          });
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Configuration test failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        color: 'red',
        icon: <IconX />,
      });
    }
  };

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    await saveConfig.mutateAsync({
      json: data,
    });
    revalidator.revalidate();
    await handleTestConfig();
  };

  const confirmDeleteConfig = async () => {
    await deleteConfig.mutateAsync();
    closeDeleteConfirm();
    revalidator.revalidate();
    methods.reset({
      cloudflareAccountId: '',
      cloudflareApiToken: '',
      cloudflareR2AccessKey: '',
      cloudflareR2SecretKey: '',
    });
  };

  return (
    <section>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-semibold text-2xl text-gray-900 dark:text-gray-100">Settings</h1>

        <Card
          padding="lg"
          className="border border-card-border shadow-sm hover:bg-card-background!"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-lg dark:text-gray-100">
              Cloudflare Configuration
            </h2>
            <Tooltip label="Need help?">
              <ActionIcon variant="outline" onClick={openHelpModal}>
                <IconQuestion />
              </ActionIcon>
            </Tooltip>
          </div>

          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
              <ControlledTextInput
                label="Cloudflare Account ID"
                placeholder="Enter your Cloudflare Account ID"
                name="cloudflareAccountId"
                disabled={saveConfig.isPending || checkConfig.isPending}
                defaultValue={config?.cloudflareAccountId}
              />

              <ControlledTextInput
                label="Cloudflare API Token"
                placeholder="Enter your Cloudflare API Token"
                name="cloudflareApiToken"
                disabled={saveConfig.isPending || checkConfig.isPending}
                defaultValue={config?.cloudflareApiToken}
              />

              <ControlledTextInput
                label="R2 Access Key"
                placeholder="Enter your R2 Access Key"
                name="cloudflareR2AccessKey"
                disabled={saveConfig.isPending || checkConfig.isPending}
                defaultValue={config?.cloudflareR2AccessKey}
              />

              <ControlledTextInput
                label="R2 Secret Key"
                placeholder="Enter your R2 Secret Key"
                name="cloudflareR2SecretKey"
                disabled={saveConfig.isPending || checkConfig.isPending}
                defaultValue={config?.cloudflareR2SecretKey}
              />

              <div className="flex justify-end gap-3">
                <Button
                  loading={deleteConfig.isPending}
                  onClick={openDeleteConfirm}
                  color="red"
                  disabled={saveConfig.isPending || checkConfig.isPending}
                >
                  Delete
                </Button>
                <Button
                  type="submit"
                  loading={saveConfig.isPending || checkConfig.isPending}
                  disabled={deleteConfig.isPending}
                >
                  Save
                </Button>
              </div>
            </form>
          </FormProvider>
        </Card>

        <DeleteConfirmation
          opened={deleteConfirmOpened}
          onClose={closeDeleteConfirm}
          onConfirm={confirmDeleteConfig}
          title="Delete Configuration"
          description="Are you sure you want to delete this configuration? This action cannot be undone."
          loading={deleteConfig.isPending}
        />

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

export default Configuration;
