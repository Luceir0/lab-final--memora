import type { MemoraServer } from '../build-server.ts';
import {
  API_VERSION,
  echoRequestSchema,
  echoResponseSchema,
  healthResponseSchema,
} from './schemas.ts';

/** Registers the F05 spike routes: health probe and typed echo. */
export function registerSpikeRoutes(server: MemoraServer): void {
  const app = server;

  app.get(
    '/api/health',
    {
      schema: {
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async () => ({
      status: 'ok' as const,
      version: API_VERSION,
      timestamp: new Date().toISOString(),
    }),
  );

  // TODO(F08): `/api/spike/echo` is temporary. Remove it once the real
  // endpoints defined by the shared contract land.
  app.post(
    '/api/spike/echo',
    {
      schema: {
        body: echoRequestSchema,
        response: {
          200: echoResponseSchema,
        },
      },
    },
    async (request) => ({
      message: request.body.message,
      receivedAt: new Date().toISOString(),
    }),
  );
}
