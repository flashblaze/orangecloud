import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Group, Loader, Modal, Radio } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import ControlledSelect from '~/components/form/ControlledSelect';
import { useEnv } from '~/context/env-context';
import useBucketDomains from '~/queries/buckets/useBucketDomains';
import useGeneratePresignedUrl from '~/queries/buckets/useGeneratePresignedUrl';

interface ShareModalProps {
  opened: boolean;
  onClose: () => void;
  bucketName: string;
  fileKey: string;
  fileName: string;
}

type CustomDomain = {
  domain: string;
  enabled: boolean;
  status?: {
    ownership: 'active' | 'pending' | 'deactivated';
    ssl: 'active' | 'pending' | 'initializing' | 'error';
  };
};

const presignedUrlSchema = z.object({
  duration: z.string().min(1, 'Duration is required'),
});

const ShareModal = ({ opened, onClose, bucketName, fileKey, fileName }: ShareModalProps) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [copying, setCopying] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const env = useEnv();

  const bucketDomains = useBucketDomains({
    bucketName,
    enabled: opened,
    apiUrl: env.apiUrl,
  });

  const generatePresignedUrl = useGeneratePresignedUrl({ apiUrl: env.apiUrl });

  const methods = useForm<z.infer<typeof presignedUrlSchema>>({
    resolver: zodResolver(presignedUrlSchema),
    defaultValues: {
      duration: '3600', // 1 hour default
    },
  });

  const availableDomains =
    (bucketDomains.data?.data as CustomDomain[])?.filter(
      (domain) =>
        domain.enabled && domain.status?.ownership === 'active' && domain.status?.ssl === 'active'
    ) || [];

  // Auto-select domain if only one is available
  const shouldAutoSelect = availableDomains.length === 1 && !selectedDomain;
  if (shouldAutoSelect) {
    setSelectedDomain(availableDomains[0].domain);
  }

  const handleCopyUrl = async (url?: string) => {
    const urlToCopy = url || `https://${selectedDomain}/${encodeURIComponent(fileKey)}`;

    if (!url && !selectedDomain) {
      notifications.show({
        message: 'Please select a domain',
        color: 'orange',
      });
      return;
    }

    setCopying(true);
    try {
      await navigator.clipboard.writeText(urlToCopy);

      notifications.show({
        message: 'URL copied to clipboard',
        color: 'green',
      });

      onClose();
    } catch {
      notifications.show({
        message: 'Failed to copy URL',
        color: 'red',
      });
    } finally {
      setCopying(false);
    }
  };

  const handleGeneratePresignedUrl = async (data: z.infer<typeof presignedUrlSchema>) => {
    try {
      const result = await generatePresignedUrl.mutateAsync({
        bucketName,
        fileKey,
        expiresInSeconds: Number.parseInt(data.duration),
      });

      const presignedUrl = result.data?.presignedUrl;
      setGeneratedUrl(presignedUrl || '');

      notifications.show({
        message: 'Presigned URL generated successfully',
        color: 'green',
      });
    } catch (error) {
      console.error('Error generating presigned URL:', error);
    }
  };

  const handleClose = () => {
    setSelectedDomain('');
    setGeneratedUrl('');
    methods.reset();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={`Share ${fileName}`} centered>
      <div className="space-y-4">
        {bucketDomains.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader size="sm" />
          </div>
        ) : availableDomains.length === 0 ? (
          // Private bucket - show presigned URL form
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-blue-700 text-sm dark:text-blue-300">
                This bucket is private. Generate a temporary signed URL to share this file.
              </p>
            </div>

            {generatedUrl ? (
              <div className="space-y-4">
                <div className="rounded border bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="mb-2 text-gray-600 text-sm dark:text-gray-300">Generated URL:</p>
                  <p className="break-all font-mono text-gray-900 text-xs dark:text-gray-100">
                    {generatedUrl}
                  </p>
                </div>
                <div className="flex justify-between">
                  <Button variant="default" onClick={() => setGeneratedUrl('')} size="sm">
                    Generate New
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="default" onClick={handleClose}>
                      Close
                    </Button>
                    <Button onClick={() => handleCopyUrl(generatedUrl)} loading={copying}>
                      Copy URL
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <FormProvider {...methods}>
                <form
                  onSubmit={methods.handleSubmit(handleGeneratePresignedUrl)}
                  className="space-y-4"
                >
                  <ControlledSelect
                    label="URL Expiration"
                    data={[
                      { value: '300', label: '5 minutes' },
                      { value: '900', label: '15 minutes' },
                      { value: '3600', label: '1 hour' },
                      { value: '21600', label: '6 hours' },
                      { value: '86400', label: '1 day' },
                      { value: '259200', label: '3 days' },
                      { value: '604800', label: '7 days' },
                    ]}
                    name="duration"
                    disabled={generatePresignedUrl.isPending}
                  />

                  <Group justify="flex-end">
                    <Button variant="default" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={generatePresignedUrl.isPending}>
                      Generate URL
                    </Button>
                  </Group>
                </form>
              </FormProvider>
            )}
          </div>
        ) : availableDomains.length === 1 ? (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm dark:text-gray-300">
              File will be shared using:{' '}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {availableDomains[0].domain}
              </span>
            </p>
            <Group justify="flex-end">
              <Button variant="default" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => handleCopyUrl()} loading={copying}>
                Copy URL
              </Button>
            </Group>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm dark:text-gray-300">
              Choose a domain to share this file:
            </p>

            <Radio.Group value={selectedDomain} onChange={setSelectedDomain}>
              <div className="space-y-2">
                {availableDomains.map((domain) => (
                  <Radio
                    key={domain.domain}
                    value={domain.domain}
                    label={domain.domain}
                    className="w-full"
                  />
                ))}
              </div>
            </Radio.Group>

            <Group justify="flex-end">
              <Button variant="default" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => handleCopyUrl()} loading={copying} disabled={!selectedDomain}>
                Copy URL
              </Button>
            </Group>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
