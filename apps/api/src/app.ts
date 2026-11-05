import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { loadConfig, type AppConfig } from './config.ts';
import { createPrismaClient } from './db.ts';
import { errorResponse, isMultipartContentType, mapError } from './errors.ts';
import type { PrismaClient } from './generated/prisma/client.ts';
import { createLoggerOptions, type LogStream } from './logging.ts';
import { registerAlbumRoutes } from './modules/albums/routes.ts';
import { registerAuthRoutes } from './modules/auth/routes.ts';
import { registerCircleRoutes } from './modules/circles/routes.ts';
import { registerInvitationRoutes } from './modules/invitations/routes.ts';
import { registerMemberRoutes } from './modules/members/routes.ts';
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
  /**
   * Prisma client owned by the caller. Tests inject the shared test client so
   * `buildApp()` never opens a second pool; the API closes only its own client.
   */
  readonly prisma?: PrismaClient;
}

/**
 * Builds the Fastify instance without listening.
 *
 * Tests use `app.inject()`; `server.ts` is the only place that opens a port.
 */
export async function buildApp(options: BuildAppOptions = {}): Promise<MemoraServer> {
  const config = options.config ?? loadConfig();

  if (
    config.isProduction &&
    (options.services === undefined || !isRealServices(options.services))
  ) {
    throw new Error(
      'NODE_ENV=production exige adaptadores reales (kind: "real") de storage, email y geocoding. ' +
        'buildApp() no arranca con el fallback ni con los fakes de test.',
    );
  }

  const app = Fastify({
    logger: options.logger === false ? false : createLoggerOptions(config, options.loggerStream),
    bodyLimit: JSON_BODY_LIMIT_BYTES,
    // The shared invitation token accepts up to 256 characters. The router's
    // default limit (100) would answer 414 before Zod could reject an
    // over-long token with `400 VALIDATION_ERROR`; ids stay well below this.
    routerOptions: { maxParamLength: 512 },
    // Production runs behind a reverse proxy in the private network: trust
    // loopback, link-local and unique-local hops so rate limiting keys on the
    // real client without accepting spoofed public X-Forwarded-For chains.
    trustProxy: config.isProduction ? 'loopback, linklocal, uniquelocal' : false,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Fastify captures the error/not-found handlers in the route context at
  // registration time (`Context.errorHandler = errorHandler ?? server[kErrorHandler]`).
  // They must be installed before any route, including the ones registered by
  // plugins (`/api/docs`, `/api/openapi.json`), or those routes keep Fastify's
  // default handler and reply with the raw `FST_ERR_VALIDATION` shape.
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

  app.decorate('services', options.services ?? createUnavailableServices());

  // The client is created eagerly but connects lazily (first query), so a
  // `/api/health`-only development run without DATABASE_URL keeps working.
  const ownedPrisma =
    options.prisma === undefined && config.databaseUrl !== undefined
      ? createPrismaClient(config.databaseUrl)
      : null;

  app.decorate('prisma', options.prisma ?? ownedPrisma);

  if (ownedPrisma !== null) {
    app.addHook('onClose', async () => {
      await ownedPrisma.$disconnect();
    });
  }

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
  registerAuthRoutes(app, config);
  registerAlbumRoutes(app, config);
  registerCircleRoutes(app, config);
  registerMemberRoutes(app, config);
  registerInvitationRoutes(app, config);
  await registerDocsRoutes(app, config);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * Prisma client bound to `config.databaseUrl`, or `null` when the process
     * runs without a database (health-only development).
     */
    prisma: PrismaClient | null;
  }
}
