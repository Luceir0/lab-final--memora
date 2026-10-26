/**
 * Default connection string used by local development and CI.
 *
 * The API never reads a real `.env`; callers (shell, Compose, CI) inject
 * `DATABASE_URL` when they need a database. The fallback exists so
 * `prisma generate` and `prisma validate` work without one.
 */
export const DEFAULT_DATABASE_URL =
  'postgresql://memora:memora@localhost:5432/memora?schema=public';

/** Returns the configured database URL or the local development fallback. */
export function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL;

  if (configured !== undefined && configured.trim() !== '') {
    return configured;
  }

  return DEFAULT_DATABASE_URL;
}
