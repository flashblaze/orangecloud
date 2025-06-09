import { Card } from '@mantine/core';
import { Link } from 'react-router';
import ThemeToggle from '~/components/ThemeToggle';
import { formatFileSize } from '~/utils';
import { createClient } from '~/utils/client';
import IconDatabase from '~icons/solar/database-bold-duotone';
import IconFlashDrive from '~icons/solar/flash-drive-bold-duotone';
import IconTransfer from '~icons/solar/transfer-horizontal-bold-duotone';
import type { Route } from './+types/home';

export function meta() {
  return [{ title: 'OrangeCloud' }, { name: 'description', content: 'Welcome to OrangeCloud!' }];
}

export async function loader() {
  const client = createClient(undefined, true);

  try {
    const [bucketsResponse, metricsResponse] = await Promise.all([
      client.buckets.$get(),
      client.buckets.metrics.$get(),
    ]);

    const [bucketsJson, metricsJson] = await Promise.all([
      bucketsResponse.json(),
      metricsResponse.json(),
    ]);

    return {
      buckets: bucketsJson.data,
      metrics: metricsJson.data,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      buckets: [],
      metrics: null,
    };
  }
}

const Home = ({ loaderData }: Route.ComponentProps) => {
  const metrics = loaderData.metrics;

  // Calculate total storage
  const totalStorage = metrics
    ? (metrics.standard?.published?.payloadSize || 0) +
      (metrics.standard?.uploaded?.payloadSize || 0) +
      (metrics.infrequentAccess?.published?.payloadSize || 0) +
      (metrics.infrequentAccess?.uploaded?.payloadSize || 0)
    : 0;

  return (
    <section className="container mx-auto mt-10 px-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="mb-2 font-bold text-3xl text-gray-900 dark:text-gray-100">
              OrangeCloud
            </h1>
            <p className="font-semibold text-gray-600 dark:text-gray-400">
              Your R2 storage dashboard
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card padding="lg" className="hover:bg-card-background!">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                  <IconFlashDrive className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm dark:text-gray-400">Total Storage</p>
                  <p className="font-bold text-gray-900 text-xl dark:text-gray-100">
                    {formatFileSize(totalStorage)}
                  </p>
                </div>
              </div>
            </Card>

            <Card padding="lg" className="hover:bg-card-background!">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/20">
                  <IconTransfer className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm dark:text-gray-400">Standard Storage</p>
                  <p className="font-bold text-gray-900 text-xl dark:text-gray-100">
                    {formatFileSize(
                      (metrics.standard?.published?.payloadSize || 0) +
                        (metrics.standard?.uploaded?.payloadSize || 0)
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Buckets Section */}
        <div>
          <h2 className="mb-4 font-semibold text-gray-900 text-xl dark:text-gray-100">
            Your Buckets
          </h2>

          {loaderData.buckets && loaderData.buckets.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loaderData.buckets.map((bucket) => (
                <Link key={bucket.name} to={`/buckets/${bucket.name}`} className="no-underline">
                  <Card className="border border-card-border">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary-100/20 p-3 dark:bg-primary-900/20">
                        <IconDatabase className="h-6 w-6 text-primary-500 dark:text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-lg dark:text-gray-100">
                          {bucket.name}
                        </p>
                        <div className="flex items-center gap-4 text-gray-500 text-sm dark:text-gray-400">
                          <span>{formatFileSize(bucket.size || 0)}</span>
                          <span>•</span>
                          <span>{bucket.objectCount || 0} objects</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card
              padding="xl"
              className="border border-card-border text-center hover:bg-card-background!"
            >
              <div className="flex flex-col items-center gap-4">
                <IconDatabase className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                <div>
                  <p className="mb-1 font-medium text-gray-900 text-lg dark:text-gray-100">
                    No buckets found
                  </p>
                  <p className="text-gray-500 text-sm dark:text-gray-400">
                    Create your first bucket to get started
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default Home;
