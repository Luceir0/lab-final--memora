import { describe, expect, it } from 'vitest';

import {
  ERROR_CODES,
  ERROR_HTTP_STATUS,
  ERROR_MESSAGES,
  defaultErrorMessage,
  errorCodeSchema,
  errorResponseSchema,
  isApiSuccess,
  type ApiResult,
  type ErrorCode,
} from './errors.js';

const CANONICAL_CODES: readonly ErrorCode[] = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'ALBUM_NOT_EMPTY',
  'FILE_TOO_LARGE',
  'PAYLOAD_TOO_LARGE',
  'QUOTA_EXCEEDED',
  'UNSUPPORTED_MEDIA_TYPE',
  'UNPROCESSABLE_ENTITY',
  'INVALID_IMAGE',
  'PROCESSING_FAILED',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
];

describe('error catalogue', () => {
  it('matches the canonical api-contract table exactly', () => {
    expect([...ERROR_CODES].sort()).toEqual([...CANONICAL_CODES].sort());
    expect(errorCodeSchema.options).toEqual([...ERROR_CODES]);
  });

  it('maps every code to the documented HTTP status', () => {
    expect(ERROR_HTTP_STATUS).toEqual({
      VALIDATION_ERROR: 400,
      UNAUTHENTICATED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      CONFLICT: 409,
      ALBUM_NOT_EMPTY: 409,
      FILE_TOO_LARGE: 413,
      PAYLOAD_TOO_LARGE: 413,
      QUOTA_EXCEEDED: 413,
      UNSUPPORTED_MEDIA_TYPE: 415,
      UNPROCESSABLE_ENTITY: 422,
      INVALID_IMAGE: 422,
      PROCESSING_FAILED: 422,
      RATE_LIMITED: 429,
      INTERNAL_ERROR: 500,
    });
  });

  it('has a non-empty Spanish message for every code', () => {
    for (const code of ERROR_CODES) {
      expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
      expect(defaultErrorMessage(code)).toBe(ERROR_MESSAGES[code]);
    }

    expect(ERROR_MESSAGES.FORBIDDEN).toBe('No tienes acceso a este círculo.');
  });
});

describe('errorResponseSchema', () => {
  it('defaults details to null', () => {
    const parsed = errorResponseSchema.parse({
      code: 'FORBIDDEN',
      message: 'No tienes acceso a este círculo.',
    });

    expect(parsed).toEqual({
      code: 'FORBIDDEN',
      message: 'No tienes acceso a este círculo.',
      details: null,
    });
  });

  it('accepts field, resource and limit details', () => {
    const parsed = errorResponseSchema.parse({
      code: 'VALIDATION_ERROR',
      message: 'Revisa los datos introducidos.',
      details: [
        { field: 'email', message: 'Introduce un email válido.' },
        { resource: 'password' },
        { limit: 25 },
      ],
    });

    expect(parsed.details).toHaveLength(3);
    expect(parsed.details?.[0]?.field).toBe('email');
    expect(parsed.details?.[1]?.resource).toBe('password');
    expect(parsed.details?.[2]?.limit).toBe(25);
  });

  it('rejects an empty details array', () => {
    const parsed = errorResponseSchema.safeParse({
      code: 'NOT_FOUND',
      message: 'No encontramos lo que buscas.',
      details: [],
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects unknown codes and empty messages', () => {
    expect(errorResponseSchema.safeParse({ code: 'CLIENT_ERROR', message: 'x' }).success).toBe(
      false,
    );
    expect(errorResponseSchema.safeParse({ code: 'CONFLICT', message: '' }).success).toBe(false);
  });

  it('rejects negative limits', () => {
    expect(
      errorResponseSchema.safeParse({
        code: 'FILE_TOO_LARGE',
        message: 'El archivo supera el tamaño máximo permitido.',
        details: [{ limit: -1 }],
      }).success,
    ).toBe(false);
  });

  it('rejects empty detail objects', () => {
    expect(
      errorResponseSchema.safeParse({
        code: 'CONFLICT',
        message: 'La operación no se puede completar por un conflicto.',
        details: [{}],
      }).success,
    ).toBe(false);
  });

  it('accepts details explicitly set to null', () => {
    expect(
      errorResponseSchema.parse({
        code: 'INTERNAL_ERROR',
        message: 'Ha ocurrido un error inesperado.',
        details: null,
      }).details,
    ).toBeNull();
  });
});

describe('ApiResult', () => {
  it('narrows success results', () => {
    const result: ApiResult<{ id: string }> = { ok: true, data: { id: 'photo-1' } };

    expect(isApiSuccess(result)).toBe(true);

    if (isApiSuccess(result)) {
      expect(result.data.id).toBe('photo-1');
    }
  });

  it('narrows failure results with a typed error', () => {
    const result: ApiResult<never> = {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: ERROR_MESSAGES.NOT_FOUND,
        details: null,
      },
    };

    expect(isApiSuccess(result)).toBe(false);

    if (!isApiSuccess(result)) {
      expect(result.error.code).toBe('NOT_FOUND');
      expect(result.error.details).toBeNull();
    }
  });
});
