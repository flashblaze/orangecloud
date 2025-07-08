import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal } from '@mantine/core';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import ControlledPasswordInput from '~/components/form/ControlledPasswordInput';

import type useDecryptConfig from '~/hooks/config/useDecryptConfig';

interface PassphraseModalProps {
  opened: boolean;
  onClose: () => void;
  passphrase: string;
  setPassphrase: (value: string) => void;
  handleDecryptCredentials: () => void;
  decryptConfig: ReturnType<typeof useDecryptConfig>;
}

const schema = z.object({
  passphrase: z
    .string({ error: 'Passphrase is required' })
    .min(6, 'At least 6 characters are required')
    .trim(),
});

const PassphraseModal = ({
  opened,
  onClose,
  passphrase,
  setPassphrase,
  handleDecryptCredentials,
  decryptConfig,
}: PassphraseModalProps) => {
  const methods = useForm<z.infer<typeof schema>>({
    defaultValues: {
      passphrase,
    },
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    methods.reset({
      passphrase,
    });
  }, [methods, passphrase]);

  const handleSubmit = (data: z.infer<typeof schema>) => {
    setPassphrase(data.passphrase);
    handleDecryptCredentials();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Enter passphrase" centered>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)}>
          <ControlledPasswordInput
            label="Passphrase"
            placeholder="Enter your passphrase"
            name="passphrase"
            description="Enter your passphrase to decrypt and view your credentials"
            autoFocus
          />
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={decryptConfig.isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={decryptConfig.isPending}>
              Decrypt
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
};

export default PassphraseModal;
