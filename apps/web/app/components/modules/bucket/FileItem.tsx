import { ActionIcon, Card, Group, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useState } from 'react';
import { Link } from 'react-router';

import { useEnv } from '~/context/env-context';
import useDeleteFile from '~/queries/buckets/useDeleteFile';
import { formatFileSize, getFileExtension, isPreviewableFile } from '~/utils';
import IconDotsVertical from '~icons/solar/menu-dots-bold-duotone';
import IconShare from '~icons/solar/share-bold-duotone';
import IconTrash from '~icons/solar/trash-bin-trash-bold-duotone';
import { DeleteConfirmation } from '../../DeleteConfirmation';
import FileIcon from './FileIcon';
import FilePreviewModal from './FilePreviewModal';
import ShareModal from './ShareModal';

export interface FileSystemItem {
  key: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: string;
}

interface FileItemProps {
  item: FileSystemItem;
  bucketName: string;
  viewMode?: 'list' | 'grid';
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const FileItem = ({ item, bucketName, viewMode = 'list' }: FileItemProps) => {
  const [deleteConfirmOpened, { open: openDeleteConfirm, close: closeDeleteConfirm }] =
    useDisclosure(false);
  const [shareModalOpened, { open: openShareModal, close: closeShareModal }] = useDisclosure(false);
  const env = useEnv();
  const deleteFile = useDeleteFile({ apiUrl: env.apiUrl });

  const [previewModalOpened, setPreviewModalOpened] = useState(false);
  const isGridView = viewMode === 'grid';
  const isPreviewable = item.type === 'file' && isPreviewableFile(item.name);

  const handleFileClick = () => {
    if (isPreviewable) {
      setPreviewModalOpened(true);
    }
  };

  const handleDeleteFile = useCallback(() => {
    openDeleteConfirm();
  }, [openDeleteConfirm]);

  const handleShareFile = useCallback(() => {
    openShareModal();
  }, [openShareModal]);

  const confirmDeleteFile = useCallback(() => {
    deleteFile.mutate({
      bucketName,
      fileKey: item.key,
    });
  }, [bucketName, deleteFile, item.key]);

  const MoreOptions = useCallback(
    () => (
      <Menu shadow="md" width={120} position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="default" size="sm" onClick={(e) => e.stopPropagation()}>
            <IconDotsVertical className="h-4 w-4" />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconShare className="h-4 w-4" />}
            onClick={(e) => {
              e.stopPropagation();
              handleShareFile();
            }}
          >
            Share
          </Menu.Item>
          <Menu.Item
            leftSection={<IconTrash className="h-4 w-4" />}
            className="text-red-500 dark:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteFile();
            }}
          >
            Delete
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    ),
    [handleDeleteFile, handleShareFile]
  );

  const itemContent = (
    <Card padding={isGridView ? 0 : 'md'} className="h-full">
      {isGridView ? (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-center rounded-t-lg bg-gray-50 p-6 dark:bg-gray-800">
            <FileIcon type={item.type} name={item.name} className="h-12 w-12" />
          </div>

          {/* Info Section */}
          <div className="flex items-center justify-between gap-2 p-3">
            <div className="min-w-0 flex-1">
              <p
                className="truncate font-medium text-gray-900 text-sm dark:text-gray-100"
                title={item.name}
              >
                {item.name}
              </p>
              {item.type === 'file' && item.size !== undefined && (
                <p className="text-gray-500 text-xs dark:text-gray-400">
                  {formatFileSize(item.size)}
                </p>
              )}
            </div>

            {/* Dropdown Menu for Grid View - Only for files */}
            {item.type === 'file' && <MoreOptions />}
          </div>
        </div>
      ) : (
        // List View Layout
        <div className="flex h-full justify-between">
          <Group gap="sm" className="min-w-0 flex-1">
            <FileIcon type={item.type} name={item.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900 text-sm dark:text-gray-100">
                {item.name}
              </p>
              <div className="space-y-1">
                {item.type === 'file' && item.size !== undefined && (
                  <p className="text-gray-500 text-xs dark:text-gray-400">
                    {formatFileSize(item.size)}
                  </p>
                )}
                {item.lastModified && (
                  <p className="text-gray-500 text-xs dark:text-gray-400">
                    {formatDate(item.lastModified)}
                  </p>
                )}
              </div>
            </div>
          </Group>

          {/* Dropdown Menu - Only for files */}
          {item.type === 'file' && <MoreOptions />}
        </div>
      )}
    </Card>
  );

  if (item.type === 'folder') {
    return (
      <div className="mb-1">
        <Link
          to={`/buckets/${bucketName}?prefix=${encodeURIComponent(item.key)}`}
          className="block h-full no-underline"
          prefetch="intent"
        >
          {itemContent}
        </Link>
      </div>
    );
  }

  // For files, check if they are previewable
  if (isPreviewable) {
    return (
      <>
        <button type="button" className="mb-1 cursor-pointer text-left" onClick={handleFileClick}>
          {itemContent}
        </button>
        <FilePreviewModal
          opened={previewModalOpened}
          onClose={() => setPreviewModalOpened(false)}
          file={item}
          bucketName={bucketName}
          fileExtension={getFileExtension(item.name)}
        />
        <ShareModal
          opened={shareModalOpened}
          onClose={closeShareModal}
          bucketName={bucketName}
          fileKey={item.key}
          fileName={item.name}
        />
        <DeleteConfirmation
          opened={deleteConfirmOpened}
          onClose={closeDeleteConfirm}
          onConfirm={confirmDeleteFile}
          title="Delete File"
          description="Are you sure you want to delete this file? This action cannot be undone."
          loading={deleteFile.isPending}
        />
      </>
    );
  }

  // For non-previewable files, just show them without interaction
  return (
    <>
      {itemContent}
      <ShareModal
        opened={shareModalOpened}
        onClose={closeShareModal}
        bucketName={bucketName}
        fileKey={item.key}
        fileName={item.name}
      />
      <DeleteConfirmation
        opened={deleteConfirmOpened}
        onClose={closeDeleteConfirm}
        onConfirm={confirmDeleteFile}
        title="Delete File"
        description="Are you sure you want to delete this file? This action cannot be undone."
      />
    </>
  );
};

export default FileItem;
