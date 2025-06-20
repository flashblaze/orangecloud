import Configuration from '~/components/modules/settings/Configuration';
import { createClient } from '~/utils/client';
import type { Route } from './+types/settings';

export function meta() {
  return [{ title: 'Settings | OrangeCloud' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const client = createClient(request.headers, true);

  try {
    const response = await client.config.$get();
    const config = await response.json();
    return { config: config.data };
  } catch {
    return { config: null };
  }
}

const Settings = ({ loaderData }: Route.ComponentProps) => {
  return <Configuration config={loaderData.config} />;
};

export default Settings;
