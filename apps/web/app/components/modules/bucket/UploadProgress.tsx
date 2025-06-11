import { ActionIcon, Button, Progress, ScrollArea, Stack } from '@mantine/core';
import { useState } from 'react';

import type { UploadFile } from '~/utils/upload';
import { formatFileSize, formatTimeRemaining, formatUploadSpeed } from '~/utils/upload';
import IconChevronDown from '~icons/solar/alt-arrow-down-bold-duotone';
import IconChevronUp from '~icons/solar/alt-arrow-up-bold-duotone';
import IconCheck from '~icons/solar/check-circle-bold-duotone';
import IconX from '~icons/solar/close-circle-bold-duotone';

interface UploadProgressProps {
  uploads: UploadFile[];
  onCancel: (uploadId: string) => void;
  onCancelAll: () => void;
  onDismiss: () => void;
}

export default function UploadProgress({
  uploads,
  onCancel,
  onCancelAll,
  onDismiss,
}: UploadProgressProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (uploads.length === 0) {
    return null;
  }

  const activeUploads = uploads.filter(
    (upload) => upload.status === 'uploading' || upload.status === 'pending'
  );
  const completedUploads = uploads.filter((upload) => upload.status === 'completed');
  const errorUploads = uploads.filter((upload) => upload.status === 'error');

  const totalSize = uploads.reduce((sum, upload) => sum + upload.size, 0);
  const totalUploaded = uploads.reduce((sum, upload) => {
    return sum + (upload.size * upload.progress) / 100;
  }, 0);
  const overallProgress = totalSize > 0 ? Math.round((totalUploaded / totalSize) * 100) : 0;

  const averageSpeed =
    uploads
      .filter((upload) => upload.status === 'uploading')
      .reduce((sum, upload) => sum + upload.speed, 0) / Math.max(activeUploads.length, 1);

  const estimatedTimeRemaining = averageSpeed > 0 ? (totalSize - totalUploaded) / averageSpeed : 0;

  const getUploadStatusIcon = (upload: UploadFile) => {
    switch (upload.status) {
      case 'completed':
        return <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'error':
        return <IconX className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'cancelled':
        return <IconX className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
      default:
        return null;
    }
  };

  const getUploadStatusColor = (upload: UploadFile) => {
    switch (upload.status) {
      case 'completed':
        return 'green';
      case 'error':
        return 'red';
      case 'cancelled':
        return 'gray';
      default:
        return 'blue';
    }
  };

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-gray-200 border-t bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-gray-200 border-b bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <Button
            size="xs"
            leftSection={
              isExpanded ? (
                <IconChevronDown className="h-4 w-4" />
              ) : (
                <IconChevronUp className="h-4 w-4" />
              )
            }
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {activeUploads.length > 0
              ? `Uploading ${activeUploads.length} file${activeUploads.length === 1 ? '' : 's'}`
              : completedUploads.length > 0
                ? `Uploaded ${completedUploads.length} file${completedUploads.length === 1 ? '' : 's'}`
                : `${errorUploads.length} upload${errorUploads.length === 1 ? '' : 's'} failed`}
          </Button>

          {activeUploads.length > 0 && (
            <span className="text-gray-600 text-sm dark:text-gray-300">
              {formatFileSize(totalUploaded)} / {formatFileSize(totalSize)}
              {averageSpeed > 0 && <> • {formatUploadSpeed(averageSpeed)}</>}
              {estimatedTimeRemaining > 0 && <> • {formatTimeRemaining(estimatedTimeRemaining)}</>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeUploads.length > 0 && (
            <Button color="red" size="xs" onClick={onCancelAll}>
              Cancel All
            </Button>
          )}
          <ActionIcon variant="default" onClick={onDismiss}>
            <IconX className="h-4 w-4" />
          </ActionIcon>
        </div>
      </div>

      {/* Overall Progress Bar */}
      {activeUploads.length > 0 && (
        <div className="bg-gray-50 px-4 py-2 dark:bg-gray-700">
          <Progress value={overallProgress} size="sm" className="w-full" color="blue" />
        </div>
      )}

      {/* File List */}
      {isExpanded && (
        <ScrollArea className="max-h-80">
          <Stack gap="xs" className="p-4">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    {getUploadStatusIcon(upload)}
                    <span className="truncate font-medium text-gray-900 text-sm dark:text-gray-100">
                      {upload.name}
                    </span>
                    <span className="text-gray-600 text-xs dark:text-gray-400">
                      {formatFileSize(upload.size)}
                    </span>
                  </div>

                  {upload.status === 'uploading' || upload.status === 'pending' ? (
                    <>
                      <Progress
                        value={upload.progress}
                        size="xs"
                        className="mb-1"
                        color={getUploadStatusColor(upload)}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-xs dark:text-gray-400">
                          {upload.progress}%
                          {upload.speed > 0 && <> • {formatUploadSpeed(upload.speed)}</>}
                        </span>
                        {upload.timeRemaining > 0 && (
                          <span className="text-gray-600 text-xs dark:text-gray-400">
                            {formatTimeRemaining(upload.timeRemaining)}
                          </span>
                        )}
                      </div>
                    </>
                  ) : upload.status === 'error' ? (
                    <span className="text-red-600 text-xs dark:text-red-400">
                      {upload.error || 'Upload failed'}
                    </span>
                  ) : upload.status === 'completed' ? (
                    <span className="text-green-600 text-xs dark:text-green-400">
                      Upload complete
                    </span>
                  ) : (
                    <span className="text-gray-600 text-xs dark:text-gray-400">
                      Upload cancelled
                    </span>
                  )}
                </div>

                {(upload.status === 'uploading' || upload.status === 'pending') && (
                  <ActionIcon variant="transparent" onClick={() => onCancel(upload.id)}>
                    <IconX className="h-5 w-5" />
                  </ActionIcon>
                )}
              </div>
            ))}
          </Stack>
        </ScrollArea>
      )}
    </div>
  );
}
