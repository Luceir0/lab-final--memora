import Fastify, { type FastifyInstance } from 'fastify';

export interface BuildServerOptions {
  /** Enables Fastify's pino logger. Tests and probes usually disable it. */
  readonly logger?: boolean;
}

/**
 * Creates a Fastify instance without registering product routes.
 * Health checks, plugins and modules are added in later features (F05 onwards).
 */
export function buildServer(options: BuildServerOptions = {}): FastifyInstance {
  return Fastify({
    logger: options.logger ?? true,
  });
}
