import swaggerUi from '@fastify/swagger-ui';

import type { AppConfig } from '../config.ts';
import type { MemoraServer } from '../types.ts';

/**
 * Serves the generated OpenAPI document everywhere.
 *
 * Swagger UI is development/test-only: production exposes the JSON contract
 * but no interactive documentation, as required by the API contract.
 */
export async function registerDocsRoutes(
  app: MemoraServer,
  config: AppConfig,
): Promise<void> {
  app.get(
    '/api/openapi.json',
    {
      schema: { hide: true },
    },
    async (_request, reply) => {
      return reply.header('cache-control', 'no-store').send(app.swagger());
    },
  );

  if (config.isProduction) {
    return;
  }

  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      url: '/api/openapi.json',
      docExpansion: 'list',
      deepLinking: true,
    },
    // Helmet owns the CSP; this avoids a second, route-level CSP header.
    staticCSP: false,
  });
}
