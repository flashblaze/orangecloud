import { zodResolver } from '@hookform/resolvers/zod';
import { ActionIcon, Button, Card, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { serialize } from 'cookie-es';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { z } from 'zod/v4';

import { DeleteConfirmation } from '~/components/DeleteConfirmation';
import ControlledPasswordInput from '~/components/form/ControlledPasswordInput';
import ControlledTextInput from '~/components/form/ControlledTextInput';
import { useEnv } from '~/context/env-context';
import useDecryptConfig from '~/hooks/config/useDecryptConfig';
import useDeleteConfig from '~/hooks/config/useDeleteConfig';
import useSaveConfig from '~/hooks/config/useSaveConfig';
import useValidateConfig from '~/hooks/config/useValidateConfig';
import { PASSPHRASE_KEY } from '~/utils/constants';
import { encryptCredentials, generatePassphraseSuggestion } from '~/utils/crypto';
import IconKey from '~icons/solar/key-broken';
import IconQuestion from '~icons/solar/question-circle-broken';
import IconShield from '~icons/solar/shield-check-broken';
import HelpModal from './HelpModal';
import PassphraseModal from './PassphraseModal';
import SavePassphraseInBrowser, { createCookieOptions } from './SavePassphraseInBrowser';

interface ConfigurationProps {
  config: {
    hasConfig: boolean;
  } | null;
  cookiePassphrase?: string;
}

const credentialsSchema = z.object({
  passphrase: z
    .string({ error: 'Passphrase is required' })
    .min(6, 'At least 6 characters are required')
    .trim(),
  cloudflareAccountId: z.string().min(1, 'Cloudflare Account ID is required').trim(),
  cloudflareApiToken: z.string().min(1, 'Cloudflare API Token is required').trim(),
  cloudflareR2AccessKey: z.string().min(1, 'R2 Access Key is required').trim(),
  cloudflareR2SecretKey: z.string().min(1, 'R2 Secret Key is required').trim(),
});

const DEFAULT_CREDENTIALS = {
  passphrase: '',
  cloudflareAccountId: '',
  cloudflareApiToken: '',
  cloudflareR2AccessKey: '',
  cloudflareR2SecretKey: '',
};

const Configuration = ({ config, cookiePassphrase }: ConfigurationProps) => {
  const { apiUrl } = useEnv();
  const revalidator = useRevalidator();

  const saveConfig = useSaveConfig({ apiUrl });
  const decryptConfig = useDecryptConfig({ apiUrl });
  const validateConfig = useValidateConfig({ apiUrl });
  const deleteConfig = useDeleteConfig({ apiUrl });

  const [helpModalOpen, { open: openHelpModal, close: closeHelpModal }] = useDisclosure(false);
  const [deleteConfirmOpened, { open: openDeleteConfirm, close: closeDeleteConfirm }] =
    useDisclosure(false);
  const [showPassphraseInput, { open: openPassphraseInput, close: closePassphraseInput }] =
    useDisclosure(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const methods = useForm<z.infer<typeof credentialsSchema>>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: DEFAULT_CREDENTIALS,
  });

  const generateNewPassphrase = () => {
    const suggestion = generatePassphraseSuggestion();
    methods.setValue('passphrase', suggestion);
  };

  const resetFormAndState = () => {
    setShowCredentials(false);
    methods.reset(DEFAULT_CREDENTIALS);
  };

  const handleDecryptCredentials = async () => {
    const result = await decryptConfig.mutateAsync(methods.watch('passphrase'));
    methods.reset(result.data || DEFAULT_CREDENTIALS);
    setShowCredentials(true);
    closePassphraseInput();

    notifications.show({
      title: 'Success',
      message: 'Credentials decrypted successfully',
      color: 'green',
    });
  };

  const handleTestConfig = async () => {
    const result = await validateConfig.mutateAsync();

    if (!result.data) {
      notifications.show({
        title: 'Configuration Validation failed',
        message: 'Please check your credentials and try again',
        color: 'red',
      });
      return false;
    }

    if (result.data.valid) {
      notifications.show({
        title: 'Configuration valid',
        message: 'All credentials are valid and working correctly',
        color: 'green',
      });
      return true;
    }
    // Show specific error messages
    if (!result.data.details.accountIdOrApiToken.valid) {
      notifications.show({
        title: 'Account ID or API Token is invalid',
        message: result.data.summary.accountIdOrApiToken,
        color: 'red',
      });
      return false;
    }

    if (!result.data.details.r2Credentials.valid) {
      notifications.show({
        title: 'R2 Credentials are invalid',
        message: result.data.summary.r2Credentials,
        color: 'red',
      });
      return false;
    }
  };

  const handleSubmit = async (data: z.infer<typeof credentialsSchema>) => {
    try {
      const encryptionResult = await encryptCredentials(data, data.passphrase);
      await saveConfig.mutateAsync(encryptionResult);

      document.cookie = serialize(
        PASSPHRASE_KEY,
        data.passphrase,
        createCookieOptions(60 * 60 * 24 * 365)
      );

      const isValid = await handleTestConfig();
      if (!isValid) {
        await deleteConfig.mutateAsync();
        return;
      }

      revalidator.revalidate();
      resetFormAndState();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const confirmDeleteConfig = async () => {
    await deleteConfig.mutateAsync();
    closeDeleteConfirm();
    revalidator.revalidate();
    resetFormAndState();
    document.cookie = serialize(PASSPHRASE_KEY, '', createCookieOptions(0));
  };

  return (
    <section>
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-semibold text-2xl text-gray-900 dark:text-gray-100">Settings</h1>

        {!cookiePassphrase && config?.hasConfig ? (
          <SavePassphraseInBrowser />
        ) : (
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

            {config?.hasConfig && !showCredentials && (
              <div className="p-4">
                <div className="mb-3 flex items-center gap-3">
                  <IconShield className="h-5 w-5 text-blue-600" />
                  <p className="font-medium text-sm">Encrypted configuration found</p>
                </div>
                <p className="mb-3 text-gray-600 text-sm dark:text-gray-400">
                  Your credentials are encrypted. Enter your passphrase to view or modify them.
                </p>
                <Button
                  size="sm"
                  leftSection={<IconKey className="h-4 w-4" />}
                  onClick={openPassphraseInput}
                >
                  Enter Passphrase
                </Button>
              </div>
            )}

            {(!config?.hasConfig || showCredentials) && (
              <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="mb-4">
                    <ControlledPasswordInput
                      label="Passphrase"
                      placeholder="Enter a strong passphrase"
                      name="passphrase"
                      description="This passphrase will be used to encrypt your credentials"
                      className="mb-3"
                      disabled={saveConfig.isPending || validateConfig.isPending}
                    />

                    <div className="flex justify-end">
                      <Button size="xs" variant="light" onClick={generateNewPassphrase}>
                        Generate Strong Passphrase
                      </Button>
                    </div>
                  </div>

                  <ControlledTextInput
                    label="Cloudflare Account ID"
                    placeholder="Enter your Cloudflare Account ID"
                    name="cloudflareAccountId"
                    disabled={saveConfig.isPending || validateConfig.isPending}
                  />

                  <ControlledTextInput
                    label="Cloudflare API Token"
                    placeholder="Enter your Cloudflare API Token"
                    name="cloudflareApiToken"
                    disabled={saveConfig.isPending || validateConfig.isPending}
                  />

                  <ControlledTextInput
                    label="R2 Access Key"
                    placeholder="Enter your R2 Access Key"
                    name="cloudflareR2AccessKey"
                    disabled={saveConfig.isPending || validateConfig.isPending}
                  />

                  <ControlledTextInput
                    label="R2 Secret Key"
                    placeholder="Enter your R2 Secret Key"
                    name="cloudflareR2SecretKey"
                    disabled={saveConfig.isPending || validateConfig.isPending}
                  />

                  <div className="flex justify-end gap-3">
                    {config?.hasConfig && (
                      <>
                        <Button
                          variant="outline"
                          onClick={handleTestConfig}
                          loading={validateConfig.isPending}
                          disabled={saveConfig.isPending || deleteConfig.isPending}
                        >
                          Test Configuration
                        </Button>
                        <Button
                          loading={deleteConfig.isPending}
                          onClick={openDeleteConfirm}
                          color="red"
                          disabled={saveConfig.isPending || validateConfig.isPending}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                    <Button
                      type="submit"
                      loading={saveConfig.isPending}
                      disabled={deleteConfig.isPending || validateConfig.isPending}
                    >
                      Save Configuration
                    </Button>
                  </div>
                </form>
              </FormProvider>
            )}
          </Card>
        )}

        <PassphraseModal
          opened={showPassphraseInput}
          onClose={closePassphraseInput}
          passphrase={methods.watch('passphrase')}
          setPassphrase={(value) => methods.setValue('passphrase', value)}
          handleDecryptCredentials={handleDecryptCredentials}
          decryptConfig={decryptConfig}
        />

        <DeleteConfirmation
          opened={deleteConfirmOpened}
          onClose={closeDeleteConfirm}
          onConfirm={confirmDeleteConfig}
          title="Delete Configuration"
          description="Are you sure you want to delete this configuration? This action cannot be undone."
          loading={deleteConfig.isPending}
        />

        <HelpModal opened={helpModalOpen} onClose={closeHelpModal} />
      </div>
    </section>
  );
};

export default Configuration;
