import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.ts';

/**
 * Database test helpers.
 *
 * They never create or migrate the database: CI and local runs inject
 * `DATABASE_URL` pointing at an already-migrated PostgreSQL instance. When it
 * is missing, database suites must be skipped instead of failing.
 *
 * Safety guard: these helpers truncate tables, so they only accept a
 * disposable test database — local host, name ending in `_test` and a test
 * environment (Vitest or `NODE_ENV=test`). Set `ALLOW_REMOTE_TEST_DB=1` only
 * to relax the host check for an intentional remote disposable database: the
 * `_test` suffix and the test-environment checks still apply. The guard
 * refuses to touch the development database.
 */

/** Model tables in a truncation-safe order. `_prisma_migrations` is preserved. */
const MODEL_TABLES = [
  'Activity',
  'DownloadJob',
  'PhotoTag',
  'Photo',
  'Album',
  'Invitation',
  'Membership',
  'Circle',
  'Session',
  'User',
] as const;

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const TEST_DATABASE_SUFFIX = '_test';
const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

interface TestDatabaseTarget {
  databaseUrl: string;
  hostname: string;
  databaseName: string;
  schema: string;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function readDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.trim() === '') {
    throw new Error(
      [
        'DATABASE_URL is not set, so the database test helpers cannot run.',
        'Point it at the disposable test database, for example:',
        '  DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api test',
        'Create it first with:',
        `  docker exec memora-postgres-1 psql -U memora -d memora -c 'CREATE DATABASE memora_test'`,
      ].join('\n'),
    );
  }

  return databaseUrl;
}

/**
 * Validates that `DATABASE_URL` points at a disposable test database.
 *
 * Returns the parsed target, including the schema used to qualify `TRUNCATE`.
 * Read the file header for the accepted host, name and environment rules.
 */
export function assertTestDatabase(): TestDatabaseTarget {
  const databaseUrl = readDatabaseUrl();
  const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.VITEST !== undefined;

  if (!isTestEnvironment) {
    throw new Error(
      [
        'The database test helpers only run inside the test environment.',
        'Expected NODE_ENV=test or VITEST to be set (Vitest sets it automatically).',
        'Run the suite with: pnpm --filter @memora/api test',
      ].join('\n'),
    );
  }

  let parsed: URL;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error(
      [
        'DATABASE_URL is not a valid URL, so the test database cannot be validated.',
        'Expected something like postgresql://memora:memora@127.0.0.1:5432/memora_test',
      ].join('\n'),
    );
  }

  const hostname = parsed.hostname;
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  const allowRemote = process.env.ALLOW_REMOTE_TEST_DB === '1';

  if (!allowRemote && !LOCAL_HOSTNAMES.has(hostname)) {
    throw new Error(
      [
        `Refusing to truncate a non-local database (host "${hostname}").`,
        'The test helpers expect localhost, 127.0.0.1 or ::1.',
        'Set ALLOW_REMOTE_TEST_DB=1 only for an intentional remote disposable database.',
      ].join('\n'),
    );
  }

  if (!databaseName.endsWith(TEST_DATABASE_SUFFIX)) {
    throw new Error(
      [
        `Refusing to truncate database "${databaseName}" because its name does not end in "${TEST_DATABASE_SUFFIX}".`,
        'The test helpers must never touch the development database.',
        'ALLOW_REMOTE_TEST_DB=1 relaxes only the host check, never this suffix.',
        'Create the test database with:',
        `  docker exec memora-postgres-1 psql -U memora -d memora -c 'CREATE DATABASE memora_test'`,
        'Then migrate and run the suite with:',
        '  DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api exec prisma migrate deploy',
        '  DATABASE_URL="postgresql://memora:memora@127.0.0.1:5432/memora_test" pnpm --filter @memora/api test',
      ].join('\n'),
    );
  }

  const schema = parsed.searchParams.get('schema') ?? 'public';

  if (!SAFE_IDENTIFIER.test(schema)) {
    throw new Error(`Unsafe schema name "${schema}" in DATABASE_URL; expected a plain identifier.`);
  }

  return { databaseUrl, hostname, databaseName, schema };
}

/** Returns whether a usable `DATABASE_URL` is present. */
export function hasDatabaseUrl(): boolean {
  const databaseUrl = process.env.DATABASE_URL;

  return databaseUrl !== undefined && databaseUrl.trim() !== '';
}

let testClient: PrismaClient | null = null;

/** Returns the lazily-created client used by database tests. */
export function getTestPrismaClient(): PrismaClient {
  if (testClient === null) {
    const target = assertTestDatabase();

    testClient = new PrismaClient({
      adapter: new PrismaPg({ connectionString: target.databaseUrl }),
    });
  }

  return testClient;
}

/** Empties every model table, restarting identity and cascading children. */
export async function resetDb(prisma: PrismaClient = getTestPrismaClient()): Promise<void> {
  const target = assertTestDatabase();
  const tables = MODEL_TABLES.map(
    (table) => `${quoteIdentifier(target.schema)}.${quoteIdentifier(table)}`,
  ).join(', ');

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}

/**
 * Resets the database and runs `run` with the test client.
 *
 * The client stays alive for the whole file; close it once in `afterAll`.
 */
export async function withCleanDb<T>(run: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  const prisma = getTestPrismaClient();
  await resetDb(prisma);

  return run(prisma);
}

/** Closes the shared test client, if it was created. */
export async function closeTestPrismaClient(): Promise<void> {
  if (testClient === null) {
    return;
  }

  const current = testClient;
  testClient = null;
  await current.$disconnect();
}
