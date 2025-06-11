import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Group, Modal } from '@mantine/core';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import ControlledTextInput from '~/components/form/ControlledTextInput';
import IconFolder from '~icons/solar/folder-bold-duotone';

interface CreateFolderModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (folderName: string) => void;
}

const schema = z.object({
  folderName: z
    .string()
    .min(1, 'Folder name is required')
    .regex(/^[^/\\:*?"<>|]+$/, 'Invalid folder name'),
});

const CreateFolderModal = ({ opened, onClose, onSubmit }: CreateFolderModalProps) => {
  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      folderName: '',
    },
  });

  const handleSubmit = (data: z.infer<typeof schema>) => {
    onSubmit(data.folderName);
    handleClose();
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
            autoFocus
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Create Folder</Button>
          </Group>
        </form>
      </FormProvider>
    </Modal>
  );
};

export default CreateFolderModal;
