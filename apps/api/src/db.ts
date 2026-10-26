import { PrismaPg } from '@prisma/adapter-pg';

import { resolveDatabaseUrl } from './db-url.ts';
import { PrismaClient } from './generated/prisma/client.ts';

let client: PrismaClient | null = null;

/**
 * Returns a lazily-created Prisma client.
 *
 * Nothing connects until the first query, so `/api/health` keeps working
 * without `DATABASE_URL` and without a running database.
 */
export function getPrismaClient(): PrismaClient {
  if (client === null) {
    const adapter = new PrismaPg({ connectionString: resolveDatabaseUrl() });
    client = new PrismaClient({ adapter });
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
  await current.$disconnect();
}
