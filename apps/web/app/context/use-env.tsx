import { createContext, useContext } from 'react';

interface EnvContextType {
  apiUrl: string;
  environment: string;
}

const EnvContext = createContext<EnvContextType | null>(null);

export function EnvProvider({ children, env }: { children: React.ReactNode; env: EnvContextType }) {
  return <EnvContext.Provider value={env}>{children}</EnvContext.Provider>;
}

export function useEnv() {
  const context = useContext(EnvContext);
  if (!context) {
    throw new Error('useEnv must be used within an EnvProvider');
  }
  return context;
}
