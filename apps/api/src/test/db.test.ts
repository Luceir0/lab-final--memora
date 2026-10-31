import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { assertTestDatabase } from './db.ts';

const TEST_DATABASE_URL = 'postgresql://memora:memora@127.0.0.1:5432/memora_test';
const ENV_KEYS = ['DATABASE_URL', 'NODE_ENV', 'VITEST', 'ALLOW_REMOTE_TEST_DB'] as const;

type EnvKey = (typeof ENV_KEYS)[number];

const originalEnv = new Map<EnvKey, string | undefined>();

beforeEach(() => {
  for (const key of ENV_KEYS) {
    originalEnv.set(key, process.env[key]);
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv.get(key);

    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  originalEnv.clear();
});

/** Clears the guard-related environment and applies the given values. */
function setEnv(values: Partial<Record<EnvKey, string>>): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      process.env[key] = value;
    }
  }
}

describe('assertTestDatabase', () => {
  it('accepts a local *_test database with NODE_ENV=test', () => {
    setEnv({ DATABASE_URL: TEST_DATABASE_URL, NODE_ENV: 'test' });

    expect(assertTestDatabase()).toMatchObject({
      hostname: '127.0.0.1',
      databaseName: 'memora_test',
      schema: 'public',
    });
  });

  it('accepts a local *_test database with VITEST only', () => {
    setEnv({ DATABASE_URL: TEST_DATABASE_URL, VITEST: 'true' });

    expect(assertTestDatabase()).toMatchObject({
      hostname: '127.0.0.1',
      databaseName: 'memora_test',
    });
  });

  it('rejects the development database without the _test suffix', () => {
    setEnv({
      DATABASE_URL: 'postgresql://memora:memora@127.0.0.1:5432/memora',
      NODE_ENV: 'test',
    });

    expect(() => assertTestDatabase()).toThrow(/does not end in "_test"/);
  });

  it('rejects a remote host', () => {
    setEnv({
      DATABASE_URL: 'postgresql://memora:memora@db.example.com:5432/memora_test',
      NODE_ENV: 'test',
    });

    expect(() => assertTestDatabase()).toThrow(/non-local database/);
  });

  it('rejects an environment that is not a test environment', () => {
    setEnv({ DATABASE_URL: TEST_DATABASE_URL });

    expect(() => assertTestDatabase()).toThrow(/only run inside the test environment/);
  });

  it('rejects an invalid database URL', () => {
    setEnv({ DATABASE_URL: 'not a valid url', NODE_ENV: 'test' });

    expect(() => assertTestDatabase()).toThrow(/not a valid URL/);
  });

  it('rejects an empty database URL', () => {
    setEnv({ DATABASE_URL: '   ', NODE_ENV: 'test' });

    expect(() => assertTestDatabase()).toThrow(/DATABASE_URL is not set/);
  });

  it('ALLOW_REMOTE_TEST_DB=1 accepts a remote host when the name ends in _test', () => {
    setEnv({
      DATABASE_URL: 'postgresql://memora:memora@db.example.com:5432/memora_test',
      NODE_ENV: 'test',
      ALLOW_REMOTE_TEST_DB: '1',
    });

    expect(assertTestDatabase()).toMatchObject({
      hostname: 'db.example.com',
      databaseName: 'memora_test',
    });
  });

  it('ALLOW_REMOTE_TEST_DB=1 never relaxes the _test suffix', () => {
    setEnv({
      DATABASE_URL: 'postgresql://memora:memora@db.example.com:5432/memora',
      NODE_ENV: 'test',
      ALLOW_REMOTE_TEST_DB: '1',
    });

    expect(() => assertTestDatabase()).toThrow(/does not end in "_test"/);
  });
});
