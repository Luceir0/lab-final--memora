import { errorResponseSchema } from '@memora/shared';
import swagger from '@fastify/swagger';
import type { FastifyInstance } from 'fastify';
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
} from 'fastify-type-provider-zod';
import { z } from 'zod';

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
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  });
}
