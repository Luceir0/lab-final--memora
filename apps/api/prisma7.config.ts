import { defineConfig } from 'prisma/config';

import { DEFAULT_DATABASE_URL, resolveRequiredDatabaseUrl } from './src/db-url.ts';

/**
 * Prisma evaluates this file for every CLI command.
 *
 * Only `generate` may run without a database URL because it does not open a
 * connection. `migrate *`, `db *`, `push` and `execute` must fail loudly
 * instead of silently using the local fallback and touching the wrong
 * database.
 */
function usesDatabaseConnection(argv: readonly string[]): boolean {
  // process.argv = [node, prisma-cli-entry, command, ...args].
  return argv[2] !== 'generate';
}

const generationUrl = process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.ts',
  },
  datasource: {
    url: usesDatabaseConnection(process.argv) ? resolveRequiredDatabaseUrl() : generationUrl,
  },
});
