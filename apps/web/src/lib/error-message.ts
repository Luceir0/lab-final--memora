import { isApiError, isApiTransportError } from '@memora/api-client';

/** Mensaje genérico para fallos que no vienen del contrato de la API. */
export const GENERIC_ERROR_MESSAGE =
  'Ha ocurrido un error inesperado. Inténtalo de nuevo en unos segundos.';

/**
 * Traduce un error desconocido a un mensaje seguro en español.
 *
 * Solo se confían los mensajes de `ApiError` (contrato canónico) y de
 * `ApiTransportError` (frases seguras de `@memora/api-client`). Un `Error`
 * arbitrario puede llevar rutas, SQL o detalles internos, así que nunca se
 * copia: se usa siempre el mensaje genérico.
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (isApiTransportError(error)) {
    return error.message;
  }

  return GENERIC_ERROR_MESSAGE;
}
