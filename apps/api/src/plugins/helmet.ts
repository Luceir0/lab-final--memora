import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';

import type { AppConfig } from '../config.ts';

/**
 * Security headers. HSTS is only meaningful over HTTPS, so it stays disabled
 * outside production; the rest of the helmet defaults (nosniff, referrer
 * policy, CSP) apply everywhere.
 */
export async function registerHelmet(app: FastifyInstance, config: AppConfig): Promise<void> {
  await app.register(helmet, {
    hsts: config.isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    ...(config.isProduction
      ? {}
      : {
          // Swagger UI loads its scripts through <script src> (same origin), so
          // `script-src 'self'` is enough; it does use inline styles.
          // `upgrade-insecure-requests` would break /api/docs over local HTTP.
          // Production keeps helmet's strict defaults.
          contentSecurityPolicy: {
            directives: {
              upgradeInsecureRequests: null,
              styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
            },
          },
        }),
  });
}
