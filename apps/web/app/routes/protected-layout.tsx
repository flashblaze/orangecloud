import { parse, serialize } from 'cookie-es';
import { useEffect } from 'react';
import {
  Outlet,
  redirect,
  type ShouldRevalidateFunctionArgs,
  useLocation,
  useNavigate,
} from 'react-router';
import ProtectedLayout from '~/components/layout/ProtectedLayout';
import { createCookieOptions } from '~/components/modules/settings/SavePassphraseInBrowser';
import { ProtectedContext } from '~/context/protected-context';
import { createClient } from '~/utils/client';
import { PASSPHRASE_KEY } from '~/utils/constants';
import type { Route } from './+types/protected-layout';

export async function loader({ request }: Route.LoaderArgs) {
  const client = createClient(request.headers, true);
  const response = await client.session.$get();
  const session = await response.json();
  if (!session) {
    return redirect('/auth/login');
  }

  const userConfigResponse = await client.config.$get();
  const userConfig = await userConfigResponse.json();
  const passphrase = parse(request.headers.get('cookie') || '')[PASSPHRASE_KEY];
  const validateConfigResponse = await client.config.validate.$get();
  const validateConfig = await validateConfigResponse.json();

  if ((!userConfig.data || !passphrase) && !request.url.includes('/settings')) {
    return redirect('/settings');
  }

  return { session, validateConfig };
}

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

const ProtectedLayoutRoute = ({ loaderData }: Route.ComponentProps) => {
  const { session, validateConfig } = loaderData;
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (validateConfig?.message.includes('Invalid passphrase')) {
      document.cookie = serialize(PASSPHRASE_KEY, '', createCookieOptions(0));
      window.location.reload();
      if (!location.pathname.includes('/settings')) {
        navigate('/settings');
      }
    }
  }, [validateConfig, location, navigate]);

  return (
    <ProtectedContext.Provider value={session}>
      <ProtectedLayout>
        <Outlet />
      </ProtectedLayout>
    </ProtectedContext.Provider>
  );
};

export default ProtectedLayoutRoute;
