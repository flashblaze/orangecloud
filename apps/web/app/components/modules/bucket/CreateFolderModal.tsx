import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Group, Modal } from '@mantine/core';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import ControlledTextInput from '~/components/form/ControlledTextInput';
import { useEnv } from '~/context/use-env';
import useCreateFolder from '~/queries/buckets/useCreateFolder';
import IconFolder from '~icons/solar/folder-bold-duotone';

interface CreateFolderModalProps {
  opened: boolean;
  onClose: () => void;
  name: string;
  prefix: string;
}

const schema = z.object({
  folderName: z
    .string()
    .min(1, 'Folder name is required')
    .regex(/^[^/\\:*?"<>|]+$/, 'Invalid folder name'),
});

const CreateFolderModal = ({ opened, onClose, name, prefix }: CreateFolderModalProps) => {
  const { apiUrl } = useEnv();
  const createFolderMutation = useCreateFolder({ apiUrl });

  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      folderName: '',
    },
  });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    await createFolderMutation.mutateAsync(
      {
        bucketName: name,
        folderName: data.folderName.trim(),
        prefix,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    methods.reset();
    methods.clearErrors();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Create New Folder" size="md" centered>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
          <ControlledTextInput
            name="folderName"
            label="Folder Name"
            placeholder="Enter folder name"
            leftSection={<IconFolder className="h-4 w-4" />}
            disabled={createFolderMutation.isPending}
          />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={createFolderMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createFolderMutation.isPending}>
              Create Folder
            </Button>
          </Group>
        </form>
      </FormProvider>
    </Modal>
  );
};

export default CreateFolderModal;
