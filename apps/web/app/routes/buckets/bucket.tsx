import { ActionIcon, Card, Tooltip } from '@mantine/core';
import { useState } from 'react';
import {
  Link,
  type ShouldRevalidateFunctionArgs,
  redirect,
  useLoaderData,
  useSearchParams,
} from 'react-router';

import Breadcrumb from '~/components/Breadcrumb';
import FileItem from '~/components/FileItem';
import ThemeToggle from '~/components/ThemeToggle';
import { useEnv } from '~/context/use-env';
import useBucketContentByName from '~/queries/buckets/useBucketContentByName';
import { cn } from '~/utils';
import { createClient } from '~/utils/client';
import IconArrowLeft from '~icons/solar/arrow-left-bold-duotone';
import IconChecklist from '~icons/solar/checklist-bold-duotone';
import IconFolderOpen from '~icons/solar/folder-open-bold-duotone';
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

  const bucketContentByName = useBucketContentByName({
    name,
    prefix,
    enabled: !!name,
    apiUrl,
  });

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
    <section className="container mx-auto mt-10 px-8">
      <div className="space-y-10">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="no-underline">
              <Tooltip label="Back to buckets">
                <ActionIcon size="lg" variant="default">
                  <IconArrowLeft className="h-5 w-5" />
                </ActionIcon>
              </Tooltip>
            </Link>
            <p className="font-bold text-2xl text-gray-900 dark:text-gray-100">{name}</p>
          </div>

          {/* View Toggle and Theme Toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Tooltip label="List view">
              <ActionIcon
                size="lg"
                variant={viewMode === 'list' ? 'filled' : 'default'}
                color={viewMode === 'list' ? 'primary' : 'gray'}
                onClick={() => setViewMode('list')}
              >
                <IconChecklist className="h-5 w-5" />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Grid view">
              <ActionIcon
                size="lg"
                variant={viewMode === 'grid' ? 'filled' : 'default'}
                color={viewMode === 'grid' ? 'primary' : 'gray'}
                onClick={() => setViewMode('grid')}
              >
                <IconGrid className="h-5 w-5" />
              </ActionIcon>
            </Tooltip>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <Breadcrumb bucketName={name} prefix={prefix} className="mb-4" />

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
              'grid grid-cols-1 gap-2',
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
      </div>
    </section>
  );
};

export default Bucket;
