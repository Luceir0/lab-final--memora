import { emptyResponseSchema, healthResponseSchema } from '@memora/shared';
import type { ErrorResponse } from '@memora/shared';
import { describe, expect, it } from 'vitest';

import { createApiClient } from './client.js';
import { ApiError, ApiTransportError, TRANSPORT_ERROR_MESSAGES } from './errors.js';
import type { FetchLike } from './types.js';

interface FetchCall {
  readonly url: string;
  readonly init: RequestInit | undefined;
}

/** Replaces `fetch` with a stub that records every call. No network involved. */
function mockFetch(respond: (call: FetchCall) => Response | Promise<Response>): {
  fetchImpl: FetchLike;
  calls: FetchCall[];
} {
  const calls: FetchCall[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    const call: FetchCall = { url, init };
    calls.push(call);
    return respond(call);
  };
  return { fetchImpl, calls };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('La petición debía fallar y no lo hizo.');
}

const HEALTH_RESPONSE = {
  status: 'ok',
  version: '1.0.0',
  timestamp: '2026-11-01T10:00:00.000Z',
} as const;

const VALIDATION_ERROR: ErrorResponse = {
  code: 'VALIDATION_ERROR',
  message: 'Revisa los datos introducidos.',
  details: [{ field: 'email', message: 'Introduce un email válido.' }],
};

describe('createApiClient · éxito', () => {
  it('valida y devuelve el cuerpo de un 200', async () => {
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(HEALTH_RESPONSE));
    const client = createApiClient({ fetch: fetchImpl });

    const result = await client.get('/health', { schema: healthResponseSchema });

    expect(result).toEqual(HEALTH_RESPONSE);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe('/api/health');
    expect(calls[0]?.init?.method).toBe('GET');
    expect(calls[0]?.init?.credentials).toBe('include');
    expect(new Headers(calls[0]?.init?.headers).get('accept')).toBe('application/json');
  });

  it('envía JSON, cabeceras extra y la cookie de sesión en un POST', async () => {
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(HEALTH_RESPONSE, 201));
    const client = createApiClient({ fetch: fetchImpl });

    await client.post(
      '/auth/login',
      { email: 'lucia@example.com' },
      { schema: healthResponseSchema, headers: { 'x-csrf-token': 'abc' } },
    );

    const init = calls[0]?.init;
    expect(calls[0]?.url).toBe('/api/auth/login');
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('include');
    expect(init?.body).toBe(JSON.stringify({ email: 'lucia@example.com' }));

    const headers = new Headers(init?.headers);
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('x-csrf-token')).toBe('abc');
  });

  it('no sobrescribe un content-type explícito', async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response(null, { status: 204 }));
    const client = createApiClient({ fetch: fetchImpl });

    await client.patch(
      '/photos/photo_1',
      { description: 'Playa' },
      {
        schema: emptyResponseSchema,
        headers: { 'content-type': 'application/merge-patch+json' },
      },
    );

    expect(new Headers(calls[0]?.init?.headers).get('content-type')).toBe(
      'application/merge-patch+json',
    );
  });

  it('devuelve undefined en un 204 sin intentar parsear JSON', async () => {
    const { fetchImpl } = mockFetch(() => new Response(null, { status: 204 }));
    const client = createApiClient({ fetch: fetchImpl });

    await expect(
      client.delete('/auth/session', { schema: emptyResponseSchema }),
    ).resolves.toBeUndefined();
  });

  it('devuelve undefined con Content-Length: 0', async () => {
    const { fetchImpl } = mockFetch(
      () => new Response(null, { status: 200, headers: { 'content-length': '0' } }),
    );
    const client = createApiClient({ fetch: fetchImpl });

    await expect(client.get('/health', { schema: emptyResponseSchema })).resolves.toBeUndefined();
  });
});

describe('createApiClient · errores canónicos', () => {
  it('convierte un 400 canónico en ApiError con code, status y details', async () => {
    const { fetchImpl } = mockFetch(() => jsonResponse(VALIDATION_ERROR, 400));
    const client = createApiClient({ fetch: fetchImpl });

    const error = await captureError(
      client.post('/auth/login', {}, { schema: healthResponseSchema }),
    );

    expect(error).toBeInstanceOf(ApiError);
    if (!(error instanceof ApiError)) {
      throw new Error('Se esperaba ApiError.');
    }
    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual(VALIDATION_ERROR.details);
    expect(error.message).toBe(VALIDATION_ERROR.message);
  });

  it('convierte un 403 canónico en ApiError sin details', async () => {
    const forbidden: ErrorResponse = {
      code: 'FORBIDDEN',
      message: 'No tienes acceso a este círculo.',
      details: null,
    };
    const { fetchImpl } = mockFetch(() => jsonResponse(forbidden, 403));
    const client = createApiClient({ fetch: fetchImpl });

    const error = await captureError(
      client.get('/circles/circle_1', { schema: healthResponseSchema }),
    );

    expect(error).toBeInstanceOf(ApiError);
    if (!(error instanceof ApiError)) {
      throw new Error('Se esperaba ApiError.');
    }
    expect(error.status).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.details).toBeNull();
  });
});

describe('createApiClient · errores de transporte', () => {
  it('trata un 500 con cuerpo no canónico como error de transporte sin filtrar el cuerpo', async () => {
    const rawBody = 'TypeError: connection string postgres://secret@db';
    const { fetchImpl } = mockFetch(() => new Response(rawBody, { status: 500 }));
    const client = createApiClient({ fetch: fetchImpl });

    const error = await captureError(client.get('/health', { schema: healthResponseSchema }));

    expect(error).toBeInstanceOf(ApiTransportError);
    if (!(error instanceof ApiTransportError)) {
      throw new Error('Se esperaba ApiTransportError.');
    }
    expect(error.kind).toBe('unexpected-error-response');
    expect(error.status).toBe(500);
    expect(error.message).toBe(TRANSPORT_ERROR_MESSAGES['unexpected-error-response']);
    expect(error.message).not.toContain('secret');
  });

  it('trata un cuerpo canónico con código desconocido como error de transporte', async () => {
    const { fetchImpl } = mockFetch(() =>
      jsonResponse({ code: 'TEAPOT', message: 'Nope', details: null }, 418),
    );
    const client = createApiClient({ fetch: fetchImpl });

    const error = await captureError(client.get('/health', { schema: healthResponseSchema }));

    expect(error).toBeInstanceOf(ApiTransportError);
    if (!(error instanceof ApiTransportError)) {
      throw new Error('Se esperaba ApiTransportError.');
    }
    expect(error.kind).toBe('unexpected-error-response');
  });

  it('distingue un JSON inválido en un 200', async () => {
    const { fetchImpl } = mockFetch(
      () => new Response('<html>no soy json</html>', { status: 200 }),
    );
    const client = createApiClient({ fetch: fetchImpl });

    const error = await captureError(client.get('/health', { schema: healthResponseSchema }));

    expect(error).toBeInstanceOf(ApiTransportError);
    if (!(error instanceof ApiTransportError)) {
      throw new Error('Se esperaba ApiTransportError.');
    }
    expect(error.kind).toBe('invalid-json');
    expect(error.message).toBe(TRANSPORT_ERROR_MESSAGES['invalid-json']);
  });

  it('distingue un fallo de red y conserva la causa', async () => {
    const networkError = new TypeError('fetch failed');
    const { fetchImpl } = mockFetch(() => {
      throw networkError;
    });
    const client = createApiClient({ fetch: fetchImpl });

    const error = await captureError(client.get('/health', { schema: healthResponseSchema }));

    expect(error).toBeInstanceOf(ApiTransportError);
    if (!(error instanceof ApiTransportError)) {
      throw new Error('Se esperaba ApiTransportError.');
    }
    expect(error.kind).toBe('network');
    expect(error.cause).toBe(networkError);
    expect(error.message).toBe(TRANSPORT_ERROR_MESSAGES.network);
  });

  it('distingue un cuerpo que no cumple el esquema', async () => {
    const { fetchImpl } = mockFetch(() => jsonResponse({ status: 'degraded' }));
    const client = createApiClient({ fetch: fetchImpl });

    const error = await captureError(client.get('/health', { schema: healthResponseSchema }));

    expect(error).toBeInstanceOf(ApiTransportError);
    if (!(error instanceof ApiTransportError)) {
      throw new Error('Se esperaba ApiTransportError.');
    }
    expect(error.kind).toBe('invalid-response');
    expect(error.message).toBe(TRANSPORT_ERROR_MESSAGES['invalid-response']);
  });
});

describe('createApiClient · basePath', () => {
  it('une rutas con y sin barra final sin duplicarla', async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response(null, { status: 204 }));
    const withSlash = createApiClient({ basePath: '/api/', fetch: fetchImpl });

    await withSlash.delete('/health', { schema: emptyResponseSchema });
    await withSlash.delete('circles', { schema: emptyResponseSchema });

    expect(withSlash.basePath).toBe('/api');
    expect(calls[0]?.url).toBe('/api/health');
    expect(calls[1]?.url).toBe('/api/circles');
  });

  it('admite una URL absoluta para SSR', async () => {
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(HEALTH_RESPONSE));
    const client = createApiClient({
      basePath: 'http://127.0.0.1:3001',
      fetch: fetchImpl,
    });

    await client.get('/health', { schema: healthResponseSchema });

    expect(client.basePath).toBe('http://127.0.0.1:3001');
    expect(calls[0]?.url).toBe('http://127.0.0.1:3001/health');
  });

  it('usa /api por defecto', () => {
    const { fetchImpl } = mockFetch(() => new Response(null, { status: 204 }));
    const client = createApiClient({ fetch: fetchImpl });

    expect(client.basePath).toBe('/api');
  });
});

describe('createApiClient · query params', () => {
  it('omite undefined y serializa arrays como claves repetidas', async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response(null, { status: 204 }));
    const client = createApiClient({ fetch: fetchImpl });

    await client.get('/circles', {
      schema: emptyResponseSchema,
      query: { cursor: undefined, limit: 24, tags: ['playa', 'familia'], archived: false },
    });

    expect(calls[0]?.url).toBe('/api/circles?limit=24&tags=playa&tags=familia&archived=false');
  });

  it('mantiene la query incluida en el path', async () => {
    const { fetchImpl, calls } = mockFetch(() => new Response(null, { status: 204 }));
    const client = createApiClient({ fetch: fetchImpl });

    await client.get('/circles?view=grid', { schema: emptyResponseSchema, query: { limit: 1 } });

    expect(calls[0]?.url).toBe('/api/circles?view=grid&limit=1');
  });
});

describe('createApiClient · aborto', () => {
  it('propaga el signal al fetch', async () => {
    const controller = new AbortController();
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(HEALTH_RESPONSE));
    const client = createApiClient({ fetch: fetchImpl });

    await client.get('/health', { schema: healthResponseSchema, signal: controller.signal });

    expect(calls[0]?.init?.signal).toBe(controller.signal);
  });

  it('no envuelve un aborto en un error de transporte', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    const { fetchImpl } = mockFetch(() => {
      throw abortError;
    });
    const client = createApiClient({ fetch: fetchImpl });

    await expect(client.get('/health', { schema: healthResponseSchema })).rejects.toBe(abortError);
  });

  it('no envuelve un aborto durante la lectura del cuerpo', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    const { fetchImpl } = mockFetch(
      () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.error(abortError);
            },
          }),
          { status: 200 },
        ),
    );
    const client = createApiClient({ fetch: fetchImpl });

    await expect(client.get('/health', { schema: healthResponseSchema })).rejects.toBe(abortError);
  });
});
