import { Card } from '@mantine/core';
import { Link } from 'react-router';
import ThemeToggle from '~/components/ThemeToggle';
import { createClient } from '~/utils/client';
import IconDatabase from '~icons/solar/database-bold-duotone';
import type { Route } from './+types/home';

export function meta() {
  return [{ title: 'OrangeCloud' }, { name: 'description', content: 'Welcome to OrangeCloud!' }];
}

export async function loader() {
  const client = createClient(undefined, true);

  const response = await client.buckets.$get();
  const json = await response.json();

  return {
    buckets: json.data,
  };
}

const Home = ({ loaderData }: Route.ComponentProps) => {
  return (
    <section className="container mx-auto mt-10 px-8">
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="mb-2 font-bold text-3xl text-gray-900 dark:text-gray-100">
              OrangeCloud
            </h1>
            <p className="font-semibold text-gray-600 dark:text-gray-400">Your R2 buckets</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loaderData.buckets?.map((bucket) => (
            <Link key={bucket.name} to={`/buckets/${bucket.name}`} className="no-underline">
              <Card>
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary-100/20 p-3 dark:bg-primary-900/20">
                    <IconDatabase className="h-6 w-6 text-primary-500 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg dark:text-gray-100">
                      {bucket.name}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {(!loaderData.buckets || loaderData.buckets.length === 0) && (
          <Card padding="xl" className="border border-card-border text-center">
            <div className="flex flex-col items-center gap-4">
              <IconDatabase className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="mb-1 font-medium text-gray-900 text-lg dark:text-gray-100">
                  No buckets found
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
};

export default Home;
