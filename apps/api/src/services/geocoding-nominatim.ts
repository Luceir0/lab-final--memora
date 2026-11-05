import { MAX_PLACE_NAME_LENGTH } from '@memora/shared';

import type { GeocodingService, ReverseGeocodingInput } from './geocoding.ts';

/** Nominatim is best-effort: a slow answer must not hold the upload route. */
export const GEOCODING_TIMEOUT_MS = 3_000;

/** Nominatim's usage policy allows at most one request per second. */
export const GEOCODING_MIN_INTERVAL_MS = 1_000;

/** Hard cap for queued lookups; beyond this, callers get `null` immediately. */
export const GEOCODING_MAX_QUEUE_DEPTH = 32;

/** Coordinates are rounded before caching so nearby photos share a lookup. */
const CACHE_PRECISION = 3;

const DEFAULT_CACHE_LIMIT = 500;

export interface NominatimGeocodingOptions {
  readonly baseUrl: string;
  /** Identifiable agent required by Nominatim's usage policy. */
  readonly userAgent: string;
  /** Injected in tests; defaults to the global `fetch`. */
  readonly fetch?: typeof fetch;
  /** Injectable clock in milliseconds; defaults to `Date.now`. */
  readonly now?: () => number;
  /** Injectable wait used by the rate limiter; defaults to `setTimeout`. */
  readonly sleep?: (milliseconds: number) => Promise<void>;
  readonly timeoutMs?: number;
  readonly minIntervalMs?: number;
  readonly cacheLimit?: number;
  readonly maxQueueDepth?: number;
}

interface RoundedCoordinates {
  readonly latitude: string;
  readonly longitude: string;
  readonly key: string;
}

function roundCoordinate(value: number): number {
  const rounded = Math.round(value * 1000) / 1000;

  return Object.is(rounded, -0) ? 0 : rounded;
}

function normalise(input: ReverseGeocodingInput): RoundedCoordinates | null {
  const { latitude, longitude } = input;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  const roundedLatitude = roundCoordinate(latitude);
  const roundedLongitude = roundCoordinate(longitude);

  return {
    latitude: roundedLatitude.toFixed(CACHE_PRECISION),
    longitude: roundedLongitude.toFixed(CACHE_PRECISION),
    key: `${roundedLatitude.toFixed(CACHE_PRECISION)},${roundedLongitude.toFixed(CACHE_PRECISION)}`,
  };
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function readDisplayName(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const displayName = (payload as { readonly display_name?: unknown }).display_name;

  if (typeof displayName !== 'string') {
    return null;
  }

  const trimmed = displayName.trim();

  // Truncate before caching so a long Nominatim answer cannot inflate memory.
  return trimmed === '' ? null : trimmed.slice(0, MAX_PLACE_NAME_LENGTH);
}

/**
 * Server-side reverse geocoding through Nominatim.
 *
 * - Rounds coordinates to 3 decimals and caches successful results in memory.
 * - Serialises requests and waits at least one second between them.
 * - Never throws: invalid input, timeouts, HTTP errors and malformed payloads
 *   all resolve to `null`, so the photo is saved without a place.
 * - Never persists or logs coordinates; only the returned `placeName` leaves
 *   this module.
 */
export function createNominatimGeocodingService(
  options: NominatimGeocodingOptions,
): GeocodingService {
  const fetchImpl = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? defaultSleep;
  const timeoutMs = options.timeoutMs ?? GEOCODING_TIMEOUT_MS;
  const minIntervalMs = options.minIntervalMs ?? GEOCODING_MIN_INTERVAL_MS;
  const cacheLimit = Math.max(1, options.cacheLimit ?? DEFAULT_CACHE_LIMIT);
  const maxQueueDepth = Math.max(1, options.maxQueueDepth ?? GEOCODING_MAX_QUEUE_DEPTH);
  const baseUrl = options.baseUrl.replace(/\/+$/, '');

  const cache = new Map<string, string>();
  const pending = new Map<string, Promise<string | null>>();

  let lastRequestAt: number | undefined;
  let queue: Promise<void> = Promise.resolve();

  /** Runs one lookup at a time so the rate limit holds under concurrency. */
  function schedule<T>(task: () => Promise<T>): Promise<T> {
    const result = queue.then(task, task);
    queue = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }

  function remember(key: string, placeName: string): void {
    if (!cache.has(key) && cache.size >= cacheLimit) {
      const oldest = cache.keys().next().value;

      if (oldest !== undefined) {
        cache.delete(oldest);
      }
    }

    cache.set(key, placeName);
  }

  /**
   * Races `work` against an absolute deadline.
   *
   * The timer starts immediately, not when the queued task gets its turn, so a
   * caller waiting behind the one-request-per-second queue is bounded too.
   */
  function withDeadline<T>(
    work: () => Promise<T>,
    deadline: number,
    onExpire: () => void,
  ): Promise<T | null> {
    return new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(
        () => {
          if (settled) {
            return;
          }

          settled = true;
          onExpire();
          resolve(null);
        },
        Math.max(0, deadline - now()),
      );

      void work().then(
        (value) => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timer);
          resolve(value);
        },
        () => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timer);
          resolve(null);
        },
      );
    });
  }

  async function requestPlaceName(
    coordinates: RoundedCoordinates,
    deadline: number,
    isCancelled: () => boolean,
  ): Promise<string | null> {
    try {
      if (isCancelled() || now() >= deadline) {
        return null;
      }

      if (lastRequestAt !== undefined) {
        const elapsed = now() - lastRequestAt;

        if (elapsed < minIntervalMs) {
          const wait = minIntervalMs - elapsed;

          // The wait alone would exhaust the caller's budget: do not enqueue a
          // request that could never complete before its deadline.
          if (now() + wait >= deadline) {
            return null;
          }

          await sleep(wait);
        }
      }

      // A queued task may have expired while it waited for the previous fetch.
      if (isCancelled() || now() + 1 >= deadline) {
        return null;
      }

      lastRequestAt = now();

      const url = new URL(`${baseUrl}/reverse`);
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('lat', coordinates.latitude);
      url.searchParams.set('lon', coordinates.longitude);

      const response = await fetchImpl(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'user-agent': options.userAgent,
        },
        signal: AbortSignal.timeout(Math.max(1, deadline - now())),
      });

      if (isCancelled() || now() >= deadline) {
        return null;
      }

      if (!response.ok) {
        return null;
      }

      return readDisplayName(await response.json());
    } catch {
      // Best-effort: never leaks the failure (or the coordinates) to the caller.
      return null;
    }
  }

  return {
    async reverse(input: ReverseGeocodingInput): Promise<string | null> {
      const coordinates = normalise(input);

      if (coordinates === null) {
        return null;
      }

      const deadline = now() + timeoutMs;

      const cached = cache.get(coordinates.key);

      if (cached !== undefined) {
        return cached;
      }

      let cancelled = false;
      const expire = (): void => {
        cancelled = true;
      };

      const inFlight = pending.get(coordinates.key);

      if (inFlight !== undefined) {
        try {
          return await withDeadline(() => inFlight, deadline, expire);
        } catch {
          return null;
        }
      }

      // Backpressure: beyond the cap the caller gets `null` instead of growing
      // an unbounded queue while Nominatim is slow.
      if (pending.size >= maxQueueDepth) {
        return null;
      }

      const request = schedule(async () => {
        // A queued lookup may have filled the cache while this one waited.
        const queuedCached = cache.get(coordinates.key);

        if (queuedCached !== undefined) {
          return queuedCached;
        }

        return withDeadline(
          async () => {
            const placeName = await requestPlaceName(coordinates, deadline, () => cancelled);

            if (placeName !== null) {
              remember(coordinates.key, placeName);
            }

            return placeName;
          },
          deadline,
          expire,
        );
      });

      pending.set(coordinates.key, request);

      try {
        return await withDeadline(() => request, deadline, expire);
      } catch {
        return null;
      } finally {
        pending.delete(coordinates.key);
      }
    },
  };
}
