import { Outlet, redirect } from 'react-router';

import ProtectedLayout from '~/components/layout/ProtectedLayout';
import { ProtectedContext } from '~/context/protected-context';
import { createClient } from '~/utils/client';
import type { Route } from './+types/protected-layout';

export async function loader({ context, request }: Route.LoaderArgs) {
  const client = createClient(request.headers, true, context.cloudflare.env.API_URL);
  const response = await client.session.$get();
  const session = await response.json();
  if (!session) {
    return redirect('/auth/signup');
  }
  return Response.json({ session });
}

const ProtectedLayoutRoute = ({ loaderData }: Route.ComponentProps) => {
  const { session } = loaderData;
  return (
    <ProtectedContext.Provider value={session}>
      <ProtectedLayout>
        <Outlet />
      </ProtectedLayout>
    </ProtectedContext.Provider>
  );
};

export default ProtectedLayoutRoute;
