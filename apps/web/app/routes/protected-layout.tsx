import { Outlet, type ShouldRevalidateFunctionArgs, redirect } from 'react-router';

import ProtectedLayout from '~/components/layout/ProtectedLayout';
import { ProtectedContext } from '~/context/protected-context';
import { createClient } from '~/utils/client';
import type { Route } from './+types/protected-layout';

export async function loader({ request }: Route.LoaderArgs) {
  const client = createClient(request.headers, true);
  const response = await client.session.$get();
  const session = await response.json();
  if (!session) {
    return redirect('/auth/login');
  }
  return Response.json({ session });
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
