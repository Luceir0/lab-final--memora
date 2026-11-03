import type { FastifyReply, FastifyRequest } from 'fastify';

import { ApiError } from '../../errors.ts';
import type { PrismaClient } from '../../generated/prisma/client.ts';
import type { MemoraServer } from '../../types.ts';
import { CSRF_HEADER_NAME } from './constants.ts';

/**
 * Shared request guards for authenticated endpoints.
 *
 * Extracted from `routes.ts` in F17 so other modules can reuse exactly the
 * same session/CSRF behaviour. F15 semantics are unchanged.
 */

/** Returns the Prisma client, or fails when the process runs health-only. */
export function requirePrisma(app: MemoraServer): PrismaClient {
  if (app.prisma === null) {
    // Reached only when the process runs without DATABASE_URL (health-only
    // development). Authenticated endpoints have no meaning without persistence.
    throw new Error('La API requiere DATABASE_URL.');
  }

  return app.prisma;
}

/** Session responses must never be cached by browsers or shared proxies. */
export function setPrivateNoStore(reply: FastifyReply): void {
  reply.header('cache-control', 'private, no-store').header('vary', 'Cookie');
}

/** Header token verified against the raw session token (bound by HMAC). */
export function assertCsrfToken(
  request: FastifyRequest,
  app: MemoraServer,
  sessionToken: string,
): void {
  const header = request.headers[CSRF_HEADER_NAME];

  if (typeof header !== 'string' || header.length === 0) {
    throw new ApiError('FORBIDDEN', { message: 'Falta el token CSRF.' });
  }

  if (!app.csrf.verify(sessionToken, header)) {
    throw new ApiError('FORBIDDEN', { message: 'Token CSRF inválido.' });
  }
}
