import type { MantineColorScheme, MantineColorSchemeManager } from '@mantine/core';
import { parse, serialize } from 'cookie-es';
import { getThemeCookieName, parseThemeFromCookie, syncTailwindWithMantine } from './theme-cookies';

export function createCookieColorSchemeManager(environment?: string): MantineColorSchemeManager {
  const cookieName = getThemeCookieName(environment);

  return {
    get: (defaultValue?: MantineColorScheme): MantineColorScheme => {
      if (typeof window === 'undefined') {
        return defaultValue || 'auto';
      }

      try {
        const cookies = parse(document.cookie);
        const cookieValue = cookies[cookieName];
        const theme = parseThemeFromCookie(cookieValue || null);

        // Return the actual theme preference, let Mantine handle 'auto' resolution
        return theme as MantineColorScheme;
      } catch (error) {
        console.warn('Error reading theme from cookie:', error);
        return defaultValue || 'auto';
      }
    },

    set: (value: MantineColorScheme) => {
      if (typeof window === 'undefined') return;

      try {
        const maxAge = 60 * 60 * 24 * 365; // 1 year
        const secure = window.location.protocol === 'https:';
        const domain = window.location.hostname.includes('orangecloud.app')
          ? '.orangecloud.app'
          : undefined;

        const cookieString = serialize(cookieName, value, {
          maxAge,
          path: '/',
          sameSite: 'lax',
          secure,
          domain,
        });

        document.cookie = cookieString;

        // Sync with Tailwind
        syncTailwindWithMantine(value);
      } catch (error) {
        console.warn('Error setting theme cookie:', error);
      }
    },

    subscribe: (onUpdate: (colorScheme: MantineColorScheme) => void) => {
      if (typeof window === 'undefined') {
        return () => {
          // No-op for server-side
        };
      }

      const handleStorageChange = (event: StorageEvent) => {
        if (event.key === cookieName && event.newValue) {
          const theme = parseThemeFromCookie(event.newValue);
          onUpdate(theme as MantineColorScheme);
        }
      };

      // Listen to system preference changes for auto mode
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleMediaChange = () => {
        const cookies = parse(document.cookie);
        const currentTheme = parseThemeFromCookie(cookies[cookieName] || null);

        if (currentTheme === 'auto') {
          syncTailwindWithMantine('auto');
        }
      };

      window.addEventListener('storage', handleStorageChange);
      mediaQuery.addEventListener('change', handleMediaChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        mediaQuery.removeEventListener('change', handleMediaChange);
      };
    },

    unsubscribe: () => {
      // This method is required by the interface but not used in practice
      // The actual unsubscription is handled by the function returned from subscribe
    },

    clear: () => {
      if (typeof window === 'undefined') return;

      try {
        const domain = window.location.hostname.includes('orangecloud.app')
          ? '.orangecloud.app'
          : undefined;

        const cookieString = serialize(cookieName, '', {
          expires: new Date(0), // Set expiry to epoch to delete
          path: '/',
          domain,
        });

        document.cookie = cookieString;
      } catch (error) {
        console.warn('Error clearing theme cookie:', error);
      }
    },
  };
}
