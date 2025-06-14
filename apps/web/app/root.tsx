/// <reference path="../worker-configuration.d.ts" />

import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { parse } from 'cookie-es';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
} from 'react-router';

import type { Route } from './+types/root';
import NavigationProgress from './components/NavigationProgress';
import { ThemeProvider } from './components/ThemeProvider';
import { EnvProvider } from './context/use-env';
import { createCookieColorSchemeManager } from './utils/color-scheme-manager';
import theme from './utils/theme';
import {
  createThemeScript,
  getThemeCookieName,
  parseThemeFromCookie,
  resolveTheme,
} from './utils/theme-cookies';

import './app.css';
import '@mantine/core/styles.layer.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.layer.css';
import '@mantine/notifications/styles.layer.css';
import '@mantine/nprogress/styles.layer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap',
  },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

export async function loader({ context, request }: Route.LoaderArgs) {
  // Extract theme from cookies for server-side rendering
  const cookieHeader = request.headers.get('Cookie') || '';
  const environment = context.cloudflare.env.ENVIRONMENT;

  const themeCookieName = getThemeCookieName(environment);
  const cookies = parse(cookieHeader);
  const themeCookie = cookies[themeCookieName];

  const themePreference = parseThemeFromCookie(themeCookie || null);
  const resolvedTheme = resolveTheme(themePreference);

  return {
    env: {
      apiUrl: context.cloudflare.env.API_URL,
      environment: context.cloudflare.env.ENVIRONMENT,
    },
    theme: themePreference,
    resolvedTheme,
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData<typeof loader>();
  const colorSchemeManager = createCookieColorSchemeManager(loaderData?.env?.environment);

  const themeScript = createThemeScript(loaderData?.theme || 'auto');

  return (
    <html
      lang="en"
      className={loaderData?.resolvedTheme === 'dark' ? 'dark' : ''}
      data-mantine-color-scheme={loaderData?.resolvedTheme || 'light'}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript defaultColorScheme={loaderData?.theme || 'auto'} />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for SSR theme sync
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <MantineProvider
            theme={theme}
            defaultColorScheme={loaderData?.theme || 'auto'}
            colorSchemeManager={colorSchemeManager}
          >
            <NavigationProgress />
            <ModalsProvider>
              <Notifications position="top-center" />
              <ThemeProvider>{children}</ThemeProvider>
            </ModalsProvider>
          </MantineProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { env } = useLoaderData<typeof loader>();
  return (
    <EnvProvider env={env}>
      <Outlet />
    </EnvProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
