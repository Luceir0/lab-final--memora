import { errorResponseSchema } from '@memora/shared';
import swagger from '@fastify/swagger';
import type { FastifyInstance } from 'fastify';
import { jsonSchemaTransform, jsonSchemaTransformObject } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { CSRF_HEADER_NAME } from '../modules/auth/constants.ts';
import { API_VERSION } from '../version.ts';

/** Reusable `$ref` so product routes document errors without redefining them. */
export const ERROR_RESPONSE_REF = '#/components/schemas/ErrorResponse';

/** Cookie security scheme shared by every authenticated route (F15+). */
export const SESSION_SECURITY_SCHEME = 'cookieAuth';

function errorResponseComponent(): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(errorResponseSchema, { io: 'output' }) as Record<
    string,
    unknown
  >;

  // OpenAPI 3.1 uses JSON Schema 2020-12; the `$schema` keyword is redundant.
  delete jsonSchema.$schema;

  return jsonSchema;
}

/**
 * Adds the CSRF header to the generated document as required.
 *
 * The runtime header schema is optional on purpose: a missing `X-CSRF-Token`
 * must be `403 FORBIDDEN` (auth module), not a `400` schema validation error.
 * OpenAPI still declares the parameter as required for clients.
 */
function transformWithRequiredCsrfHeader(
  document: Parameters<typeof jsonSchemaTransform>[0],
): ReturnType<typeof jsonSchemaTransform> {
  const transformed = jsonSchemaTransform(document);
  const headers = (
    transformed.schema as
      { headers?: { properties?: Record<string, unknown>; required?: string[] } } | undefined
  )?.headers;

  if (headers?.properties?.[CSRF_HEADER_NAME] !== undefined) {
    headers.required = Array.from(new Set([...(headers.required ?? []), CSRF_HEADER_NAME]));
  }

  return transformed;
}

/**
 * Generates the OpenAPI document from the Zod schemas declared on each route.
 * Serving it (`/api/openapi.json`) is the docs module's responsibility.
 */
export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Memora API',
        description:
          'API REST privada de Memora. Autenticación por cookie `memora_session` y errores uniformes.',
        version: API_VERSION,
      },
      tags: [
        {
          name: 'Salud',
          description: 'Comprobaciones de disponibilidad sin datos sensibles.',
        },
        {
          name: 'Auth',
          description:
            'Registro, sesión, CSRF y perfil del usuario actual. La sesión viaja en la cookie ' +
            '`memora_session`; las mutaciones autenticadas exigen `X-CSRF-Token`.',
        },
        {
          name: 'Circles',
          description:
            'CRUD de círculos y sus stats. Solo los miembros pueden ver un círculo; el propietario ' +
            '(`Circle.ownerId`) es el único que lo edita o lo borra. Las mutaciones exigen ' +
            '`X-CSRF-Token`.',
        },
      ],
      components: {
        schemas: {
          ErrorResponse: errorResponseComponent(),
        },
        securitySchemes: {
          [SESSION_SECURITY_SCHEME]: {
            type: 'apiKey',
            in: 'cookie',
            name: 'memora_session',
            description: 'Cookie de sesión opaca emitida por la API.',
          },
        },
      },
    },
    transform: transformWithRequiredCsrfHeader,
    transformObject: jsonSchemaTransformObject,
  });
}
