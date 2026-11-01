import { describe, expect, it } from 'vitest';

import { DEFAULT_BROWSER_API_BASE_PATH, resolveApiBasePath } from './env';

describe('resolveApiBasePath', () => {
  it('usa el fallback cuando el valor falta, está vacío o solo tiene espacios', () => {
    expect(resolveApiBasePath(undefined, DEFAULT_BROWSER_API_BASE_PATH)).toBe('/api');
    expect(resolveApiBasePath('', DEFAULT_BROWSER_API_BASE_PATH)).toBe('/api');
    expect(resolveApiBasePath('   ', DEFAULT_BROWSER_API_BASE_PATH)).toBe('/api');
  });

  it('respeta rutas y URLs absolutas sin barra final', () => {
    expect(resolveApiBasePath('/api', DEFAULT_BROWSER_API_BASE_PATH)).toBe('/api');
    expect(resolveApiBasePath('http://127.0.0.1:3001/api', DEFAULT_BROWSER_API_BASE_PATH)).toBe(
      'http://127.0.0.1:3001/api',
    );
  });

  it('quita una o varias barras finales', () => {
    expect(resolveApiBasePath('/api/', DEFAULT_BROWSER_API_BASE_PATH)).toBe('/api');
    expect(resolveApiBasePath('/api///', DEFAULT_BROWSER_API_BASE_PATH)).toBe('/api');
    expect(resolveApiBasePath('http://127.0.0.1:3001/api/', DEFAULT_BROWSER_API_BASE_PATH)).toBe(
      'http://127.0.0.1:3001/api',
    );
  });

  it('no devuelve una cadena vacía si el valor solo son barras', () => {
    expect(resolveApiBasePath('/', DEFAULT_BROWSER_API_BASE_PATH)).toBe('/api');
    expect(resolveApiBasePath('///', DEFAULT_BROWSER_API_BASE_PATH)).toBe('/api');
  });
});
