import { Loader, Modal } from '@mantine/core';
import { useEffect } from 'react';

import { useEnv } from '~/context/use-env';
import useFileContent from '~/queries/buckets/useFileContent';
import { getPreviewType } from '~/utils';
import IconSoundWave from '~icons/solar/soundwave-bold';
import type { FileSystemItem } from './FileItem';

interface FilePreviewModalProps {
  opened: boolean;
  onClose: () => void;
  file: FileSystemItem | null;
  bucketName: string;
}

const FilePreviewModal = ({ opened, onClose, file, bucketName }: FilePreviewModalProps) => {
  const { apiUrl } = useEnv();

  const fileContent = useFileContent({
    bucketName,
    fileKey: file?.key || '',
    enabled: opened && !!file,
    apiUrl,
  });

  // Clean up blob URL when modal closes or file changes
  useEffect(() => {
    return () => {
      if (fileContent.data) {
        URL.revokeObjectURL(fileContent.data);
      }
    };
  }, [fileContent.data]);

  if (!file) return null;

  const previewType = getPreviewType(file.name);

  const renderPreviewContent = () => {
    if (fileContent.isLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Loader size="lg" />
        </div>
      );
    }

    if (fileContent.isError || !fileContent.data) {
      return (
        <div className="flex h-64 items-center justify-center">
          <p className="text-red-500 dark:text-red-400">Failed to load file</p>
        </div>
      );
    }

    if (previewType === 'image') {
      return (
        <img
          src={fileContent.data}
          alt={file.name}
          className="max-h-[70vh] max-w-full object-contain"
        />
      );
    }

    if (previewType === 'video') {
      return (
        <video src={fileContent.data} controls className="max-h-[70vh] max-w-full">
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
      );
    }

    if (previewType === 'audio') {
      return (
        <div className="flex w-full min-w-[400px] flex-col items-center gap-6">
          <IconSoundWave className="h-20 w-20 text-gray-400 dark:text-gray-500" />
          <audio
            src={fileContent.data}
            controls
            className="h-12 w-full min-w-[350px]"
            style={{ minHeight: '48px' }}
          >
            <track kind="captions" src="" label="Audio captions" />
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={file.name}
      size="auto"
      centered
      classNames={{
        content: 'max-w-[90vw] max-h-[90vh]',
        body: 'p-0',
        header: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
        title: 'font-medium text-gray-900 dark:text-gray-100 truncate',
      }}
    >
      <div className="flex items-center justify-center p-6">{renderPreviewContent()}</div>
    </Modal>
  );
};

export default FilePreviewModal;
