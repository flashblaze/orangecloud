import { createContext, useContext } from 'react';

interface ProtectedContextType {
  session: {
    session: {
      id: string;
      token: string;
      userId: string;
      expiresAt: Date;
      createdAt: Date;
      updatedAt: Date;
      ipAddress?: string | null;
      userAgent?: string | null;
    };
    user: {
      id: string;
      name: string;
      emailVerified: boolean;
      email: string;
      createdAt: Date;
      updatedAt: Date;
      image?: string | null;
    };
  };
}

export const ProtectedContext = createContext<ProtectedContextType['session'] | null>(null);

export function ProtectedProvider({
  children,
  session,
}: { children: React.ReactNode; session: ProtectedContextType['session'] }) {
  return <ProtectedContext.Provider value={session}>{children}</ProtectedContext.Provider>;
}

export function useProtected() {
  const context = useContext(ProtectedContext);
  if (!context) {
    throw new Error('useProtected must be used within an ProtectedProvider');
  }
  return context;
}
