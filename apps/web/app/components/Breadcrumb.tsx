import { Breadcrumbs } from '@mantine/core';
import { Link } from 'react-router';
import { cn } from '~/utils';
import IconHome from '~icons/solar/home-smile-angle-bold-duotone';

interface BreadcrumbProps {
  bucketName: string;
  prefix: string;
  className?: string;
}

const Breadcrumb = ({ bucketName, prefix, className }: BreadcrumbProps) => {
  const pathParts = prefix ? prefix.split('/').filter(Boolean) : [];

  const items = [
    <Link
      key="bucket"
      to={`/buckets/${bucketName}`}
      className="flex items-center gap-1 text-primary-500 no-underline transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
    >
      <IconHome className="h-4 w-4" />
      <span className="font-medium">{bucketName}</span>
    </Link>,
  ];

  let currentPath = '';
  for (const part of pathParts) {
    currentPath += `${part}/`;
    const isLast = currentPath === prefix;

    items.push(
      <Link
        key={currentPath}
        to={`/buckets/${bucketName}?prefix=${encodeURIComponent(currentPath)}`}
        className={cn(
          'no-underline transition-colors',
          isLast
            ? 'pointer-events-none cursor-default font-medium text-gray-500 dark:text-gray-300'
            : 'font-medium text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
        )}
      >
        {part}
      </Link>
    );
  }

  return (
    <Breadcrumbs
      separator="/"
      className={cn(className)}
      classNames={{
        root: 'mb-2',
        separator: 'text-gray-400 dark:text-gray-500 mx-2',
      }}
    >
      {items}
    </Breadcrumbs>
  );
};

export default Breadcrumb;
