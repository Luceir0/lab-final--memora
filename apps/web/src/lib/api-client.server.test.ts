import { healthResponseSchema } from '@memora/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createServerApiClient, resolveServerApiBasePath } from './api-client.server';
import { INVALID_SERVER_API_ORIGIN_MESSAGE } from './env.server';

const healthBody = {
  status: 'ok' as const,
  version: '0.1.0',
  timestamp: '2026-11-01T10:00:00.000Z',
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveServerApiBasePath', () => {
  it('usa el origen por defecto más /api cuando API_INTERNAL_URL no existe', () => {
    vi.stubEnv('API_INTERNAL_URL', undefined);

    expect(resolveServerApiBasePath()).toBe('http://127.0.0.1:3001/api');
  });

  it('usa el origen configurado más /api y cae al default si está vacío', () => {
    vi.stubEnv('API_INTERNAL_URL', '');
    expect(resolveServerApiBasePath()).toBe('http://127.0.0.1:3001/api');

    vi.stubEnv('API_INTERNAL_URL', 'http://127.0.0.1:9999');
    expect(resolveServerApiBasePath()).toBe('http://127.0.0.1:9999/api');
  });

  it('normaliza la barra final del origen', () => {
    expect(resolveServerApiBasePath('http://127.0.0.1:3001/')).toBe('http://127.0.0.1:3001/api');
    expect(resolveServerApiBasePath('http://127.0.0.1:3001')).toBe('http://127.0.0.1:3001/api');
  });

  it('cae al valor por defecto si recibe una cadena vacía', () => {
    expect(resolveServerApiBasePath('')).toBe('http://127.0.0.1:3001/api');
    expect(resolveServerApiBasePath('   ')).toBe('http://127.0.0.1:3001/api');
  });
});

describe('createServerApiClient', () => {
  it('llama a /api/health sobre el origen por defecto, sin red real', async () => {
    vi.stubEnv('API_INTERNAL_URL', undefined);
    const fetchMock = vi.fn(async (_input: string, _init?: RequestInit) =>
      jsonResponse(healthBody),
    );

    const client = createServerApiClient({ fetch: fetchMock });
    const health = await client.get('/health', { schema: healthResponseSchema });

    expect(health).toEqual(healthBody);
    expect(client.basePath).toBe('http://127.0.0.1:3001/api');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://127.0.0.1:3001/api/health');
  });

  it('usa la URL base configurada para tests sin dobles barras', async () => {
    const fetchMock = vi.fn(async (_input: string, _init?: RequestInit) =>
      jsonResponse(healthBody),
    );
    const client = createServerApiClient({
      basePath: 'http://127.0.0.1:3001/api/',
      fetch: fetchMock,
    });

    const health = await client.get('/health', { schema: healthResponseSchema });

    expect(health).toEqual(healthBody);
    expect(client.basePath).toBe('http://127.0.0.1:3001/api');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://127.0.0.1:3001/api/health');
  });

  it('ignora un API_INTERNAL_URL inválido si se pasa base explícita', async () => {
    vi.stubEnv('API_INTERNAL_URL', '/api');
    const fetchMock = vi.fn(async (_input: string, _init?: RequestInit) =>
      jsonResponse(healthBody),
    );
    const client = createServerApiClient({
      basePath: 'http://127.0.0.1:3001/api',
      fetch: fetchMock,
    });

    const health = await client.get('/health', { schema: healthResponseSchema });

    expect(health).toEqual(healthBody);
    expect(client.basePath).toBe('http://127.0.0.1:3001/api');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://127.0.0.1:3001/api/health');
  });

  it('falla al crear sin base si API_INTERNAL_URL es inválida', () => {
    vi.stubEnv('API_INTERNAL_URL', '/api');

    expect(() => createServerApiClient()).toThrow(INVALID_SERVER_API_ORIGIN_MESSAGE);
  });
});
