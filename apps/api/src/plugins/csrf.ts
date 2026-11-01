import { Tokens } from '@fastify/csrf';
import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';

import type { AppConfig } from '../config.ts';

export interface CsrfHelpers {
  /** Creates a double-submit token bound to the caller-provided session secret. */
  create(sessionSecret: string): string;
  /** Verifies a token previously created for the same session secret. */
  verify(sessionSecret: string, token: string): boolean;
}

/**
 * CSRF primitives for double-submit validation.
 *
 * F08 only exposes the helpers. F15 binds them to the session cookie, checks
 * `Origin`/`Referer` and requires `X-CSRF-Token` on authenticated mutations.
 */
export async function registerCsrf(app: FastifyInstance, config: AppConfig): Promise<void> {
  const hmacKey = config.sessionSecret ?? randomBytes(32);

  const tokens = new Tokens({ hmacKey, validity: 0 });

  const helpers: CsrfHelpers = {
    create: (sessionSecret) => tokens.create(sessionSecret),
    verify: (sessionSecret, token) => tokens.verify(sessionSecret, token),
  };

  app.decorate('csrf', helpers);
}

declare module 'fastify' {
  interface FastifyInstance {
    csrf: CsrfHelpers;
  }
}
