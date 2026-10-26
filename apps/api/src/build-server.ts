import Fastify, {
  type FastifyBaseLogger,
  type FastifyError,
  type FastifyInstance,
  type FastifySchemaValidationError,
} from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RawServerDefault } from 'fastify';

import { registerSpikeRoutes } from './spike/routes.ts';
import type { ErrorResponse } from './spike/schemas.ts';

export interface BuildServerOptions {
  /** Enables Fastify's pino logger. Tests and probes usually disable it. */
  readonly logger?: boolean;
}

export type MemoraServer = FastifyInstance<
  RawServerDefault,
  IncomingMessage,
  ServerResponse,
  FastifyBaseLogger,
  ZodTypeProvider
>;

function toFieldName(instancePath: string): string {
  const field = instancePath.replace(/^\//, '').replaceAll('/', '.');

  return field === '' ? 'body' : field;
}

function toValidationDetails(
  validation: readonly FastifySchemaValidationError[],
): ErrorResponse['details'] {
  return validation.map((item) => ({
    field: toFieldName(item.instancePath),
    message: item.message ?? 'Invalid value',
  }));
}

interface ClientErrorMapping {
  readonly code: ErrorResponse['code'];
  readonly message: string;
}

/**
 * Safe, non-leaking messages for client errors. Status codes stay as Fastify
 * reports them; anything unknown keeps its real 4xx status with CLIENT_ERROR.
 */
const CLIENT_ERRORS: Readonly<Record<number, ClientErrorMapping>> = {
  400: { code: 'VALIDATION_ERROR', message: 'Request validation failed' },
  401: { code: 'UNAUTHENTICATED', message: 'Authentication required' },
  403: { code: 'FORBIDDEN', message: 'Forbidden' },
  404: { code: 'NOT_FOUND', message: 'Route not found' },
  409: { code: 'CONFLICT', message: 'Conflict' },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'Request payload is too large' },
  415: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Unsupported media type' },
  422: { code: 'VALIDATION_ERROR', message: 'Request validation failed' },
  429: { code: 'RATE_LIMITED', message: 'Too many requests' },
};

const FALLBACK_CLIENT_ERROR: ClientErrorMapping = {
  code: 'CLIENT_ERROR',
  message: 'Request failed',
};

function mapClientError(statusCode: number): ClientErrorMapping {
  return CLIENT_ERRORS[statusCode] ?? FALLBACK_CLIENT_ERROR;
}

function resolveStatus(error: FastifyError): number {
  const status = error.statusCode;

  if (status !== undefined && status >= 400 && status <= 599) {
    return status;
  }

  return 500;
}

/**
 * Creates the Fastify instance used by the API and its tests.
 *
 * Routes stay intentionally small: they exist to validate the F05 stack
 * (Fastify 5 + Zod 4 + uniform errors), not product behaviour.
 */
export function buildServer(options: BuildServerOptions = {}): MemoraServer {
  const server = Fastify({
    logger: options.logger ?? true,
  }).withTypeProvider<ZodTypeProvider>();

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  server.setNotFoundHandler((request, reply) => {
    request.log.warn({ statusCode: 404, code: 'NOT_FOUND' }, 'Client error');

    const body: ErrorResponse = {
      code: 'NOT_FOUND',
      message: 'Route not found',
      details: [],
    };

    return reply.code(404).send(body);
  });

  server.setErrorHandler<FastifyError>((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      const statusCode = resolveStatus(error) === 422 ? 422 : 400;

      request.log.warn({ statusCode, code: 'VALIDATION_ERROR' }, 'Client error');

      const body: ErrorResponse = {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: toValidationDetails(error.validation),
      };

      return reply.code(statusCode).send(body);
    }

    const statusCode = resolveStatus(error);

    if (statusCode >= 500) {
      request.log.error({ err: error }, 'Unhandled API error');

      const body: ErrorResponse = {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: [],
      };

      return reply.code(500).send(body);
    }

    const mapped = mapClientError(statusCode);
    request.log.warn({ statusCode, code: mapped.code }, 'Client error');

    const body: ErrorResponse = {
      code: mapped.code,
      message: mapped.message,
      details: [],
    };

    return reply.code(statusCode).send(body);
  });

  registerSpikeRoutes(server);

  return server;
}
