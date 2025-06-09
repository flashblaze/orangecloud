import { Card, Group, Text } from '@mantine/core';
import { useState } from 'react';
import { Link } from 'react-router';

import { isPreviewableFile } from '~/utils';
import FileIcon from './FileIcon';
import FilePreviewModal from './FilePreviewModal';

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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
};

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
  const [previewModalOpened, setPreviewModalOpened] = useState(false);
  const isGridView = viewMode === 'grid';
  const isPreviewable = item.type === 'file' && isPreviewableFile(item.name);

  const handleFileClick = () => {
    if (isPreviewable) {
      setPreviewModalOpened(true);
    }
  };

  const itemContent = (
    <Card padding={isGridView ? 'sm' : 'md'} className="h-full">
      {isGridView ? (
        // Grid View Layout
        <div className="flex h-full flex-col items-center gap-2 text-center">
          <FileIcon type={item.type} name={item.name} className="h-8 w-8" />
          <div className="w-full min-w-0">
            <Text
              size="sm"
              className="truncate font-medium text-gray-900 dark:text-gray-100"
              title={item.name}
            >
              {item.name}
            </Text>
            {item.type === 'file' && item.size !== undefined && (
              <Text size="xs" className="text-gray-500 dark:text-gray-400">
                {formatFileSize(item.size)}
              </Text>
            )}
          </div>
        </div>
      ) : (
        // List View Layout
        <Group justify="space-between" wrap="nowrap" className="h-full">
          <Group gap="sm" className="min-w-0 flex-1">
            <FileIcon type={item.type} name={item.name} />
            <div className="min-w-0 flex-1">
              <Text size="sm" className="truncate font-medium text-gray-900 dark:text-gray-100">
                {item.name}
              </Text>
              {item.type === 'file' && item.size !== undefined && (
                <Text size="xs" className="text-gray-500 dark:text-gray-400">
                  {formatFileSize(item.size)}
                </Text>
              )}
            </div>
          </Group>

          {item.lastModified && (
            <Text size="xs" className="whitespace-nowrap text-gray-500 dark:text-gray-400">
              {formatDate(item.lastModified)}
            </Text>
          )}
        </Group>
      )}
    </Card>
  );

  if (item.type === 'folder') {
    return (
      <Link
        to={`/buckets/${bucketName}?prefix=${encodeURIComponent(item.key)}`}
        className="block h-full no-underline"
        prefetch="intent"
      >
        {itemContent}
      </Link>
    );
  }

  // For files, check if they are previewable
  if (isPreviewable) {
    return (
      <>
        <button type="button" className="cursor-pointer text-left" onClick={handleFileClick}>
          {itemContent}
        </button>
        <FilePreviewModal
          opened={previewModalOpened}
          onClose={() => setPreviewModalOpened(false)}
          file={item}
          bucketName={bucketName}
        />
      </>
    );
  }

  // For non-previewable files, just show them without interaction
  return itemContent;
};

export default FileItem;
