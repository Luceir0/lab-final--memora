import { buildApp, type BuildAppOptions } from './app.ts';
import { loadConfig, type AppConfig } from './config.ts';
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
  const app = await buildApp({ ...options, config });

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

  await app.listen({ port: config.apiPort, host: config.host });

  return app;
}
