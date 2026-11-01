import { buildApp } from '../app.ts';
import { loadConfig, type AppConfig } from '../config.ts';
import type { LogStream } from '../logging.ts';
import type { MemoraServer } from '../types.ts';
import { createFakeServices, type FakeServices } from './fakes.ts';
import { registerTestRoutes } from './routes.ts';

/** 42 characters: satisfies the 32-character minimum. */
export const TEST_SESSION_SECRET = 'memora-test-session-secret-0123456789';

/** Test database URL: validated but never connected by the HTTP suite. */
export const TEST_DATABASE_URL = 'postgresql://memora:memora@127.0.0.1:5432/memora_test';

export interface TestAppOptions {
  /** Extra environment overrides merged over the test defaults. */
  readonly env?: NodeJS.ProcessEnv;
  /** When present, pino writes JSON lines to this stream instead of stdout. */
  readonly loggerStream?: LogStream;
  readonly rateLimitMax?: number;
  readonly testRoutes?: boolean;
  readonly services?: FakeServices;
  /**
   * Marks the test fakes as real for production-config tests.
   *
   * This is a code-boundary escape hatch, not a security mechanism: `kind` is
   * a plain discriminant that any adapter can claim (see handoff).
   */
  readonly markServicesReal?: boolean;
}

export interface TestApp {
  readonly app: MemoraServer;
  readonly config: AppConfig;
  readonly services: FakeServices;
  close(): Promise<void>;
}

/**
 * Boots the API for a test without opening a port.
 *
 * `inject()` is enough for every HTTP assertion, so the suite is fast and
 * cannot collide with a real server. Rate limiting is permissive by default;
 * tests that assert 429 lower the ceiling explicitly.
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  const config = loadConfig({
    NODE_ENV: 'test',
    SESSION_SECRET: TEST_SESSION_SECRET,
    DATABASE_URL: TEST_DATABASE_URL,
    LOG_LEVEL: 'silent',
    ...options.env,
  });

  const services = options.services ?? createFakeServices();
  const servicesForApp =
    options.markServicesReal === true
      ? { ...services, kind: 'real' as const }
      : services;

  const app = await buildApp({
    config,
    services: servicesForApp,
    logger: options.loggerStream === undefined ? false : true,
    ...(options.loggerStream === undefined ? {} : { loggerStream: options.loggerStream }),
    ...(options.rateLimitMax === undefined ? {} : { rateLimitMax: options.rateLimitMax }),
  });

  if (options.testRoutes === true) {
    registerTestRoutes(app);
  }

  await app.ready();

  return {
    app,
    config,
    services,
    close: async () => {
      await app.close();
    },
  };
}
