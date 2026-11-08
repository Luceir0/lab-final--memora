import { buildApp, type BuildAppOptions } from './app.ts';
import { loadConfig, type AppConfig } from './config.ts';
import { startCleanupScheduler } from './maintenance/cleanup.ts';
import { createRuntimeServices } from './services/index.ts';
import type { MemoraServer } from './types.ts';

/** Closes Prisma only if a query ever created the client. */
async function disconnectDatabase(): Promise<void> {
  const { disconnectPrisma } = await import('./db.ts');

  await disconnectPrisma();
}

/**
 * Boots the API and installs graceful shutdown.
 *
 * Only this module listens on a port; everything under test uses
 * `buildApp()` + `inject()`.
 */
export async function startServer(
  config: AppConfig = loadConfig(),
  options: Omit<BuildAppOptions, 'config'> = {},
): Promise<MemoraServer> {
  const app = await buildApp({
    ...options,
    config,
    // Storage and geocoding are real only when their configuration is complete;
    // otherwise they fail closed and `kind` stays `'unavailable'`, so the
    // production guard rejects the boot. Tests inject fakes through `options`.
    services: options.services ?? createRuntimeServices(config),
  });

  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    app.log.info({ signal }, 'Stopping the Memora API');

    try {
      await app.close();
      await disconnectDatabase();
      process.exit(0);
    } catch (error) {
      app.log.error({ err: error }, 'Failed to stop the Memora API cleanly');
      process.exit(1);
    }
  };

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void shutdown(signal);
    });
  }

  // The scheduler must be started only by the listening process, never by
  // `buildApp()`: tests would leak an interval per app.
  let stopCleanup: (() => void) | null = null;

  app.addHook('onClose', async () => {
    stopCleanup?.();
    stopCleanup = null;
  });

  await app.listen({ port: config.apiPort, host: config.host });

  const prisma = app.prisma;

  if (prisma !== null) {
    stopCleanup = startCleanupScheduler({
      prisma,
      storage: app.services.storage,
      logger: app.log,
    });
  }

  return app;
}
