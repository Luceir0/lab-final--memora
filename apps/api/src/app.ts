import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { loadConfig, type AppConfig } from './config.ts';
import { errorResponse, isMultipartContentType, mapError } from './errors.ts';
import { createLoggerOptions, type LogStream } from './logging.ts';
import { registerCookie } from './plugins/cookie.ts';
import { registerCsrf } from './plugins/csrf.ts';
import { registerHelmet } from './plugins/helmet.ts';
import { registerMultipart } from './plugins/multipart.ts';
import { registerRateLimit } from './plugins/rate-limit.ts';
import { registerSwagger } from './plugins/swagger.ts';
import { registerDocsRoutes } from './routes/docs.ts';
import { registerHealthRoute } from './routes/health.ts';
import { createUnavailableServices, isRealServices, type Services } from './services/index.ts';
import type { MemoraServer } from './types.ts';

/** JSON bodies are small; photos travel as multipart and are limited there. */
export const JSON_BODY_LIMIT_BYTES = 1024 * 1024;

export interface BuildAppOptions {
  /** Validated configuration. Defaults to `loadConfig()`. */
  readonly config?: AppConfig;
  /** `false` disables logging (tests). `true`/omitted uses the pino options. */
  readonly logger?: boolean;
  /** Capture pino output instead of stdout. Used to assert redaction. */
  readonly loggerStream?: LogStream;
  /** Overrides the global rate-limit ceiling; tests use a permissive value. */
  readonly rateLimitMax?: number;
  /** Service adapters. Tests inject in-memory fakes. */
  readonly services?: Services;
}

/**
 * Builds the Fastify instance without listening.
 *
 * Tests use `app.inject()`; `server.ts` is the only place that opens a port.
 */
export async function buildApp(options: BuildAppOptions = {}): Promise<MemoraServer> {
  const config = options.config ?? loadConfig();

  if (config.isProduction && (options.services === undefined || !isRealServices(options.services))) {
    throw new Error(
      'NODE_ENV=production exige adaptadores reales (kind: "real") de storage, email y geocoding. ' +
        'buildApp() no arranca con el fallback ni con los fakes de test.',
    );
  }

  const app = Fastify({
    logger:
      options.logger === false
        ? false
        : createLoggerOptions(config, options.loggerStream),
    bodyLimit: JSON_BODY_LIMIT_BYTES,
    // Production runs behind a reverse proxy in the private network: trust
    // loopback, link-local and unique-local hops so rate limiting keys on the
    // real client without accepting spoofed public X-Forwarded-For chains.
    trustProxy: config.isProduction ? 'loopback, linklocal, uniquelocal' : false,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.decorate('services', options.services ?? createUnavailableServices());

  await registerHelmet(app, config);
  await registerCookie(app);
  await registerCsrf(app, config);
  await registerRateLimit(
    app,
    options.rateLimitMax === undefined ? {} : { max: options.rateLimitMax },
  );
  await registerMultipart(app);
  await registerSwagger(app);

  registerHealthRoute(app);
  await registerDocsRoutes(app, config);

  app.setNotFoundHandler((request, reply) => {
    request.log.warn({ code: 'NOT_FOUND', statusCode: 404 }, 'Route not found');

    return reply.code(404).send(errorResponse('NOT_FOUND'));
  });

  app.setErrorHandler((error, request, reply) => {
    const mapped = mapError(error, {
      isMultipartRequest: isMultipartContentType(request.headers['content-type']),
    });

    if (mapped.isServerError) {
      request.log.error({ err: error, code: mapped.body.code }, 'Unhandled API error');
    } else {
      request.log.warn(
        { code: mapped.body.code, statusCode: mapped.statusCode },
        'Request rejected',
      );
    }

    // The body is built from the canonical catalogue: it never echoes the
    // original error message or stack, in production or otherwise.
    return reply.code(mapped.statusCode).send(mapped.body);
  });

  return app;
}
