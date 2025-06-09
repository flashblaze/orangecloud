import { Button, Modal } from '@mantine/core';

interface DeleteConfirmationProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  loading?: boolean;
}

export function DeleteConfirmation({
  opened,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  loading = false,
}: DeleteConfirmationProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
      withCloseButton={!loading}
    >
      <p className="mb-6 text-sm">{description}</p>

      <div className="flex justify-end gap-4">
        <Button variant="default" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} loading={loading} color="red">
          Delete
        </Button>
      </div>
    </Modal>
  );
}
