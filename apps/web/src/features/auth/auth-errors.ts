import { isApiError, isApiTransportError } from '@memora/api-client';
import { INVALID_CREDENTIALS_MESSAGE } from '@memora/shared';

import { GENERIC_ERROR_MESSAGE } from '../../lib/error-message';

/** Campos del contrato que pueden recibir un error por campo. */
export const AUTH_FIELDS = ['name', 'email', 'password'] as const;

export type AuthField = (typeof AUTH_FIELDS)[number];

export type AuthFormScope = 'login' | 'register';

export interface AuthErrorMapping {
  /** Mensaje para el resumen superior. `null` si no hay error general. */
  readonly formMessage: string | null;
  /** Errores por campo del contrato, listos para `setError`. */
  readonly fieldErrors: Partial<Record<AuthField, string>>;
}

/**
 * `429`: límite temporal de la conexión. No es un fallo de los datos, así que
 * no se promete una espera corta ni se insinúa que el email sea incorrecto.
 */
export const AUTH_RATE_LIMITED_MESSAGE =
  'Hemos bloqueado temporalmente los intentos desde esta conexión. Espera antes de volver a intentarlo.';

function isAuthField(value: string | undefined): value is AuthField {
  return value !== undefined && (AUTH_FIELDS as readonly string[]).includes(value);
}

/** Extrae los `details` de un `400` y descarta campos ajenos al formulario. */
export function collectFieldErrors(
  details:
    | readonly {
        readonly field?: string | undefined;
        readonly message?: string | undefined;
      }[]
    | null,
  fallbackMessage: string,
): Partial<Record<AuthField, string>> {
  const fieldErrors: Partial<Record<AuthField, string>> = {};

  for (const detail of details ?? []) {
    if (!isAuthField(detail.field)) {
      continue;
    }

    fieldErrors[detail.field] = detail.message ?? fallbackMessage;
  }

  return fieldErrors;
}

/**
 * Traduce un fallo de la API al estado visible del formulario.
 *
 * - `401` en login: siempre el mismo mensaje, sin revelar si el email existe.
 * - `409` en registro: el conflicto se marca en `email`.
 * - `400`: se usan los `details` canónicos y se ignoran campos desconocidos.
 * - `429`: bloqueo temporal de la conexión, sin marcar campos.
 * - `500`, error de red o error no reconocido: mensaje genérico reintentable.
 *
 * Nunca se muestra el cuerpo crudo, una traza ni el mensaje de un `Error`
 * arbitrario.
 */
export function mapAuthError(error: unknown, scope: AuthFormScope): AuthErrorMapping {
  if (isApiError(error)) {
    if (scope === 'login' && error.status === 401) {
      return { formMessage: INVALID_CREDENTIALS_MESSAGE, fieldErrors: {} };
    }

    if (scope === 'register' && error.status === 409) {
      const detail = error.details?.find((item) => item.field === 'email');

      return {
        formMessage: null,
        fieldErrors: { email: detail?.message ?? error.message },
      };
    }

    if (error.status === 400) {
      return {
        formMessage: error.message,
        fieldErrors: collectFieldErrors(error.details, error.message),
      };
    }

    if (error.status === 429) {
      return { formMessage: AUTH_RATE_LIMITED_MESSAGE, fieldErrors: {} };
    }

    return { formMessage: GENERIC_ERROR_MESSAGE, fieldErrors: {} };
  }

  if (isApiTransportError(error)) {
    // Los mensajes de transporte del cliente son frases seguras y explican el
    // fallo de red sin incluir el cuerpo de la respuesta.
    return { formMessage: GENERIC_ERROR_MESSAGE, fieldErrors: {} };
  }

  return { formMessage: GENERIC_ERROR_MESSAGE, fieldErrors: {} };
}
