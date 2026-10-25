import { buildServer } from './build-server.ts';

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = '127.0.0.1';

function resolvePort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_PORT;
  }

  const port = Number.parseInt(raw, 10);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`API_PORT must be a port between 1 and 65535, received "${raw}"`);
  }

  return port;
}

const port = resolvePort(process.env.API_PORT);
const host = process.env.HOST ?? DEFAULT_HOST;
const server = buildServer();

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void server.close().finally(() => {
      process.exit(0);
    });
  });
}

try {
  await server.listen({ port, host });
} catch (error) {
  server.log.error(error, 'Failed to start the Memora API');
  process.exit(1);
}
