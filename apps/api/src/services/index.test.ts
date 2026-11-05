import { describe, expect, it } from 'vitest';

import { loadConfig } from '../config.ts';
import { createRuntimeServices } from './index.ts';

const COMPLETE_S3 = {
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'memora-test',
  S3_ACCESS_KEY_ID: 'memora',
  S3_SECRET_ACCESS_KEY: 'memora123',
  S3_FORCE_PATH_STYLE: 'true',
} as const;

const COMPLETE_GEOCODING = {
  GEOCODING_BASE_URL: 'https://nominatim.openstreetmap.org',
  GEOCODING_USER_AGENT: 'Memora-test/0.1 (dev@memora.local)',
} as const;

describe('createRuntimeServices', () => {
  it('marks services as real only when storage and geocoding are configured', () => {
    const config = loadConfig({ ...COMPLETE_S3, ...COMPLETE_GEOCODING });
    const services = createRuntimeServices(config);

    expect(services.kind).toBe('real');
  });

  it('keeps storage failing closed when S3 is incomplete', async () => {
    const config = loadConfig({ ...COMPLETE_GEOCODING });
    const services = createRuntimeServices(config);

    expect(services.kind).toBe('unavailable');
    await expect(services.storage.get('circles/c1/photos/p1/original.jpg')).rejects.toThrow(
      /no está configurado/,
    );
  });

  it('keeps geocoding failing closed when Nominatim is incomplete', async () => {
    const config = loadConfig({ ...COMPLETE_S3 });
    const services = createRuntimeServices(config);

    expect(services.kind).toBe('unavailable');
    await expect(
      services.geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 }),
    ).rejects.toThrow(/no está configurado/);
  });

  it('keeps kind unavailable when a single S3 value is missing', () => {
    const config = loadConfig({
      ...COMPLETE_S3,
      S3_SECRET_ACCESS_KEY: '',
      ...COMPLETE_GEOCODING,
    });
    const services = createRuntimeServices(config);

    expect(services.kind).toBe('unavailable');
  });
});
