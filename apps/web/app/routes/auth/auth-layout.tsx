import { Outlet, redirect } from 'react-router';

import { createClient } from '~/utils/client';
import type { Route } from './+types/auth-layout';

export async function loader({ context, request }: Route.LoaderArgs) {
  const client = createClient(request.headers, true, context.cloudflare.env.API_URL);
  const response = await client.session.$get();
  const session = await response.json();
  if (session) {
    return redirect('/');
  }

  return null;
}

const AuthLayout = () => {
  return <Outlet />;
};

export default AuthLayout;
