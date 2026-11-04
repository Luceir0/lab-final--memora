import { ApiError, ApiTransportError } from '@memora/api-client';
import { describe, expect, it } from 'vitest';

import {
  collectCircleFieldErrors,
  formatCircleErrorCode,
  getCirclesErrorCopy,
  mapCreateCircleError,
} from './errors';

function apiError(status: number, message = 'Error del servidor'): ApiError {
  return new ApiError(status, {
    code: status === 401 ? 'UNAUTHENTICATED' : status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR',
    message,
    details: null,
  });
}

describe('getCirclesErrorCopy', () => {
  it('trata el 401 como sesión caducada', () => {
    const copy = getCirclesErrorCopy(apiError(401), 'list');

    expect(copy.title).toBe('Tu sesión ha caducado');
    expect(copy.description).toContain('Vuelve a entrar');
  });

  it('explica el 403 sin filtrar datos', () => {
    const copy = getCirclesErrorCopy(apiError(403), 'list');

    expect(copy.title).toBe('No tienes acceso a estos círculos');
  });

  it('mantiene el título del diseño para un 500', () => {
    const copy = getCirclesErrorCopy(apiError(500), 'list');

    expect(copy.title).toBe('No hemos podido cargar tus círculos');
    expect(copy.description).toContain('Tus fotos siguen a salvo');
  });

  it('explica el 429 con una espera', () => {
    const copy = getCirclesErrorCopy(apiError(429), 'create');

    expect(copy.title).toBe('Demasiadas peticiones');
    expect(copy.description).toContain('Espera unos segundos');
  });

  it('usa un mensaje de red seguro y tranquiliza sobre el borrador', () => {
    const copy = getCirclesErrorCopy(new ApiTransportError('network'), 'create');

    expect(copy.title).toBe('No hemos podido guardar el círculo');
    expect(copy.description).toContain('No has perdido nada');
  });

  it('no copia errores arbitrarios', () => {
    const copy = getCirclesErrorCopy(new Error('SELECT * FROM secretos'), 'list');

    expect(copy.description).not.toContain('SELECT');
  });
});

describe('formulario de alta', () => {
  it('recoge solo los campos del contrato y usa el mensaje de respaldo', () => {
    const details = [
      { field: 'name', message: 'Pon un nombre.' },
      { field: 'email', message: 'No pertenece al formulario.' },
      { field: 'description' },
    ];

    expect(collectCircleFieldErrors(details, 'Revisa el campo.')).toEqual({
      name: 'Pon un nombre.',
      description: 'Revisa el campo.',
    });
  });

  it('mapea un 400 con errores por campo', () => {
    const error = new ApiError(400, {
      code: 'VALIDATION_ERROR',
      message: 'Revisa los datos.',
      details: [{ field: 'name', message: 'El nombre es obligatorio.' }],
    });

    expect(mapCreateCircleError(error)).toMatchObject({
      title: 'Revisa los datos del círculo',
      fieldErrors: { name: 'El nombre es obligatorio.' },
    });
  });
});

describe('formatCircleErrorCode', () => {
  const now = new Date(2026, 9, 17, 17, 42);

  it('muestra el estado HTTP y la hora', () => {
    expect(formatCircleErrorCode(apiError(503), now)).toBe('HTTP-503 · 17:42');
  });

  it('distingue errores de red sin respuesta', () => {
    expect(formatCircleErrorCode(new ApiTransportError('network'), now)).toBe('NET · 17:42');
  });

  it('usa el estado del transporte cuando existe', () => {
    const error = new ApiTransportError('unexpected-error-response', undefined, { status: 503 });

    expect(formatCircleErrorCode(error, now)).toBe('NET-503 · 17:42');
  });
});
