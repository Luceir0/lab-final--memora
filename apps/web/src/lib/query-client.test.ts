import { ApiError, ApiTransportError } from '@memora/api-client';
import type { ErrorCode } from '@memora/shared';
import { describe, expect, it } from 'vitest';

import {
  MAX_QUERY_RETRIES,
  QUERY_STALE_TIME_MS,
  createQueryClient,
  shouldRetryQuery,
} from './query-client';

function apiError(status: number, code: ErrorCode): ApiError {
  return new ApiError(status, { code, message: 'Error de prueba', details: null });
}

describe('shouldRetryQuery', () => {
  it('no reintenta errores 4xx del contrato', () => {
    expect(shouldRetryQuery(0, apiError(400, 'VALIDATION_ERROR'))).toBe(false);
    expect(shouldRetryQuery(0, apiError(401, 'UNAUTHENTICATED'))).toBe(false);
    expect(shouldRetryQuery(0, apiError(404, 'NOT_FOUND'))).toBe(false);
    expect(shouldRetryQuery(0, apiError(429, 'RATE_LIMITED'))).toBe(false);
  });

  it('reintenta 5xx con un límite', () => {
    const serverError = apiError(500, 'INTERNAL_ERROR');

    expect(shouldRetryQuery(0, serverError)).toBe(true);
    expect(shouldRetryQuery(MAX_QUERY_RETRIES - 1, serverError)).toBe(true);
    expect(shouldRetryQuery(MAX_QUERY_RETRIES, serverError)).toBe(false);
  });

  it('reintenta errores de red con el mismo límite', () => {
    const networkError = new ApiTransportError('network');

    expect(shouldRetryQuery(0, networkError)).toBe(true);
    expect(shouldRetryQuery(MAX_QUERY_RETRIES - 1, networkError)).toBe(true);
    expect(shouldRetryQuery(MAX_QUERY_RETRIES, networkError)).toBe(false);
  });

  it('no reintenta fallos de contrato ni errores desconocidos', () => {
    expect(shouldRetryQuery(0, new ApiTransportError('invalid-json'))).toBe(false);
    expect(shouldRetryQuery(0, new ApiTransportError('invalid-response'))).toBe(false);
    expect(shouldRetryQuery(0, new Error('inesperado'))).toBe(false);
  });
});

describe('createQueryClient', () => {
  it('aplica staleTime y retry por defecto', () => {
    const options = createQueryClient().getDefaultOptions().queries;

    expect(options?.staleTime).toBe(QUERY_STALE_TIME_MS);
    expect(options?.refetchOnWindowFocus).toBe(false);
    expect(typeof options?.retry).toBe('function');
  });

  it('crea una instancia nueva en cada llamada, sin caché compartida', () => {
    const first = createQueryClient();
    const second = createQueryClient();

    expect(first).not.toBe(second);
    expect(first.getQueryCache()).not.toBe(second.getQueryCache());
  });
});
