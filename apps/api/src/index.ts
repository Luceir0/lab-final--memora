import { loadConfig } from './config.ts';
import { startServer } from './server.ts';

/** Thin entry point: validate configuration, boot, and report fatal errors. */
try {
  const config = loadConfig();

  await startServer(config);
} catch (error) {
  const message =
    error instanceof Error ? error.message : 'Error desconocido al arrancar la API.';

  process.stderr.write(`[memora-api] ${message}\n`);
  process.exit(1);
}
