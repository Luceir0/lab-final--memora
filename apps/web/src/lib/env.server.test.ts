import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_SERVER_API_ORIGIN,
  INVALID_SERVER_API_ORIGIN_MESSAGE,
  buildServerApiBasePath,
  resolveServerApiOrigin,
} from './env.server';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveServerApiOrigin', () => {
  it('usa el origen por defecto cuando falta, está vacío o solo tiene espacios', () => {
    vi.stubEnv('API_INTERNAL_URL', undefined);
    expect(resolveServerApiOrigin()).toBe(DEFAULT_SERVER_API_ORIGIN);

    vi.stubEnv('API_INTERNAL_URL', '');
    expect(resolveServerApiOrigin()).toBe(DEFAULT_SERVER_API_ORIGIN);

    vi.stubEnv('API_INTERNAL_URL', '   ');
    expect(resolveServerApiOrigin()).toBe(DEFAULT_SERVER_API_ORIGIN);
  });

  it('acepta http y https y normaliza sin barra final', () => {
    expect(resolveServerApiOrigin('http://127.0.0.1:3001')).toBe('http://127.0.0.1:3001');
    expect(resolveServerApiOrigin('http://127.0.0.1:3001/')).toBe('http://127.0.0.1:3001');
    expect(resolveServerApiOrigin('https://api.memora.test/')).toBe('https://api.memora.test');
  });

  it('rechaza rutas relativas', () => {
    expect(() => resolveServerApiOrigin('/api')).toThrow(INVALID_SERVER_API_ORIGIN_MESSAGE);
  });

  it('rechaza protocolos que no sean http o https', () => {
    expect(() => resolveServerApiOrigin('ftp://host')).toThrow(INVALID_SERVER_API_ORIGIN_MESSAGE);
    expect(() => resolveServerApiOrigin('ws://host')).toThrow(INVALID_SERVER_API_ORIGIN_MESSAGE);
  });

  it('rechaza URLs incompletas', () => {
    expect(() => resolveServerApiOrigin('http://')).toThrow(INVALID_SERVER_API_ORIGIN_MESSAGE);
    expect(() => resolveServerApiOrigin('127.0.0.1:3001')).toThrow(
      INVALID_SERVER_API_ORIGIN_MESSAGE,
    );
  });

  it('rechaza rutas, credenciales, query y hash: debe ser un origen', () => {
    expect(() => resolveServerApiOrigin('http://host/api')).toThrow(
      INVALID_SERVER_API_ORIGIN_MESSAGE,
    );
    expect(() => resolveServerApiOrigin('http://user:pass@host')).toThrow(
      INVALID_SERVER_API_ORIGIN_MESSAGE,
    );
    expect(() => resolveServerApiOrigin('http://host?x=1')).toThrow(
      INVALID_SERVER_API_ORIGIN_MESSAGE,
    );
  });

  it('no incluye el valor ofensivo en el mensaje de error', () => {
    try {
      resolveServerApiOrigin('http://user:secreto@host/api');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe(INVALID_SERVER_API_ORIGIN_MESSAGE);
      expect((error as Error).message).not.toContain('secreto');
      return;
    }

    throw new Error('Se esperaba que resolveServerApiOrigin lanzara');
  });
});

describe('buildServerApiBasePath', () => {
  it('añade /api al origen sin dobles barras', () => {
    expect(buildServerApiBasePath('http://127.0.0.1:3001')).toBe('http://127.0.0.1:3001/api');
    expect(buildServerApiBasePath('http://127.0.0.1:3001/')).toBe('http://127.0.0.1:3001/api');
    expect(buildServerApiBasePath('http://127.0.0.1:3001//')).toBe('http://127.0.0.1:3001/api');
  });
});
