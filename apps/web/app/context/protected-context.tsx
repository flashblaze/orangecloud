import type { InferResponseType } from 'hono';
import { createContext, useContext } from 'react';
import type { createClient } from '~/utils/client';

export const ProtectedContext = createContext<InferResponseType<
  ReturnType<typeof createClient>['session']['$get']
> | null>(null);

export function ProtectedProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: InferResponseType<ReturnType<typeof createClient>['session']['$get']>;
}) {
  return <ProtectedContext.Provider value={session}>{children}</ProtectedContext.Provider>;
}

export function useProtected() {
  const context = useContext(ProtectedContext);
  if (!context) {
    throw new Error('useProtected must be used within an ProtectedProvider');
  }
  return context;
}
