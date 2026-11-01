import type { QueryParams } from './types.js';

/**
 * Normalizes a base path or URL by removing surrounding whitespace and any
 * trailing slash. The root path `/` normalizes to the empty string so joining
 * always yields a single leading slash.
 */
export function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim();
  if (trimmed === '' || trimmed === '/') {
    return '';
  }
  return trimmed.replace(/\/+$/, '');
}

/**
 * Joins a base path or absolute URL with a relative path without duplicating
 * or losing slashes.
 *
 * `joinUrl('/api/', '/health')` → `/api/health`
 * `joinUrl('http://127.0.0.1:3001', 'health')` → `http://127.0.0.1:3001/health`
 */
export function joinUrl(basePath: string, path: string): string {
  const base = normalizeBasePath(basePath);
  const suffix = path.trim().replace(/^\/+/, '');
  if (suffix === '') {
    return base;
  }
  return base === '' ? `/${suffix}` : `${base}/${suffix}`;
}

/**
 * Serializes query parameters deterministically.
 *
 * - `undefined` and `null` are skipped.
 * - Arrays become repeated keys, preserving their order.
 * - Keys keep the object insertion order.
 * - Values are percent-encoded by `URLSearchParams`.
 */
export function buildQueryString(query?: QueryParams): string {
  if (query === undefined) {
    return '';
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      params.append(key, String(value));
      continue;
    }
    for (const item of value) {
      params.append(key, String(item));
    }
  }
  return params.toString();
}

/**
 * Builds the final request URL from the base path, the path and its query.
 *
 * A query string already present in `path` is kept and merged before the
 * serialized `query` object.
 */
export function buildRequestUrl(basePath: string, path: string, query?: QueryParams): string {
  const queryIndex = path.indexOf('?');
  const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const inlineQuery = queryIndex === -1 ? '' : path.slice(queryIndex + 1);
  const url = joinUrl(basePath, pathname);
  const search = [inlineQuery, buildQueryString(query)].filter((part) => part !== '').join('&');
  return search === '' ? url : `${url}?${search}`;
}
