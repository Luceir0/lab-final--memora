import {
  ERROR_HTTP_STATUS,
  ERROR_MESSAGES,
  errorResponseSchema,
  type ErrorCode,
  type ErrorDetail,
  type ErrorResponse,
} from '@memora/shared';
import type { FastifySchemaValidationError } from 'fastify';

import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';

/**
 * Exact status → canonical code mapping.
 *
 * Only statuses with an unambiguous canonical code are listed. `409` maps to
 * the generic `CONFLICT`; endpoints that need `ALBUM_NOT_EMPTY` throw
 * `ApiError` with the exact code instead of relying on the status.
 */
const STATUS_TO_CODE: Readonly<Record<number, ErrorCode>> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  // A 413 that is not a multipart file limit is a request payload limit.
  // FILE_TOO_LARGE is selected by error code (see ERROR_CODE_OVERRIDES);
  // QUOTA_EXCEEDED is thrown explicitly by the upload module.
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'RATE_LIMITED',
};

/**
 * Plugin error codes whose semantics do not match their HTTP status alone.
 * They are resolved before the status mapping.
 */
const ERROR_CODE_OVERRIDES: Readonly<Record<string, { code: ErrorCode; statusCode: number }>> = {
  FST_INVALID_MULTIPART_CONTENT_TYPE: {
    code: 'UNSUPPORTED_MEDIA_TYPE',
    statusCode: ERROR_HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
  },
  FST_INVALID_JSON_FIELD_ERROR: {
    code: 'VALIDATION_ERROR',
    statusCode: ERROR_HTTP_STATUS.VALIDATION_ERROR,
  },
  FST_REQ_FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    statusCode: ERROR_HTTP_STATUS.FILE_TOO_LARGE,
  },
  FST_FILES_LIMIT: {
    code: 'PAYLOAD_TOO_LARGE',
    statusCode: ERROR_HTTP_STATUS.PAYLOAD_TOO_LARGE,
  },
  FST_FIELDS_LIMIT: {
    code: 'PAYLOAD_TOO_LARGE',
    statusCode: ERROR_HTTP_STATUS.PAYLOAD_TOO_LARGE,
  },
  FST_PARTS_LIMIT: {
    code: 'PAYLOAD_TOO_LARGE',
    statusCode: ERROR_HTTP_STATUS.PAYLOAD_TOO_LARGE,
  },
  FST_ERR_CTP_BODY_TOO_LARGE: {
    code: 'PAYLOAD_TOO_LARGE',
    statusCode: ERROR_HTTP_STATUS.PAYLOAD_TOO_LARGE,
  },
  FST_MP_PREMATURE_CLOSE: {
    code: 'VALIDATION_ERROR',
    statusCode: ERROR_HTTP_STATUS.VALIDATION_ERROR,
  },
};

/**
 * Parser errors that may arrive without `statusCode`. Keep this list explicit:
 * a generic `FST_*` prefix would also catch server-side adapter errors.
 */
const PARSER_ERROR_CODES: ReadonlySet<string> = new Set([
  'FST_INVALID_MULTIPART_CONTENT_TYPE',
  'FST_INVALID_JSON_FIELD_ERROR',
  'FST_MP_PREMATURE_CLOSE',
  'FST_REQ_FILE_TOO_LARGE',
  'FST_FILES_LIMIT',
  'FST_FIELDS_LIMIT',
  'FST_PARTS_LIMIT',
  'FST_ERR_CTP_BODY_TOO_LARGE',
]);

/**
 * Exact busboy/dicer messages for malformed or truncated multipart bodies.
 * Substring matching would misclassify server errors such as
 * "Invalid multipart state in storage adapter".
 */
const MULTIPART_BODY_ERROR_MESSAGES: ReadonlySet<string> = new Set([
  'Unexpected end of multipart data',
  'Multipart: Boundary not found',
  'Boundary required',
]);

const MULTIPART_BODY_EARLY_END = /terminated early due to unexpected end of multipart data$/;

function isMultipartBodyErrorMessage(message: string): boolean {
  return MULTIPART_BODY_ERROR_MESSAGES.has(message) || MULTIPART_BODY_EARLY_END.test(message);
}

/** True only for a request that declares a multipart body. */
export function isMultipartContentType(contentType: string | undefined): boolean {
  return typeof contentType === 'string' && contentType.toLowerCase().startsWith('multipart/form-data');
}

/** Canonical body with `details: null` whenever there is nothing to detail. */
export function errorResponse(
  code: ErrorCode,
  options: { readonly message?: string; readonly details?: readonly ErrorDetail[] | null } = {},
): ErrorResponse {
  const details =
    options.details !== undefined && options.details !== null && options.details.length > 0
      ? [...options.details]
      : null;

  const parsed = errorResponseSchema.safeParse({
    code,
    message: options.message ?? ERROR_MESSAGES[code],
    details,
  });

  if (!parsed.success) {
    const paths = parsed.error.issues
      .map((issue) => (issue.path.length > 0 ? issue.path.join('.') : '(raíz)'))
      .join(', ');

    throw new TypeError(`Respuesta de error inválida según el contrato compartido: ${paths}.`);
  }

  return parsed.data;
}

/** Error that already knows its canonical code. Routes throw this. */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details: ErrorDetail[] | null;

  constructor(
    code: ErrorCode,
    options: { readonly message?: string; readonly details?: readonly ErrorDetail[] | null } = {},
  ) {
    const response = errorResponse(code, options);

    super(response.message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = ERROR_HTTP_STATUS[code];
    this.details = response.details;
  }

  toResponse(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
      details: this.details === null ? null : [...this.details],
    };
  }
}

function toFieldName(instancePath: string | undefined): string {
  if (instancePath === undefined || instancePath === '' || instancePath === '/') {
    return 'body';
  }

  const field = instancePath.replace(/^\//, '').replaceAll('/', '.');

  return field === '' ? 'body' : field;
}

/**
 * Builds contract-valid details from schema validation errors.
 *
 * Zod always reports at least one issue, but the fallback keeps the invariant
 * "details is a non-empty array or null" even if a future provider does not.
 */
export function toValidationDetails(
  validation: readonly FastifySchemaValidationError[],
): ErrorDetail[] {
  const details = validation.map((item) => ({
    field: toFieldName(item.instancePath),
    message:
      typeof item.message === 'string' && item.message.length > 0
        ? item.message
        : 'Valor inválido.',
  }));

  if (details.length > 0) {
    return details;
  }

  return [{ message: 'La petición no cumple el contrato.' }];
}

function readStatusCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const candidate = error as { readonly statusCode?: unknown; readonly status?: unknown };

  for (const value of [candidate.statusCode, candidate.status]) {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 400 && value <= 599) {
      return value;
    }
  }

  return undefined;
}

function readErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const candidate = error as { readonly code?: unknown };

  return typeof candidate.code === 'string' ? candidate.code : undefined;
}

function readErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  return error.message;
}

export interface MappedError {
  readonly statusCode: number;
  readonly body: ErrorResponse;
  readonly isServerError: boolean;
}

export interface ErrorContext {
  /** Set by the error handler when the request declares a multipart body. */
  readonly isMultipartRequest?: boolean;
}

/** Normalizes anything thrown or replied with into the canonical error body. */
export function mapError(error: unknown, context: ErrorContext = {}): MappedError {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      body: error.toResponse(),
      isServerError: error.statusCode >= 500,
    };
  }

  if (hasZodFastifySchemaValidationErrors(error)) {
    return {
      statusCode: ERROR_HTTP_STATUS.VALIDATION_ERROR,
      body: errorResponse('VALIDATION_ERROR', {
        details: toValidationDetails(error.validation),
      }),
      isServerError: false,
    };
  }

  const override = ERROR_CODE_OVERRIDES[readErrorCode(error) ?? ''];

  if (override !== undefined) {
    return {
      statusCode: override.statusCode,
      body: errorResponse(override.code),
      isServerError: false,
    };
  }

  const status = readStatusCode(error);

  if (status === undefined) {
    const code = readErrorCode(error);
    const message = readErrorMessage(error);

    if (code === 'ERR_STREAM_PREMATURE_CLOSE') {
      // A truncated upload body ends the part stream early. Outside a
      // multipart request this is an internal stream failure, not a client
      // error.
      const isClientError = context.isMultipartRequest === true;

      return {
        statusCode: isClientError
          ? ERROR_HTTP_STATUS.VALIDATION_ERROR
          : ERROR_HTTP_STATUS.INTERNAL_ERROR,
        body: errorResponse(isClientError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR'),
        isServerError: !isClientError,
      };
    }

    if (
      (code !== undefined && PARSER_ERROR_CODES.has(code)) ||
      (message !== undefined && isMultipartBodyErrorMessage(message))
    ) {
      return {
        statusCode: ERROR_HTTP_STATUS.VALIDATION_ERROR,
        body: errorResponse('VALIDATION_ERROR'),
        isServerError: false,
      };
    }

    return {
      statusCode: ERROR_HTTP_STATUS.INTERNAL_ERROR,
      body: errorResponse('INTERNAL_ERROR'),
      isServerError: true,
    };
  }

  if (status >= 500) {
    return {
      statusCode: ERROR_HTTP_STATUS.INTERNAL_ERROR,
      body: errorResponse('INTERNAL_ERROR'),
      isServerError: true,
    };
  }

  const code = STATUS_TO_CODE[status];

  if (code !== undefined) {
    return {
      statusCode: ERROR_HTTP_STATUS[code],
      body: errorResponse(code),
      isServerError: false,
    };
  }

  /**
   * Contract gap: Fastify can emit 4xx statuses without a canonical code
   * (405, 408, 418...). We normalize to the closest generic client error
   * instead of inventing a code; the reviewer should decide whether the
   * catalogue needs more entries.
   */
  return {
    statusCode: ERROR_HTTP_STATUS.VALIDATION_ERROR,
    body: errorResponse('VALIDATION_ERROR'),
    isServerError: false,
  };
}
