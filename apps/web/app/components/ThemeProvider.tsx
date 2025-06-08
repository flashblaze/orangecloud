import { useMantineColorScheme } from '@mantine/core';
import { useEffect } from 'react';
import { syncTailwindWithMantine } from '~/utils/theme-cookies';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    // Sync Tailwind classes with Mantine's color scheme
    syncTailwindWithMantine(colorScheme);
  }, [colorScheme]);

  return <>{children}</>;
}
