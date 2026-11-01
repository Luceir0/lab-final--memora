/**
 * Default connection string used only by `prisma generate` in local tooling.
 *
 * Generation does not open a connection. Every command that connects to a
 * database (migrations, seed, db push/execute) must provide `DATABASE_URL`
 * explicitly and fails otherwise.
 */
export const DEFAULT_DATABASE_URL =
  'postgresql://memora:memora@localhost:5432/memora?schema=public';

/**
 * Returns `DATABASE_URL` or fails.
 *
 * Used by the Prisma CLI for commands that connect, and by the seed. The
 * message never includes the value, so credentials cannot leak into logs.
 */
export function resolveRequiredDatabaseUrl(source: NodeJS.ProcessEnv = process.env): string {
  const configured = source.DATABASE_URL;

  if (configured === undefined || configured.trim() === '') {
    throw new Error(
      'DATABASE_URL es obligatoria para migraciones, seed y comandos que abren conexión. ' +
        'Configúrala en el entorno del proceso.',
    );
  }

  return configured;
}
