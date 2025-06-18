import { ActionIcon, Card, Menu, SegmentedControl, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useRef, useState } from 'react';
import {
  type ShouldRevalidateFunctionArgs,
  redirect,
  useLoaderData,
  useSearchParams,
} from 'react-router';

import Breadcrumb from '~/components/Breadcrumb';
import CreateFolderModal from '~/components/modules/bucket/CreateFolderModal';
import FileItem from '~/components/modules/bucket/FileItem';
import UploadProgress from '~/components/modules/bucket/UploadProgress';
import { useEnv } from '~/context/env-context';
import { useFileUpload } from '~/hooks/useFileUpload';
import useBucketContentByName from '~/queries/buckets/useBucketContentByName';
import { cn } from '~/utils';
import { createClient } from '~/utils/client';
import IconPlus from '~icons/solar/add-circle-bold-duotone';
import IconChecklist from '~icons/solar/checklist-bold-duotone';
import IconFile from '~icons/solar/file-bold-duotone';
import IconFolder from '~icons/solar/folder-bold-duotone';
import IconFolderOpen from '~icons/solar/folder-open-bold-duotone';
import IconUpload from '~icons/solar/upload-bold-duotone';
import IconGrid from '~icons/solar/widget-4-bold-duotone';
import type { Route } from './+types/bucket';

type ViewMode = 'list' | 'grid';

export function meta({ params }: Route.MetaArgs) {
  return [{ title: params.name }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const client = createClient(undefined, true);

  const response = await client.buckets[':name'].exists.$get({
    param: {
      name: params.name,
    },
  });

  if (response.status === 404) {
    return redirect('/');
  }

  return {
    name: params.name,
  };
}

// Prevent loader from running when only search params change
export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  // Only revalidate if the pathname changes (bucket name changes)
  // Don't revalidate if only search params change (folder navigation)
  if (currentUrl.pathname === nextUrl.pathname) {
    return false;
  }

  return defaultShouldRevalidate;
}

const Bucket = () => {
  const { apiUrl } = useEnv();
  const { name } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const prefix = searchParams.get('prefix') || '';
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [createFolderModalOpened, { open: openCreateFolderModal, close: closeCreateFolderModal }] =
    useDisclosure(false);

  const bucketContentByName = useBucketContentByName({
    name,
    prefix,
    enabled: !!name,
    apiUrl,
  });

  // File upload hook
  const fileUpload = useFileUpload({
    apiUrl,
    bucketName: name || '',
    prefix,
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      if (files.length > 0) {
        fileUpload.startUpload(files);
      }
      // Reset the input
      event.target.value = '';
    }
  };

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      if (files.length > 0) {
        fileUpload.startUpload(files);
      }
      // Reset the input
      event.target.value = '';
    }
  };

  const handleNewFolder = () => {
    openCreateFolderModal();
  };

  // Create skeleton items for loading state
  const renderSkeletonItems = () => {
    const skeletonItems = Array.from({ length: 8 }, (_, i) => (
      <div
        // biome-ignore lint/suspicious/noArrayIndexKey: No need
        key={`skeleton-item-${i}`}
        className={
          viewMode === 'grid'
            ? 'h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700'
            : 'h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700'
        }
      />
    ));
    return skeletonItems;
  };

  if (bucketContentByName.isError) {
    return (
      <section className="container mx-auto mt-10">
        <Card padding="xl" className="border border-card-border">
          <div className="flex flex-col items-center gap-4">
            <IconFolderOpen className="h-12 w-12 text-red-400 dark:text-red-500" />
            <div>
              <p className="mb-1 font-medium text-lg text-red-900 dark:text-red-200">
                Error loading bucket
              </p>
              <p className="text-red-600 dark:text-red-400">
                Unable to load the contents of this bucket
              </p>
            </div>
          </div>
        </Card>
      </section>
    );
  }

  const bucketData = bucketContentByName.data;
  const items = bucketData?.data?.items || [];

  return (
    <>
      <section>
        <div className="gap-y-10">
          {/* Breadcrumb Navigation with Add Button */}
          <div className="flex items-center justify-between">
            <Breadcrumb bucketName={name} prefix={prefix} className="mb-4" />
            <div className="flex items-center gap-2">
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <Tooltip label="Add files or folders">
                    <ActionIcon size="md" variant="filled">
                      <IconPlus className="h-5 w-5" />
                    </ActionIcon>
                  </Tooltip>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Add to bucket</Menu.Label>
                  <Menu.Item
                    leftSection={<IconFolder className="h-4 w-4" />}
                    onClick={handleNewFolder}
                  >
                    New folder
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconFile className="h-4 w-4" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    File upload
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconUpload className="h-4 w-4" />}
                    onClick={() => folderInputRef.current?.click()}
                  >
                    Folder upload
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              <div className="ml-2 flex items-center gap-2">
                <SegmentedControl
                  value={viewMode}
                  size="md"
                  onChange={(value) => setViewMode(value as ViewMode)}
                  data={[
                    {
                      value: 'list',
                      label: (
                        <Tooltip label="List view">
                          <div className="flex items-center justify-center">
                            <IconChecklist className="h-5 w-5" />
                          </div>
                        </Tooltip>
                      ),
                    },
                    {
                      value: 'grid',
                      label: (
                        <Tooltip label="Grid view">
                          <div className="flex items-center justify-center">
                            <IconGrid className="h-5 w-5" />
                          </div>
                        </Tooltip>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Content - Loading, Error, or Data */}
          {bucketContentByName.isLoading ? (
            <div
              className={cn(
                'grid grid-cols-1 gap-2',
                viewMode === 'grid' &&
                  'grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              )}
            >
              {renderSkeletonItems()}
            </div>
          ) : items.length > 0 ? (
            <div
              className={cn(
                'mt-5 grid grid-cols-1 gap-2',
                viewMode === 'grid' &&
                  'grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              )}
            >
              {items.map((item) => (
                <FileItem key={item.key} item={item} bucketName={name} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <Card
              padding="xl"
              className="border border-card-border text-center hover:bg-card-background!"
            >
              <div className="flex flex-col items-center gap-4">
                <IconFolderOpen className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="mb-1 font-medium text-gray-900 text-lg dark:text-gray-100">
                    This folder is empty
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    No files or folders found in this location
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Hidden file inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFolderUpload}
            // @ts-ignore - webkitdirectory is not in TypeScript types
            webkitdirectory=""
            multiple
            className="hidden"
          />
        </div>

        <CreateFolderModal
          opened={createFolderModalOpened}
          onClose={closeCreateFolderModal}
          name={name}
          prefix={prefix}
        />
      </section>

      {/* Upload Progress Panel */}
      <UploadProgress
        uploads={fileUpload.uploads}
        onCancel={fileUpload.cancelUpload}
        onCancelAll={fileUpload.cancelAllUploads}
        onDismiss={fileUpload.dismissCompleted}
      />
    </>
  );
};

export default Bucket;
