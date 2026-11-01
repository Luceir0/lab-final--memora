import { ApiError, ApiTransportError } from '@memora/api-client';
import { describe, expect, it } from 'vitest';

import { GENERIC_ERROR_MESSAGE, getErrorMessage } from './error-message';

describe('getErrorMessage', () => {
  it('usa el mensaje seguro del contrato para ApiError', () => {
    const error = new ApiError(404, {
      code: 'NOT_FOUND',
      message: 'No hemos encontrado este círculo.',
      details: null,
    });

    expect(getErrorMessage(error)).toBe('No hemos encontrado este círculo.');
  });

  it('usa el mensaje de transporte para ApiTransportError', () => {
    expect(getErrorMessage(new ApiTransportError('network'))).toBe(
      'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    );
  });

  it('no filtra el mensaje de un Error desconocido', () => {
    const message = getErrorMessage(new Error('boom'));

    expect(message).toBe(GENERIC_ERROR_MESSAGE);
    expect(message).not.toContain('boom');
  });

  it('cae al mensaje genérico cuando el error no aporta nada seguro', () => {
    expect(getErrorMessage(new Error('   '))).toBe(GENERIC_ERROR_MESSAGE);
    expect(getErrorMessage(undefined)).toBe(GENERIC_ERROR_MESSAGE);
  });
});
