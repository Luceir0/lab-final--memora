import type { ErrorCode, ErrorDetail, ErrorResponse } from '@memora/shared';

/**
 * Why a response could not be turned into a typed result.
 *
 * - `network`: `fetch` failed before a response existed (offline, DNS, CORS).
 * - `invalid-json`: the success body was not valid JSON.
 * - `invalid-response`: the success body did not match the declared schema.
 * - `unexpected-error-response`: a non-2xx response without the canonical body.
 */
export type ApiTransportErrorKind =
  'network' | 'invalid-json' | 'invalid-response' | 'unexpected-error-response';

/**
 * Safe Spanish messages for transport failures.
 *
 * They never include the raw response body: a proxy or a misconfigured server
 * could return stack traces, HTML or another circle's data.
 */
export const TRANSPORT_ERROR_MESSAGES: Readonly<Record<ApiTransportErrorKind, string>> = {
  network: 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  'invalid-json': 'La respuesta del servidor no es JSON válido.',
  'invalid-response': 'La respuesta del servidor no cumple el contrato esperado.',
  'unexpected-error-response': 'El servidor devolvió un error inesperado.',
};

/** Optional context for {@link ApiTransportError}. */
export interface ApiTransportErrorInit {
  /** HTTP status, when a response existed. */
  readonly status?: number;
  /** Original error, kept for diagnostics. Not meant for end users. */
  readonly cause?: unknown;
}

/**
 * Failure that happened outside the canonical API error contract.
 *
 * Distinguishable from {@link ApiError} by class and by {@link kind}; the
 * message is always a safe Spanish sentence. Use `cause` for debugging only.
 */
export class ApiTransportError extends Error {
  readonly kind: ApiTransportErrorKind;

  /** HTTP status when a response existed, otherwise `null`. */
  readonly status: number | null;

  constructor(kind: ApiTransportErrorKind, message?: string, init: ApiTransportErrorInit = {}) {
    super(message ?? TRANSPORT_ERROR_MESSAGES[kind]);
    this.name = 'ApiTransportError';
    this.kind = kind;
    this.status = init.status ?? null;
    if (init.cause !== undefined) {
      this.cause = init.cause;
    }
  }
}

/**
 * A non-2xx response that matched the canonical error body
 * (`{ code, message, details }` from `@memora/shared`).
 *
 * `message` is the server message, which the API contract defines as safe to
 * show. `code` and `details` allow callers to react per field.
 */
export class ApiError extends Error {
  /** HTTP status of the response. */
  readonly status: number;

  /** Canonical error code from `@memora/shared`. */
  readonly code: ErrorCode;

  /** Field-level details, or `null` when the API sent none. */
  readonly details: ErrorDetail[] | null;

  constructor(status: number, body: ErrorResponse) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

/** Narrows an unknown error to {@link ApiError}. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Narrows an unknown error to {@link ApiTransportError}. */
export function isApiTransportError(error: unknown): error is ApiTransportError {
  return error instanceof ApiTransportError;
}
