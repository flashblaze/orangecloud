import { Loader, Modal } from '@mantine/core';
import { useEffect } from 'react';
import ShikiHighlighter from 'react-shiki';

import { useEnv } from '~/context/env-context';
import useFileContent from '~/queries/buckets/useFileContent';
import useTextFileContent from '~/queries/buckets/useTextFileContent';
import { getPreviewType } from '~/utils';
import IconSoundWave from '~icons/solar/soundwave-bold';
import type { FileSystemItem } from './FileItem';
import PdfViewer from './PdfViewer';

interface FilePreviewModalProps {
  opened: boolean;
  onClose: () => void;
  file: FileSystemItem | null;
  bucketName: string;
  fileExtension: string;
}

const FilePreviewModal = ({
  opened,
  onClose,
  file,
  bucketName,
  fileExtension,
}: FilePreviewModalProps) => {
  const { apiUrl } = useEnv();

  if (!file) return null;

  const previewType = getPreviewType(file.name);

  // Use appropriate hook based on file type
  const fileContent = useFileContent({
    bucketName,
    fileKey: file?.key || '',
    enabled: opened && !!file && previewType !== 'code',
    apiUrl,
  });

  const textFileContent = useTextFileContent({
    bucketName,
    fileKey: file?.key || '',
    enabled: opened && !!file && previewType === 'code',
    apiUrl,
  });

  // Clean up blob URL when modal closes or file changes (only for non-text files)
  useEffect(() => {
    return () => {
      if (fileContent.data && previewType !== 'code') {
        URL.revokeObjectURL(fileContent.data);
      }
    };
  }, [fileContent.data, previewType]);

  const renderPreviewContent = () => {
    const isLoading = previewType === 'code' ? textFileContent.isLoading : fileContent.isLoading;
    const isError = previewType === 'code' ? textFileContent.isError : fileContent.isError;
    const data = previewType === 'code' ? textFileContent.data : fileContent.data;

    if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Loader size="lg" />
        </div>
      );
    }

    if (isError || !data) {
      return (
        <div className="flex h-64 items-center justify-center">
          <p className="text-red-500 dark:text-red-400">Failed to load file</p>
        </div>
      );
    }

    if (previewType === 'image') {
      return (
        <img
          src={data as string}
          alt={file.name}
          className="max-h-[70vh] max-w-full object-contain"
        />
      );
    }

    if (previewType === 'video') {
      return (
        <video src={data as string} controls className="max-h-[70vh] max-w-full">
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
            src={data as string}
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

    if (previewType === 'pdf') {
      return (
        <div className="w-full max-w-4xl">
          <PdfViewer fileKey={file.key} bucketName={bucketName} apiUrl={apiUrl} />
        </div>
      );
    }

    if (previewType === 'code') {
      return (
        <div className="w-full max-w-4xl">
          <ShikiHighlighter
            language={fileExtension}
            theme={{ light: 'github-light', dark: 'dark-plus' }}
          >
            {data as string}
          </ShikiHighlighter>
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
      size={previewType === 'pdf' ? 'xl' : 'auto'}
      centered
      classNames={{
        content: previewType === 'pdf' ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-[90vw] max-h-[90vh]',
        body: 'p-0',
        header: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
        title: 'font-medium text-gray-900 dark:text-gray-100 truncate',
      }}
    >
      <div className={`flex items-center justify-center ${previewType === 'pdf' ? 'p-4' : 'p-6'}`}>
        {renderPreviewContent()}
      </div>
    </Modal>
  );
};

export default FilePreviewModal;
