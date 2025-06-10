import { Button, Group, Loader, Modal, Radio } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useEnv } from '~/context/use-env';
import useBucketDomains from '~/queries/buckets/useBucketDomains';

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

const ShareModal = ({ opened, onClose, bucketName, fileKey, fileName }: ShareModalProps) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [copying, setCopying] = useState(false);
  const env = useEnv();

  const bucketDomains = useBucketDomains({
    bucketName,
    enabled: opened,
    apiUrl: env.apiUrl,
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

  const handleCopyUrl = async () => {
    if (!selectedDomain) {
      notifications.show({
        message: 'Please select a domain',
        color: 'orange',
      });
      return;
    }

    setCopying(true);
    try {
      const url = `https://${selectedDomain}/${encodeURIComponent(fileKey)}`;
      await navigator.clipboard.writeText(url);

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

  const handleClose = () => {
    setSelectedDomain('');
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
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No custom domains are configured for this bucket.
            </p>
            <p className="mt-2 text-gray-400 text-sm dark:text-gray-500">
              Configure a custom domain in your Cloudflare dashboard to share files.
            </p>
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
              <Button onClick={handleCopyUrl} loading={copying}>
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
              <Button onClick={handleCopyUrl} loading={copying} disabled={!selectedDomain}>
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
