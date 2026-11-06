import { isApiError, isApiTransportError } from '@memora/api-client';
import { defaultErrorMessage, type ErrorCode } from '@memora/shared';

/**
 * Códigos de error de la cola.
 *
 * Los códigos del contrato mandan. Los tres extra son locales: fallo de red,
 * cancelación explícita y respuesta 2xx que no valida contra `PhotoDto`.
 */
export type UploadErrorCode = ErrorCode | 'NETWORK_ERROR' | 'CANCELLED' | 'INVALID_RESPONSE';

export interface UploadError {
  readonly code: UploadErrorCode;
  readonly status: number | null;
  /** Mensaje en español listo para pintar; nunca incluye detalles internos. */
  readonly message: string;
}

const GENERIC_UPLOAD_MESSAGE = 'No se ha podido subir la imagen. Vuelve a intentarlo.';

function defaultUploadMessage(code: UploadErrorCode): string {
  switch (code) {
    case 'NETWORK_ERROR':
      return 'Se ha perdido la conexión. Comprueba tu red y vuelve a intentarlo.';
    case 'CANCELLED':
      return 'Subida cancelada.';
    case 'INVALID_RESPONSE':
      return 'La respuesta del servidor no es válida. Vuelve a intentarlo.';
    default:
      return defaultErrorMessage(code);
  }
}

/** Error tipado del transporte; el reducer solo guarda su forma plana. */
export class UploadTransportError extends Error implements UploadError {
  readonly code: UploadErrorCode;

  readonly status: number | null;

  constructor(code: UploadErrorCode, status: number | null, message?: string) {
    super(message ?? defaultUploadMessage(code));
    this.name = 'UploadTransportError';
    this.code = code;
    this.status = status;
  }
}

export function isUploadTransportError(value: unknown): value is UploadTransportError {
  return value instanceof UploadTransportError;
}

/** Aborto de XHR o `AbortError` nativo: no es un fallo que deba pintarse. */
export function isUploadCancelledError(error: unknown): boolean {
  if (isUploadTransportError(error)) {
    return error.code === 'CANCELLED';
  }

  return (
    typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    error.name === 'AbortError'
  );
}

/**
 * Un `403` con mención de CSRF es indistinguible de un `FORBIDDEN` de permisos
 * salvo por el mensaje del contrato (`Falta el token CSRF.` / `Token CSRF
 * inválido.`). Solo en ese caso se refresca el token y se reintenta una vez.
 */
export function isCsrfFailure(error: unknown): boolean {
  return isUploadTransportError(error) && error.status === 403 && /csrf/i.test(error.message);
}

/** Normaliza cualquier `throw` a la forma que guarda el reducer. */
export function toUploadError(error: unknown): UploadError {
  if (isUploadTransportError(error)) {
    return { code: error.code, status: error.status, message: error.message };
  }

  if (isUploadCancelledError(error)) {
    return { code: 'CANCELLED', status: null, message: defaultUploadMessage('CANCELLED') };
  }

  if (isApiError(error)) {
    const code: UploadErrorCode =
      error.status === 401 ? 'UNAUTHENTICATED' : error.status === 403 ? 'FORBIDDEN' : error.code;

    return { code, status: error.status, message: defaultUploadMessage(code) };
  }

  if (isApiTransportError(error)) {
    return {
      code: 'NETWORK_ERROR',
      status: error.status,
      message: defaultUploadMessage('NETWORK_ERROR'),
    };
  }

  return { code: 'INTERNAL_ERROR', status: null, message: GENERIC_UPLOAD_MESSAGE };
}

/**
 * Copy de UI por código.
 *
 * El menú de estados de cada archivo debe explicar qué pasó sin enseñar el
 * mensaje crudo del servidor ni detalles internos. Los códigos de la API se
 * agrupan aquí para que el copy sea único y testeable.
 */
const UPLOAD_ERROR_COPY: Readonly<Record<UploadErrorCode, string>> = {
  VALIDATION_ERROR: 'Revisa los archivos e inténtalo de nuevo.',
  UNAUTHENTICATED: 'Tu sesión ha caducado. Vuelve a entrar.',
  FORBIDDEN: 'No tienes permiso para subir fotos a este álbum.',
  NOT_FOUND: 'El álbum ya no existe o no tienes acceso.',
  CONFLICT: 'No se pudo completar la subida por un conflicto. Reintenta.',
  ALBUM_NOT_EMPTY: 'El álbum ya no está disponible para subir fotos.',
  FILE_TOO_LARGE: 'El archivo supera los 25 MB.',
  PAYLOAD_TOO_LARGE: 'El archivo supera el tamaño permitido.',
  QUOTA_EXCEEDED: 'El círculo ha alcanzado su cuota de almacenamiento.',
  UNSUPPORTED_MEDIA_TYPE: 'Formato no admitido. Usa JPEG, PNG o WebP.',
  UNPROCESSABLE_ENTITY: 'No se pudo procesar la imagen.',
  INVALID_IMAGE: 'La imagen está dañada o es demasiado grande.',
  PROCESSING_FAILED: 'No se pudo procesar la imagen. Prueba con otra.',
  RATE_LIMITED: 'Demasiadas subidas seguidas. Espera un momento.',
  INTERNAL_ERROR: 'Algo ha fallado en el servidor. Reintenta en unos segundos.',
  NETWORK_ERROR: 'No se pudo conectar. Revisa tu conexión y reintenta.',
  CANCELLED: 'Subida cancelada.',
  INVALID_RESPONSE: 'El servidor devolvió una respuesta no válida. Reintenta.',
};

export function getUploadErrorCopy(error: UploadError): string {
  return UPLOAD_ERROR_COPY[error.code];
}
