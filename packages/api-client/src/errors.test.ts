import { describe, expect, it } from 'vitest';

import {
  ApiError,
  ApiTransportError,
  isApiError,
  isApiTransportError,
  TRANSPORT_ERROR_MESSAGES,
} from './errors.js';

describe('ApiTransportError', () => {
  it('usa un mensaje seguro en español y status null', () => {
    const error = new ApiTransportError('network');

    expect(error.name).toBe('ApiTransportError');
    expect(error.kind).toBe('network');
    expect(error.status).toBeNull();
    expect(error.message).toBe(TRANSPORT_ERROR_MESSAGES.network);
  });

  it('conserva status y causa para diagnóstico', () => {
    const cause = new Error('boom');
    const error = new ApiTransportError('invalid-json', undefined, { status: 200, cause });

    expect(error.status).toBe(200);
    expect(error.cause).toBe(cause);
    expect(error.message).toBe(TRANSPORT_ERROR_MESSAGES['invalid-json']);
  });
});

describe('ApiError', () => {
  it('expone status, code, message y details', () => {
    const error = new ApiError(400, {
      code: 'VALIDATION_ERROR',
      message: 'Revisa los datos introducidos.',
      details: [{ field: 'email', message: 'Introduce un email válido.' }],
    });

    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Revisa los datos introducidos.');
    expect(error.details).toEqual([{ field: 'email', message: 'Introduce un email válido.' }]);
  });
});

describe('guards', () => {
  it('distingue ApiError de ApiTransportError', () => {
    const apiError = new ApiError(403, {
      code: 'FORBIDDEN',
      message: 'No tienes acceso a este círculo.',
      details: null,
    });
    const transportError = new ApiTransportError('invalid-response');

    expect(isApiError(apiError)).toBe(true);
    expect(isApiTransportError(apiError)).toBe(false);
    expect(isApiTransportError(transportError)).toBe(true);
    expect(isApiError(transportError)).toBe(false);
    expect(isApiError(new Error('otro'))).toBe(false);
    expect(isApiTransportError('no soy un error')).toBe(false);
  });
});
