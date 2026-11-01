import { z } from 'zod';

/**
 * Canonical API error catalogue.
 *
 * Mirrors the table in `docs/03-architecture/api-contract.md`; the API and the
 * web client must not define their own codes.
 */
export const ERROR_CODES = [
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
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);

export type ErrorCode = (typeof ERROR_CODES)[number];

/** HTTP status each error code must be returned with. */
export const ERROR_HTTP_STATUS: Readonly<Record<ErrorCode, number>> = {
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
};

/**
 * Safe user-facing defaults. Endpoints may override them when they have more
 * context, but must never leak other circles' data or internal details.
 */
export const ERROR_MESSAGES: Readonly<Record<ErrorCode, string>> = {
  VALIDATION_ERROR: 'Revisa los datos introducidos.',
  UNAUTHENTICATED: 'Inicia sesión para continuar.',
  FORBIDDEN: 'No tienes acceso a este círculo.',
  NOT_FOUND: 'No encontramos lo que buscas.',
  CONFLICT: 'La operación no se puede completar por un conflicto.',
  ALBUM_NOT_EMPTY: 'El álbum todavía tiene fotos.',
  FILE_TOO_LARGE: 'El archivo supera el tamaño máximo permitido.',
  PAYLOAD_TOO_LARGE: 'El contenido supera el tamaño permitido.',
  QUOTA_EXCEEDED: 'El círculo ha alcanzado su cuota de almacenamiento.',
  UNSUPPORTED_MEDIA_TYPE: 'El formato del archivo no está permitido.',
  UNPROCESSABLE_ENTITY: 'No se puede procesar la imagen.',
  INVALID_IMAGE: 'La imagen está dañada o es demasiado grande.',
  PROCESSING_FAILED: 'No se pudo procesar la imagen.',
  RATE_LIMITED: 'Demasiadas peticiones. Inténtalo de nuevo en un momento.',
  INTERNAL_ERROR: 'Ha ocurrido un error inesperado.',
};

/** Default Spanish message for a code. */
export function defaultErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code];
}

/**
 * One machine-readable detail. Only `field`, `message`, `resource` and `limit`
 * may carry request context; never another circle's data. An empty detail is
 * rejected: it would tell the client nothing and hide a bug.
 */
export const errorDetailSchema = z
  .object({
    field: z.string().min(1).optional(),
    message: z.string().min(1).optional(),
    resource: z.string().min(1).optional(),
    limit: z.number().int().nonnegative().optional(),
  })
  .refine(
    (detail) =>
      detail.field !== undefined ||
      detail.message !== undefined ||
      detail.resource !== undefined ||
      detail.limit !== undefined,
    { message: 'Cada detalle debe incluir field, message, resource o limit.' },
  );

export type ErrorDetail = z.infer<typeof errorDetailSchema>;

/**
 * Error details. `null` means "no details"; an empty array is rejected because
 * it carries exactly the same information as `null` while hiding a bug.
 */
export const errorDetailsSchema = z
  .array(errorDetailSchema)
  .min(1, 'Los detalles no pueden estar vacíos.')
  .nullable()
  .default(null);

/**
 * Uniform error body. `details` is optional on input and defaults to `null`.
 */
export const errorResponseSchema = z.object({
  code: errorCodeSchema,
  message: z.string().min(1),
  details: errorDetailsSchema,
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export interface ApiSuccess<T> {
  readonly ok: true;
  readonly data: T;
}

export interface ApiFailure {
  readonly ok: false;
  readonly error: ErrorResponse;
}

/** Result wrapper for client-side calls that must not throw on API errors. */
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export function isApiSuccess<T>(result: ApiResult<T>): result is ApiSuccess<T> {
  return result.ok;
}
