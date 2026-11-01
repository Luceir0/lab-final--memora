import type { EmailService } from './email.ts';
import type { GeocodingService } from './geocoding.ts';
import type { StorageService } from './storage.ts';

export type { EmailMessage, EmailService } from './email.ts';
export type { GeocodingService, ReverseGeocodingInput } from './geocoding.ts';
export type { StorageService, StoredObject } from './storage.ts';

/**
 * Discriminates the fail-closed defaults, test doubles and real adapters.
 *
 * This is a code boundary, not a security control: any object can claim
 * `kind: 'real'`. What it guarantees is that `buildApp()` rejects the
 * fail-closed defaults and the test fakes in production, and that
 * `src/test/**` is excluded from the production build. Real adapters must set
 * it explicitly when F25 implements them.
 */
export type ServicesKind = 'unavailable' | 'fake' | 'real';

/** Services every product module receives through Fastify decorations. */
export interface Services {
  readonly kind: ServicesKind;
  readonly storage: StorageService;
  readonly email: EmailService;
  readonly geocoding: GeocodingService;
}

function notConfigured(name: string): Promise<never> {
  return Promise.reject(
    new Error(
      `${name} no está configurado. La API no llama a servicios externos reales en F08.`,
    ),
  );
}

/** True only for adapters explicitly marked as real implementations. */
export function isRealServices(services: Services): boolean {
  return services.kind === 'real';
}

/**
 * Placeholder adapters used when no implementation is injected.
 *
 * Shipping working defaults would silently hit the network; failing closed
 * keeps external services behind explicit adapters (F25+).
 */
export function createUnavailableServices(): Services {
  const services: Services = {
    kind: 'unavailable',
    storage: {
      put: () => notConfigured('StorageService'),
      get: () => notConfigured('StorageService'),
      delete: () => notConfigured('StorageService'),
    },
    email: {
      send: () => notConfigured('EmailService'),
    },
    geocoding: {
      reverse: () => notConfigured('GeocodingService'),
    },
  };

  return services;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: Services;
  }
}
