import { Card } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { serialize } from 'cookie-es';
import { useEffect } from 'react';
import { Link, redirect, useNavigate } from 'react-router';
import { createCookieOptions } from '~/components/modules/settings/SavePassphraseInBrowser';
import { formatFileSize } from '~/utils';
import { createClient } from '~/utils/client';
import { PASSPHRASE_KEY } from '~/utils/constants';
import IconDatabase from '~icons/solar/database-bold-duotone';
import IconFlashDrive from '~icons/solar/flash-drive-bold-duotone';
import IconTransfer from '~icons/solar/transfer-horizontal-bold-duotone';
import type { Route } from './+types/home';

export function meta() {
  return [{ title: 'OrangeCloud' }, { name: 'description', content: 'Welcome to OrangeCloud!' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const client = createClient(request.headers, true);

  const userConfigResponse = await client.config.$get();
  const userConfig = await userConfigResponse.json();

  if (!userConfig.data && !request.url.includes('/settings')) {
    return redirect('/settings');
  }

  try {
    const [bucketsResponse, metricsResponse] = await Promise.all([
      client.buckets.$get(),
      client.buckets.metrics.$get(),
    ]);

    const [bucketsJson, metricsJson] = await Promise.all([
      bucketsResponse.json(),
      metricsResponse.json(),
    ]);

    if (!bucketsResponse.ok) {
      throw new Error(bucketsJson.message || 'Failed to fetch buckets');
    }
    if (!metricsResponse.ok) {
      throw new Error(metricsJson.message || 'Failed to fetch metrics');
    }

    return {
      buckets: bucketsJson.data,
      metrics: metricsJson.data,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      buckets: [],
      message: error instanceof Error ? error.message : 'Failed to fetch data',
    };
  }
}

const Home = ({ loaderData }: Route.ComponentProps) => {
  const metrics = loaderData.metrics;
  const navigate = useNavigate();

  // Calculate total storage
  const totalStorage = metrics
    ? (metrics.standard?.published?.payloadSize || 0) +
      (metrics.standard?.uploaded?.payloadSize || 0) +
      (metrics.infrequentAccess?.published?.payloadSize || 0) +
      (metrics.infrequentAccess?.uploaded?.payloadSize || 0)
    : 0;

  useEffect(() => {
    if (loaderData.message) {
      notifications.show({
        title: 'Error',
        message: loaderData.message,
        color: 'red',
      });
      if (loaderData.message.includes('Invalid passphrase')) {
        document.cookie = serialize(PASSPHRASE_KEY, '', createCookieOptions(0));
        navigate('/settings');
      }
    }
  }, [loaderData.message, navigate]);

  return (
    <section>
      <div className="space-y-8">
        {/* Metrics Cards */}
        {metrics && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-xl dark:text-gray-100">
                Storage Usage
              </h2>
            </div>
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
          </>
        )}

        {/* Buckets Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-xl dark:text-gray-100">Your Buckets</h2>
          </div>

          {loaderData.buckets && loaderData.buckets.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loaderData.buckets.map((bucket) => (
                <Link key={bucket.name} to={`/buckets/${bucket.name}`}>
                  <Card className="h-full border border-card-border">
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
