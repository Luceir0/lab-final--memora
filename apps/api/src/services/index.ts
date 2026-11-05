import type { AppConfig } from '../config.ts';
import { createEmailService, type EmailService } from './email/index.ts';
import { createNominatimGeocodingService } from './geocoding-nominatim.ts';
import type { GeocodingService } from './geocoding.ts';
import { createS3StorageService } from './storage-s3.ts';
import type { StorageService } from './storage.ts';

export type { EmailMessage, EmailService } from './email/index.ts';
export type { NominatimGeocodingOptions } from './geocoding-nominatim.ts';
export type { GeocodingService, ReverseGeocodingInput } from './geocoding.ts';
export type { S3ClientLike, S3StorageOptions } from './storage-s3.ts';
export { StorageError } from './storage-s3.ts';
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
      `${name} no está configurado. La API no llama a servicios externos reales sin configuración.`,
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

function createStorageFromConfig(config: AppConfig): StorageService | null {
  const { s3Endpoint, s3Region, s3Bucket, s3AccessKeyId, s3SecretAccessKey } = config;

  if (
    s3Endpoint === undefined ||
    s3Region === undefined ||
    s3Bucket === undefined ||
    s3AccessKeyId === undefined ||
    s3SecretAccessKey === undefined
  ) {
    return null;
  }

  return createS3StorageService({
    endpoint: s3Endpoint,
    region: s3Region,
    bucket: s3Bucket,
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
    forcePathStyle: config.s3ForcePathStyle,
  });
}

function createGeocodingFromConfig(config: AppConfig): GeocodingService | null {
  if (
    config.geocodingProvider !== 'nominatim' ||
    config.geocodingBaseUrl === undefined ||
    config.geocodingUserAgent === undefined
  ) {
    return null;
  }

  return createNominatimGeocodingService({
    baseUrl: config.geocodingBaseUrl,
    userAgent: config.geocodingUserAgent,
  });
}

/**
 * Services for a real process.
 *
 * Email is always a real adapter (Mailpit or Resend). Storage and geocoding
 * only become real when their configuration is complete; otherwise they keep
 * failing closed. `kind` is `'real'` only when all three are available, so
 * `buildApp()` keeps rejecting partial production boots.
 */
export function createRuntimeServices(config: AppConfig): Services {
  const unavailable = createUnavailableServices();
  const storage = createStorageFromConfig(config);
  const geocoding = createGeocodingFromConfig(config);

  return {
    kind: storage !== null && geocoding !== null ? 'real' : 'unavailable',
    storage: storage ?? unavailable.storage,
    email: createEmailService(config),
    geocoding: geocoding ?? unavailable.geocoding,
  };
}

declare module 'fastify' {
  interface FastifyInstance {
    services: Services;
  }
}
