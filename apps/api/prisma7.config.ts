import { defineConfig } from 'prisma/config';

import { resolveDatabaseUrl } from './src/db-url.ts';

/**
 * Prisma 7 configuration.
 *
 * Prisma 7 discovers `prisma7.config.ts` in the package root. The datasource
 * URL lives here instead of `schema.prisma`, which keeps `prisma generate`
 * working in CI without a database.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.ts',
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
