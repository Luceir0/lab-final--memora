import { healthResponseSchema } from '@memora/shared';

import type { MemoraServer } from '../types.ts';
import { API_VERSION } from '../version.ts';

export interface HealthRouteOptions {
  /** Injectable clock so tests can assert the timestamp format. */
  readonly now?: () => Date;
  readonly version?: string;
}

/**
 * `GET /api/health` — liveness probe.
 *
 * Returns only status, version and timestamp: no session, database URL,
 * environment or build metadata (AC-01).
 */
export function registerHealthRoute(
  app: MemoraServer,
  options: HealthRouteOptions = {},
): void {
  app.get(
    '/api/health',
    {
      schema: {
        tags: ['Salud'],
        summary: 'Estado de la API',
        description:
          'Devuelve `status`, `version` y `timestamp`. No requiere sesión ni incluye datos sensibles.',
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async () => ({
      status: 'ok' as const,
      version: options.version ?? API_VERSION,
      timestamp: (options.now?.() ?? new Date()).toISOString(),
    }),
  );
}
