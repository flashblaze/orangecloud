import { drizzle } from 'drizzle-orm/d1';

import type { Env } from '../types/hono-env.types';
import * as schema from './schema';

const createDb = (env: Env['Bindings']) => drizzle(env.ORANGECLOUD_DB, { schema });

export default createDb;
