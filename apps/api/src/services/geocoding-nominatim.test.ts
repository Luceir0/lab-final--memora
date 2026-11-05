import { MAX_PLACE_NAME_LENGTH } from '@memora/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createNominatimGeocodingService,
  GEOCODING_MIN_INTERVAL_MS,
  GEOCODING_TIMEOUT_MS,
} from './geocoding-nominatim.ts';

interface RecordedRequest {
  readonly url: URL;
  readonly headers: Headers;
  readonly signal: AbortSignal | null;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function requestUrl(input: string | URL | Request): URL {
  if (input instanceof URL) {
    return input;
  }

  return new URL(typeof input === 'string' ? input : input.url);
}

function createClock(start = 0): {
  readonly now: () => number;
  readonly sleep: (milliseconds: number) => Promise<void>;
  readonly sleeps: number[];
} {
  let current = start;
  const sleeps: number[] = [];

  return {
    sleeps,
    now: () => current,
    sleep: async (milliseconds: number) => {
      sleeps.push(milliseconds);
      current += milliseconds;
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createNominatimGeocodingService', () => {
  it('returns the display name and sends an identifiable User-Agent', async () => {
    const requests: RecordedRequest[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      requests.push({
        url: requestUrl(input),
        headers: new Headers(init?.headers),
        signal: init?.signal ?? null,
      });

      return jsonResponse({ display_name: 'Palma, Mallorca' });
    };
    const geocoding = createNominatimGeocodingService({
      baseUrl: 'https://nominatim.openstreetmap.org/',
      userAgent: 'Memora-test/0.1 (dev@memora.local)',
      fetch: fetchImpl,
      now: () => 0,
      sleep: async () => undefined,
    });

    await expect(geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 })).resolves.toBe(
      'Palma, Mallorca',
    );

    expect(requests).toHaveLength(1);
    const [request] = requests;
    expect(request?.url.origin).toBe('https://nominatim.openstreetmap.org');
    expect(request?.url.pathname).toBe('/reverse');
    expect(request?.url.searchParams.get('format')).toBe('jsonv2');
    expect(request?.url.searchParams.get('lat')).toBe('39.570');
    expect(request?.url.searchParams.get('lon')).toBe('2.650');
    expect(request?.headers.get('user-agent')).toBe('Memora-test/0.1 (dev@memora.local)');
    expect(request?.signal).toBeInstanceOf(AbortSignal);
  });

  it('uses a 3-second timeout by default', () => {
    expect(GEOCODING_TIMEOUT_MS).toBe(3_000);
    expect(GEOCODING_MIN_INTERVAL_MS).toBe(1_000);
  });

  it('caches by coordinates rounded to 3 decimals', async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;

      return jsonResponse({ display_name: 'Palma, Mallorca' });
    };
    const clock = createClock();
    const geocoding = createNominatimGeocodingService({
      baseUrl: 'https://nominatim.openstreetmap.org',
      userAgent: 'Memora-test/0.1',
      fetch: fetchImpl,
      now: clock.now,
      sleep: clock.sleep,
    });

    await expect(geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 })).resolves.toBe(
      'Palma, Mallorca',
    );
    await expect(geocoding.reverse({ latitude: 39.56971, longitude: 2.65019 })).resolves.toBe(
      'Palma, Mallorca',
    );
    await expect(geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 })).resolves.toBe(
      'Palma, Mallorca',
    );

    expect(calls).toBe(1);
    expect(clock.sleeps).toEqual([]);
  });

  it('deduplicates concurrent lookups for the same rounded key', async () => {
    let calls = 0;
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      await gate;

      return jsonResponse({ display_name: 'Palma, Mallorca' });
    };
    const clock = createClock();
    const geocoding = createNominatimGeocodingService({
      baseUrl: 'https://nominatim.openstreetmap.org',
      userAgent: 'Memora-test/0.1',
      fetch: fetchImpl,
      now: clock.now,
      sleep: clock.sleep,
    });

    const first = geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 });
    const second = geocoding.reverse({ latitude: 39.56961, longitude: 2.65021 });

    await vi.waitFor(() => {
      expect(calls).toBe(1);
    });
    release?.();

    await expect(Promise.all([first, second])).resolves.toEqual([
      'Palma, Mallorca',
      'Palma, Mallorca',
    ]);
    expect(calls).toBe(1);
  });

  it('waits at least one second between distinct requests', async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;

      return jsonResponse({ display_name: `Lugar ${calls}` });
    };
    const clock = createClock();
    const geocoding = createNominatimGeocodingService({
      baseUrl: 'https://nominatim.openstreetmap.org',
      userAgent: 'Memora-test/0.1',
      fetch: fetchImpl,
      now: clock.now,
      sleep: clock.sleep,
    });

    await geocoding.reverse({ latitude: 39.569, longitude: 2.65 });
    await geocoding.reverse({ latitude: 39.57, longitude: 2.651 });
    await geocoding.reverse({ latitude: 39.571, longitude: 2.652 });

    expect(calls).toBe(3);
    expect(clock.sleeps).toEqual([1_000, 1_000]);
  });

  it('returns null on timeout without throwing', async () => {
    const fetchImpl: typeof fetch = async () => {
      throw Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' });
    };
    const geocoding = createNominatimGeocodingService({
      baseUrl: 'https://nominatim.openstreetmap.org',
      userAgent: 'Memora-test/0.1',
      fetch: fetchImpl,
      now: () => 0,
      sleep: async () => undefined,
    });

    await expect(geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 })).resolves.toBeNull();
  });

  it('bounds the total deadline, including queue wait, and does not fetch twice', async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = () => {
      calls += 1;

      // Simulates a connection that never resolves and ignores the abort signal.
      return new Promise<Response>(() => undefined);
    };
    const geocoding = createNominatimGeocodingService({
      baseUrl: 'https://nominatim.openstreetmap.org',
      userAgent: 'Memora-test/0.1',
      fetch: fetchImpl,
      timeoutMs: 40,
      minIntervalMs: 5,
    });

    const first = geocoding.reverse({ latitude: 39.569, longitude: 2.65 });
    const second = geocoding.reverse({ latitude: 39.57, longitude: 2.651 });

    await expect(Promise.all([first, second])).resolves.toEqual([null, null]);
    expect(calls).toBe(1);
  });

  it('rejects new lookups when the queue is full', async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = () => {
      calls += 1;

      return new Promise<Response>(() => undefined);
    };
    const geocoding = createNominatimGeocodingService({
      baseUrl: 'https://nominatim.openstreetmap.org',
      userAgent: 'Memora-test/0.1',
      fetch: fetchImpl,
      timeoutMs: 60,
      minIntervalMs: 5,
      maxQueueDepth: 1,
    });

    const first = geocoding.reverse({ latitude: 39.569, longitude: 2.65 });

    await vi.waitFor(() => {
      expect(calls).toBe(1);
    });

    await expect(geocoding.reverse({ latitude: 39.57, longitude: 2.651 })).resolves.toBeNull();
    expect(calls).toBe(1);
    await expect(first).resolves.toBeNull();
  });

  it('truncates display_name before caching', async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;

      return jsonResponse({ display_name: 'x'.repeat(500) });
    };
    const geocoding = createNominatimGeocodingService({
      baseUrl: 'https://nominatim.openstreetmap.org',
      userAgent: 'Memora-test/0.1',
      fetch: fetchImpl,
      sleep: async () => undefined,
    });

    const first = await geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 });
    const second = await geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 });

    expect(first).toHaveLength(MAX_PLACE_NAME_LENGTH);
    expect(second).toHaveLength(MAX_PLACE_NAME_LENGTH);
    expect(calls).toBe(1);
  });

  it('returns null on HTTP errors', async () => {
    const fetchImpl: typeof fetch = async () => jsonResponse({ error: 'busy' }, 503);
    const geocoding = createNominatimGeocodingService({
      baseUrl: 'https://nominatim.openstreetmap.org',
      userAgent: 'Memora-test/0.1',
      fetch: fetchImpl,
      now: () => 0,
      sleep: async () => undefined,
    });

    await expect(geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 })).resolves.toBeNull();
  });

  it('returns null on invalid payloads', async () => {
    for (const payload of [{}, { display_name: 42 }, { display_name: '   ' }, null]) {
      const fetchImpl: typeof fetch = async () => jsonResponse(payload);
      const geocoding = createNominatimGeocodingService({
        baseUrl: 'https://nominatim.openstreetmap.org',
        userAgent: 'Memora-test/0.1',
        fetch: fetchImpl,
        now: () => 0,
        sleep: async () => undefined,
      });

      await expect(geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 })).resolves.toBeNull();
    }
  });

  it('returns null when the body cannot be parsed', async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response('not-json', { status: 200, headers: { 'content-type': 'application/json' } });
    const geocoding = createNominatimGeocodingService({
      baseUrl: 'https://nominatim.openstreetmap.org',
      userAgent: 'Memora-test/0.1',
      fetch: fetchImpl,
      now: () => 0,
      sleep: async () => undefined,
    });

    await expect(geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 })).resolves.toBeNull();
  });

  it('rejects invalid coordinates without calling the service', async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;

      return jsonResponse({ display_name: 'Palma' });
    };
    const geocoding = createNominatimGeocodingService({
      baseUrl: 'https://nominatim.openstreetmap.org',
      userAgent: 'Memora-test/0.1',
      fetch: fetchImpl,
      now: () => 0,
      sleep: async () => undefined,
    });

    await expect(
      geocoding.reverse({ latitude: Number.NaN, longitude: 2.6502 }),
    ).resolves.toBeNull();
    await expect(geocoding.reverse({ latitude: 91, longitude: 2.6502 })).resolves.toBeNull();
    await expect(geocoding.reverse({ latitude: 39.5696, longitude: 181 })).resolves.toBeNull();

    expect(calls).toBe(0);
  });

  it('never logs coordinates', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    const fetchImpl: typeof fetch = async () => jsonResponse({ display_name: 'Palma, Mallorca' });
    const geocoding = createNominatimGeocodingService({
      baseUrl: 'https://nominatim.openstreetmap.org',
      userAgent: 'Memora-test/0.1',
      fetch: fetchImpl,
      now: () => 0,
      sleep: async () => undefined,
    });

    await geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 });
    await geocoding.reverse({ latitude: 39.5696, longitude: 2.6502 });

    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleInfo).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleDebug).not.toHaveBeenCalled();
  });
});
