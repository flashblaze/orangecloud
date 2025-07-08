import { parse } from 'cookie-es';

import Configuration from '~/components/modules/settings/Configuration';
import { createClient } from '~/utils/client';
import { PASSPHRASE_KEY } from '~/utils/constants';
import type { Route } from './+types/settings';

export function meta() {
  return [{ title: 'Settings | OrangeCloud' }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const client = createClient(request.headers, true);
  const passphrase = parse(request.headers.get('cookie') || '')[PASSPHRASE_KEY];

  try {
    const response = await client.config.$get();
    const config = await response.json();
    return { config: config.data, passphrase };
  } catch {
    return { config: null };
  }
}

const Settings = ({ loaderData }: Route.ComponentProps) => {
  return <Configuration config={loaderData.config} cookiePassphrase={loaderData.passphrase} />;
};

export default Settings;
