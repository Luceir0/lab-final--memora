import { healthResponseSchema } from '@memora/shared';
import { describe, expect, it, vi } from 'vitest';

import { createBrowserApiClient, resolveBrowserApiBasePath } from './api-client';

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

describe('resolveBrowserApiBasePath', () => {
  it('usa /api cuando VITE_API_BASE_URL falta o está vacía', () => {
    expect(resolveBrowserApiBasePath(undefined)).toBe('/api');
    expect(resolveBrowserApiBasePath('')).toBe('/api');
    expect(resolveBrowserApiBasePath('  ')).toBe('/api');
  });

  it('acepta una ruta con barra final y la normaliza', () => {
    expect(resolveBrowserApiBasePath('/api/')).toBe('/api');
    expect(resolveBrowserApiBasePath('/api')).toBe('/api');
  });
});

describe('createBrowserApiClient', () => {
  it('usa el base path configurado y no llama a la red real', async () => {
    const fetchMock = vi.fn(async (_input: string, _init?: RequestInit) =>
      jsonResponse(healthBody),
    );
    const client = createBrowserApiClient({ basePath: '/api/', fetch: fetchMock });

    const health = await client.get('/health', { schema: healthResponseSchema });

    expect(health).toEqual(healthBody);
    expect(client.basePath).toBe('/api');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/health');
  });

  it('cae a /api si la base recibida está vacía', () => {
    const client = createBrowserApiClient({ basePath: '' });

    expect(client.basePath).toBe(resolveBrowserApiBasePath());
  });
});
