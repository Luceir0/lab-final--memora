import { describe, expect, it } from 'vitest';

import { buildQueryString, buildRequestUrl, joinUrl, normalizeBasePath } from './url.js';

describe('normalizeBasePath', () => {
  it('removes a trailing slash and surrounding whitespace', () => {
    expect(normalizeBasePath('/api/')).toBe('/api');
    expect(normalizeBasePath('  /api  ')).toBe('/api');
  });

  it('keeps absolute URLs intact', () => {
    expect(normalizeBasePath('http://127.0.0.1:3001/')).toBe('http://127.0.0.1:3001');
  });

  it('normalizes the root path to the empty string', () => {
    expect(normalizeBasePath('/')).toBe('');
    expect(normalizeBasePath('')).toBe('');
  });
});

describe('joinUrl', () => {
  it('joins a relative base path without duplicating the slash', () => {
    expect(joinUrl('/api', '/health')).toBe('/api/health');
    expect(joinUrl('/api/', '/health')).toBe('/api/health');
    expect(joinUrl('/api', 'health')).toBe('/api/health');
  });

  it('joins an absolute base URL for SSR', () => {
    expect(joinUrl('http://127.0.0.1:3001', '/health')).toBe('http://127.0.0.1:3001/health');
    expect(joinUrl('http://127.0.0.1:3001/', 'health')).toBe('http://127.0.0.1:3001/health');
  });

  it('keeps a single leading slash when there is no base path', () => {
    expect(joinUrl('', 'health')).toBe('/health');
    expect(joinUrl('/', 'health')).toBe('/health');
  });

  it('returns the base path when the relative path is empty', () => {
    expect(joinUrl('/api', '/')).toBe('/api');
    expect(joinUrl('/api', '')).toBe('/api');
  });
});

describe('buildQueryString', () => {
  it('skips undefined and null values', () => {
    expect(buildQueryString({ cursor: undefined, limit: 24, personId: null })).toBe('limit=24');
  });

  it('serializes arrays as repeated keys in order', () => {
    expect(buildQueryString({ tag: ['playa', 'familia'] })).toBe('tag=playa&tag=familia');
  });

  it('serializes numbers and booleans', () => {
    expect(buildQueryString({ limit: 24, archived: false })).toBe('limit=24&archived=false');
  });

  it('percent-encodes reserved characters', () => {
    expect(buildQueryString({ q: 'a b&c' })).toBe('q=a+b%26c');
  });

  it('returns an empty string when there is nothing to serialize', () => {
    expect(buildQueryString(undefined)).toBe('');
    expect(buildQueryString({})).toBe('');
    expect(buildQueryString({ empty: [] })).toBe('');
  });
});

describe('buildRequestUrl', () => {
  it('appends the serialized query', () => {
    expect(buildRequestUrl('/api', '/circles', { limit: 24 })).toBe('/api/circles?limit=24');
  });

  it('merges a query string already present in the path', () => {
    expect(buildRequestUrl('/api', '/circles?view=grid', { limit: 1 })).toBe(
      '/api/circles?view=grid&limit=1',
    );
  });

  it('does not add a question mark without query', () => {
    expect(buildRequestUrl('http://127.0.0.1:3001', '/health')).toBe(
      'http://127.0.0.1:3001/health',
    );
    expect(buildRequestUrl('/api', '/health', {})).toBe('/api/health');
  });
});
