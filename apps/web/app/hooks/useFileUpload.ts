import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { UploadFile, UploadProgress } from '~/utils/upload';
import { createUploadFile, uploadFile } from '~/utils/upload';

interface UseFileUploadOptions {
  apiUrl: string;
  bucketName: string;
  prefix?: string;
  onComplete?: () => void;
}

export const useFileUpload = ({
  apiUrl,
  bucketName,
  prefix = '',
  onComplete,
}: UseFileUploadOptions) => {
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const queryClient = useQueryClient();

  const updateUpload = useCallback((uploadId: string, updates: Partial<UploadFile>) => {
    setUploads((prev) =>
      prev.map((upload) => (upload.id === uploadId ? { ...upload, ...updates } : upload))
    );
  }, []);

  const startUpload = useCallback(
    async (files: File[]) => {
      const uploadFiles = files.map(createUploadFile);
      setUploads((prev) => [...prev, ...uploadFiles]);

      // Process uploads one by one to avoid overwhelming the server
      for (const uploadFileObj of uploadFiles) {
        try {
          updateUpload(uploadFileObj.id, { status: 'uploading' });

          await uploadFile({
            bucketName,
            file: uploadFileObj.file,
            prefix,
            apiUrl,
            onProgress: (progress: UploadProgress) => {
              updateUpload(uploadFileObj.id, {
                progress: progress.percentage,
                speed: progress.speed,
                timeRemaining: progress.timeRemaining,
              });
            },
            onUploadIdReceived: (uploadId: string, fileKey: string) => {
              updateUpload(uploadFileObj.id, { uploadId, fileKey });
            },
            signal: uploadFileObj.abortController?.signal,
          });

          updateUpload(uploadFileObj.id, {
            status: 'completed',
            progress: 100,
            speed: 0,
            timeRemaining: 0,
          });

          notifications.show({
            title: 'Upload successful',
            message: `${uploadFileObj.name} uploaded successfully`,
            color: 'green',
          });
        } catch (error) {
          // Check if upload was cancelled by user (don't show error notification)
          if (uploadFileObj.abortController?.signal.aborted) {
            updateUpload(uploadFileObj.id, {
              status: 'cancelled',
              speed: 0,
              timeRemaining: 0,
            });
            return; // Don't show any notification for user-initiated cancellations
          }

          const errorMessage = error instanceof Error ? error.message : 'Upload failed';

          updateUpload(uploadFileObj.id, {
            status: 'error',
            error: errorMessage,
            speed: 0,
            timeRemaining: 0,
          });

          notifications.show({
            title: 'Upload failed',
            message: `Failed to upload ${uploadFileObj.name}: ${errorMessage}`,
            color: 'red',
          });
        }
      }

      // Invalidate bucket content query to refresh the file list
      queryClient.invalidateQueries({
        queryKey: ['bucket', bucketName, prefix],
      });

      onComplete?.();
    },
    [apiUrl, bucketName, prefix, updateUpload, queryClient, onComplete]
  );

  const cancelUpload = useCallback(
    async (uploadId: string) => {
      const upload = uploads.find((u) => u.id === uploadId);
      if (upload?.abortController) {
        upload.abortController.abort();
        updateUpload(uploadId, { status: 'cancelled' });

        // If it's a multipart upload with uploadId and fileKey, call abort API
        if (upload.uploadId && upload.fileKey) {
          try {
            await fetch(`${apiUrl}/buckets/${bucketName}/abort-multipart`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                uploadId: upload.uploadId,
                fileKey: upload.fileKey,
              }),
            });
          } catch (error) {
            console.error('Failed to abort multipart upload:', error);
          }
        }
      }
    },
    [uploads, updateUpload, apiUrl, bucketName]
  );

  const cancelAllUploads = useCallback(async () => {
    for (const upload of uploads) {
      if (upload.status === 'uploading' || upload.status === 'pending') {
        if (upload.abortController) {
          upload.abortController.abort();
        }
        updateUpload(upload.id, { status: 'cancelled' });

        // If it's a multipart upload with uploadId and fileKey, call abort API
        if (upload.uploadId && upload.fileKey) {
          try {
            await fetch(`${apiUrl}/buckets/${bucketName}/abort-multipart`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                uploadId: upload.uploadId,
                fileKey: upload.fileKey,
              }),
            });
          } catch (error) {
            console.error('Failed to abort multipart upload:', error);
          }
        }
      }
    }
  }, [uploads, updateUpload, apiUrl, bucketName]);

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  const dismissCompleted = useCallback(() => {
    setUploads((prev) =>
      prev.filter((upload) => upload.status === 'uploading' || upload.status === 'pending')
    );
  }, []);

  const hasActiveUploads = uploads.some(
    (upload) => upload.status === 'uploading' || upload.status === 'pending'
  );

  return {
    uploads,
    hasActiveUploads,
    startUpload,
    cancelUpload,
    cancelAllUploads,
    clearUploads,
    dismissCompleted,
  };
};
