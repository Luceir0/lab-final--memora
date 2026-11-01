import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/prisma/client.ts';

let client: PrismaClient | null = null;
let clientUrl: string | null = null;

/**
 * Creates a Prisma client bound to an explicit database URL.
 *
 * The URL must come from validated configuration (`AppConfig.databaseUrl`);
 * this module has no silent fallback, so a production process cannot connect
 * to the development database by accident.
 */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });

  return new PrismaClient({ adapter });
}

/**
 * Returns the shared, lazily-created client for `databaseUrl`.
 *
 * Nothing connects until the first query, so `/api/health` keeps working
 * without a database. Calling it with a different URL is a configuration bug
 * and fails fast instead of silently reusing the first connection pool.
 */
export function getPrismaClient(databaseUrl: string): PrismaClient {
  if (client === null) {
    client = createPrismaClient(databaseUrl);
    clientUrl = databaseUrl;
  } else if (clientUrl !== databaseUrl) {
    throw new Error(
      'getPrismaClient recibió una DATABASE_URL distinta de la ya inicializada. La configuración debe ser única por proceso.',
    );
  }

  return client;
}

/** Closes the shared client, if it was ever created. */
export async function disconnectPrisma(): Promise<void> {
  if (client === null) {
    return;
  }

  const current = client;
  client = null;
  clientUrl = null;
  await current.$disconnect();
}
