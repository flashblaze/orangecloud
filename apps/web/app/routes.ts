import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('buckets/:name', 'routes/buckets/bucket.tsx'),
] satisfies RouteConfig;
