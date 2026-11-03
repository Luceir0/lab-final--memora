import { ApiError, ApiTransportError } from '@memora/api-client';
import { INVALID_CREDENTIALS_MESSAGE } from '@memora/shared';
import { describe, expect, it } from 'vitest';

import { GENERIC_ERROR_MESSAGE } from '../../lib/error-message';

import { AUTH_RATE_LIMITED_MESSAGE, collectFieldErrors, mapAuthError } from './auth-errors';

describe('mapAuthError', () => {
  it('un 401 de login usa siempre el mismo mensaje', () => {
    const mapping = mapAuthError(
      new ApiError(401, {
        code: 'UNAUTHENTICATED',
        message: 'Email o contraseña incorrectos.',
        details: null,
      }),
      'login',
    );

    expect(mapping).toEqual({
      formMessage: INVALID_CREDENTIALS_MESSAGE,
      fieldErrors: {},
    });
  });

  it('un 409 de registro marca el campo email', () => {
    const mapping = mapAuthError(
      new ApiError(409, {
        code: 'CONFLICT',
        message: 'La operación no se puede completar por un conflicto.',
        details: [{ field: 'email', message: 'Ya existe una cuenta con ese email.' }],
      }),
      'register',
    );

    expect(mapping.formMessage).toBeNull();
    expect(mapping.fieldErrors.email).toBe('Ya existe una cuenta con ese email.');
  });

  it('un 400 reparte los details por campo e ignora campos ajenos', () => {
    const mapping = mapAuthError(
      new ApiError(400, {
        code: 'VALIDATION_ERROR',
        message: 'Revisa los datos introducidos.',
        details: [
          { field: 'email', message: 'Introduce un email válido.' },
          { field: 'other', message: 'No debería mostrarse.' },
        ],
      }),
      'register',
    );

    expect(mapping.formMessage).toBe('Revisa los datos introducidos.');
    expect(mapping.fieldErrors).toEqual({ email: 'Introduce un email válido.' });
  });

  it('un 429 explica el bloqueo temporal sin marcar campos', () => {
    const mapping = mapAuthError(
      new ApiError(429, {
        code: 'RATE_LIMITED',
        message: 'Demasiadas peticiones. Inténtalo de nuevo en un momento.',
        details: null,
      }),
      'login',
    );

    expect(mapping.formMessage).toBe(AUTH_RATE_LIMITED_MESSAGE);
    expect(mapping.formMessage).toMatch(/bloqueado temporalmente/i);
    expect(mapping.formMessage).toMatch(/conexión/i);
    expect(mapping.formMessage).not.toMatch(/email/i);
    expect(mapping.fieldErrors).toEqual({});
  });

  it('un 500 usa un mensaje genérico reintentable', () => {
    const mapping = mapAuthError(
      new ApiError(500, {
        code: 'INTERNAL_ERROR',
        message: 'Ha ocurrido un error inesperado.',
        details: null,
      }),
      'login',
    );

    expect(mapping.formMessage).toBe(GENERIC_ERROR_MESSAGE);
  });

  it('un fallo de red usa un mensaje genérico reintentable', () => {
    const mapping = mapAuthError(new ApiTransportError('network'), 'login');

    expect(mapping.formMessage).toBe(GENERIC_ERROR_MESSAGE);
  });

  it('un Error arbitrario nunca filtra su mensaje', () => {
    const mapping = mapAuthError(new Error('stack trace at /srv/app'), 'login');

    expect(mapping.formMessage).toBe(GENERIC_ERROR_MESSAGE);
    expect(mapping.formMessage).not.toContain('/srv');
  });

  it('un 401 de registro no se trata como credenciales de login', () => {
    const mapping = mapAuthError(
      new ApiError(401, {
        code: 'UNAUTHENTICATED',
        message: 'Inicia sesión para continuar.',
        details: null,
      }),
      'register',
    );

    expect(mapping.formMessage).toBe(GENERIC_ERROR_MESSAGE);
  });
});

describe('collectFieldErrors', () => {
  it('usa el mensaje del envelope y descarta detalles sin campo', () => {
    expect(
      collectFieldErrors(
        [{ message: 'Sin campo' }, { field: 'password', message: 'Muy corta.' }],
        'Revisa los datos.',
      ),
    ).toEqual({ password: 'Muy corta.' });
  });

  it('cae al mensaje de respaldo cuando el detalle no trae mensaje', () => {
    expect(collectFieldErrors([{ field: 'name' }], 'Revisa los datos.')).toEqual({
      name: 'Revisa los datos.',
    });
  });
});
