import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal } from '@mantine/core';
import { FormProvider, useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { z } from 'zod/v4';

import ControlledSelect from '~/components/form/ControlledSelect';
import ControlledTextInput from '~/components/form/ControlledTextInput';
import { useEnv } from '~/context/env-context';
import useCreateBucket from '~/queries/buckets/useCreateBucket';

type CreateBucketModalProps = {
  opened: boolean;
  onClose: () => void;
};

const schema = z.object({
  name: z
    .string({ error: 'Bucket name is required' })
    .min(3, 'Bucket name must be at least 3 characters')
    .max(64, 'Bucket name must be at most 64 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Bucket name can only contain lowercase letters (a-z), numbers (0-9), and hyphens (-)'
    ),
  locationHint: z.enum(['apac', 'eeur', 'enam', 'weur', 'wnam']).optional(),
  storageClass: z.enum(['Standard', 'InfrequentAccess']).optional(),
});

const CreateBucketModal = ({ opened, onClose }: CreateBucketModalProps) => {
  const revalidator = useRevalidator();
  const methods = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      locationHint: undefined,
      storageClass: 'Standard',
    },
  });
  const { apiUrl } = useEnv();
  const createBucketMutation = useCreateBucket({ apiUrl });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    await createBucketMutation.mutateAsync(data);
    revalidator.revalidate();
    onClose();
  };

  const handleClose = () => {
    methods.reset();
    methods.clearErrors();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Create New Bucket" size="md">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
          <ControlledTextInput
            label="Bucket Name"
            placeholder="my-bucket-name"
            name="name"
            disabled={createBucketMutation.isPending}
          />

          <ControlledSelect
            label="Location Hint"
            placeholder="Select location (optional)"
            data={[
              { value: 'apac', label: 'Asia Pacific' },
              { value: 'eeur', label: 'Eastern Europe' },
              { value: 'enam', label: 'Eastern North America' },
              { value: 'weur', label: 'Western Europe' },
              { value: 'wnam', label: 'Western North America' },
            ]}
            clearable
            name="locationHint"
            disabled={createBucketMutation.isPending}
          />

          <ControlledSelect
            label="Storage Class"
            data={[
              { value: 'Standard', label: 'Standard' },
              { value: 'InfrequentAccess', label: 'Infrequent Access' },
            ]}
            name="storageClass"
            disabled={createBucketMutation.isPending}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={createBucketMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createBucketMutation.isPending}>
              Create Bucket
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
};

export default CreateBucketModal;
