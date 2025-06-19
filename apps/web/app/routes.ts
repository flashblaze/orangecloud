import { type RouteConfig, index, layout, prefix, route } from '@react-router/dev/routes';

export default [
  layout('./routes/protected-layout.tsx', [
    index('./routes/home.tsx'),
    route('buckets/:name', './routes/buckets/bucket.tsx'),
    route('settings', './routes/settings.tsx'),
  ]),
  ...prefix('auth', [
    layout('./routes/auth/auth-layout.tsx', [
      index('./routes/auth/index.tsx'),
      route('signup', './routes/auth/signup.tsx'),
      route('login', './routes/auth/login.tsx'),
    ]),
  ]),
] satisfies RouteConfig;
