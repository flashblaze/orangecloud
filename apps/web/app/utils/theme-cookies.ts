import type { MantineColorScheme } from '@mantine/core';

export const THEME_COOKIE_NAME = 'orangecloud-theme';

export type ThemePreference = 'light' | 'dark' | 'auto';

export function getThemeCookieName(environment?: string): string {
  if (!environment || environment === 'production') {
    return THEME_COOKIE_NAME;
  }
  return `${environment}_${THEME_COOKIE_NAME}`;
}

export function parseThemeFromCookie(cookieValue: string | null): ThemePreference {
  if (cookieValue === 'light' || cookieValue === 'dark' || cookieValue === 'auto') {
    return cookieValue;
  }
  return 'auto'; // Default fallback
}

export function resolveTheme(theme: ThemePreference): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }

  // For 'auto', we need to detect system preference
  // On server-side, we can't detect system preference reliably,
  // so we'll default to light and let client-side handle the sync
  if (typeof window === 'undefined') {
    return 'light'; // Server-side default
  }

  // Client-side system preference detection
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function createThemeScript(theme: ThemePreference): string {
  return `
    (function() {
      try {
        var theme = ${JSON.stringify(theme)};
        var resolvedTheme = theme === 'auto' 
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : theme;
        
        // Apply to documentElement for Tailwind
        if (resolvedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Apply to Mantine color scheme attribute
        document.documentElement.setAttribute('data-mantine-color-scheme', resolvedTheme);
        
        // Set up system preference listener for auto mode
        if (theme === 'auto') {
          var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          function handleChange() {
            var newTheme = mediaQuery.matches ? 'dark' : 'light';
            if (newTheme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            document.documentElement.setAttribute('data-mantine-color-scheme', newTheme);
          }
          mediaQuery.addEventListener('change', handleChange);
        }
      } catch (e) {
        console.warn('Theme script error:', e);
      }
    })();
  `;
}

export function syncTailwindWithMantine(colorScheme: MantineColorScheme): void {
  if (typeof window === 'undefined') return;

  const root = window.document.documentElement;

  if (colorScheme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set up listener for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    // Remove any existing listener to avoid duplicates
    mediaQuery.removeEventListener('change', handleChange);
    mediaQuery.addEventListener('change', handleChange);

    return;
  }

  // For explicit 'light' or 'dark' mode
  if (colorScheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
