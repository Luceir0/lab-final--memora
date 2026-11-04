import { isApiError, isApiTransportError } from '@memora/api-client';
import type { ErrorDetail } from '@memora/shared';

import { getErrorMessage } from '../../lib/error-message';

import { formatClockTime } from './format';

export type CircleErrorContext = 'list' | 'create' | 'detail';

export type CircleFormField = 'name' | 'description';

export const CIRCLE_FORM_FIELDS: readonly CircleFormField[] = ['name', 'description'];

export interface CirclesErrorCopy {
  readonly title: string;
  readonly description: string;
}

export interface CreateCircleErrorMapping extends CirclesErrorCopy {
  readonly fieldErrors: Partial<Record<CircleFormField, string>>;
}

export const CIRCLE_SESSION_EXPIRED_MESSAGE =
  'Tu sesión ha caducado. Vuelve a entrar para seguir con tus recuerdos.';

export const CIRCLE_RATE_LIMITED_MESSAGE =
  'Hemos bloqueado temporalmente las peticiones desde esta conexión. Espera unos segundos antes de volver a intentarlo.';

function isCircleFormField(value: string | undefined): value is CircleFormField {
  return value !== undefined && (CIRCLE_FORM_FIELDS as readonly string[]).includes(value);
}

/** Extrae los errores por campo de un `400` sin aceptar campos ajenos. */
export function collectCircleFieldErrors(
  details: ErrorDetail[] | null,
  fallbackMessage: string,
): Partial<Record<CircleFormField, string>> {
  const fieldErrors: Partial<Record<CircleFormField, string>> = {};

  for (const detail of details ?? []) {
    if (!isCircleFormField(detail.field)) {
      continue;
    }

    fieldErrors[detail.field] = detail.message ?? fallbackMessage;
  }

  return fieldErrors;
}

/**
 * Traduce un fallo de círculos a texto visible.
 *
 * Los mensajes de `ApiError` y `ApiTransportError` son seguros por contrato;
 * el resto de errores nunca se copian. Un `401` no debe pintar datos privados:
 * el guard limpia la caché y redirige, pero el estado se mantiene coherente
 * mientras ocurre la navegación.
 */
export function getCirclesErrorCopy(error: unknown, context: CircleErrorContext): CirclesErrorCopy {
  const genericTitle =
    context === 'list'
      ? 'No hemos podido cargar tus círculos'
      : context === 'detail'
        ? 'No hemos podido cargar el círculo'
        : 'No hemos podido guardar el círculo';

  if (isApiError(error)) {
    if (error.status === 401) {
      return { title: 'Tu sesión ha caducado', description: CIRCLE_SESSION_EXPIRED_MESSAGE };
    }

    if (error.status === 403) {
      return {
        title:
          context === 'list'
            ? 'No tienes acceso a estos círculos'
            : context === 'detail'
              ? 'No tienes acceso a este círculo'
              : 'No puedes crear este círculo',
        description:
          context === 'list'
            ? 'Tu cuenta no tiene permiso para verlos.'
            : context === 'detail'
              ? 'Es un círculo privado y tu cuenta no forma parte de él.'
              : 'Tu cuenta no tiene permiso para crearlo.',
      };
    }

    if (error.status === 404) {
      return {
        title: genericTitle,
        description: 'El círculo ya no existe o ya no tienes acceso.',
      };
    }

    if (error.status === 429) {
      return { title: 'Demasiadas peticiones', description: CIRCLE_RATE_LIMITED_MESSAGE };
    }

    if (error.status >= 500) {
      return {
        title: genericTitle,
        description:
          context === 'list'
            ? 'Parece un problema del servidor. Tus fotos siguen a salvo: vuelve a intentarlo en unos segundos.'
            : context === 'detail'
              ? 'Parece un problema del servidor. Tus fotos siguen a salvo: vuelve a intentarlo en unos segundos.'
              : 'Parece un problema del servidor. No has perdido nada de lo que has escrito: vuelve a intentarlo.',
      };
    }

    if (context === 'create' && error.status === 400) {
      return {
        title: 'Revisa los datos del círculo',
        description: error.message,
      };
    }

    return { title: genericTitle, description: getErrorMessage(error) };
  }

  if (isApiTransportError(error)) {
    return {
      title: genericTitle,
      description:
        context === 'create'
          ? 'Se ha perdido la conexión. No has perdido nada de lo que has escrito: vuelve a intentarlo.'
          : 'Parece un problema de conexión. Tus fotos siguen a salvo: vuelve a intentarlo en unos segundos.',
    };
  }

  return { title: genericTitle, description: getErrorMessage(error) };
}

/** Mapeo completo del alta: resumen y errores por campo. */
export function mapCreateCircleError(error: unknown): CreateCircleErrorMapping {
  const copy = getCirclesErrorCopy(error, 'create');
  const fieldErrors =
    isApiError(error) && error.status === 400
      ? collectCircleFieldErrors(error.details, error.message)
      : {};

  return { ...copy, fieldErrors };
}

/**
 * Código corto que se muestra bajo el error, como en el diseño.
 *
 * Sirve para soporte: identifica el tipo de fallo sin exponer cuerpos de
 * respuesta ni detalles internos.
 */
export function formatCircleErrorCode(error: unknown, now: Date = new Date()): string {
  const time = formatClockTime(now);

  if (isApiError(error)) {
    return `HTTP-${error.status} · ${time}`;
  }

  if (isApiTransportError(error)) {
    return error.status === null ? `NET · ${time}` : `NET-${error.status} · ${time}`;
  }

  return `ERR · ${time}`;
}
