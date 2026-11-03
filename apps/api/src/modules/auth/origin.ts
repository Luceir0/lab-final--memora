import type { FastifyRequest } from 'fastify';

import type { AppConfig } from '../../config.ts';
import { ApiError } from '../../errors.ts';

/** Maximum accepted length for an `Origin`/`Referer` value. */
const MAX_ORIGIN_LENGTH = 2_048;

function readCandidate(request: FastifyRequest): string | undefined {
  const { origin, referer } = request.headers;

  if (typeof origin === 'string') {
    return origin;
  }

  if (typeof referer === 'string') {
    return referer;
  }

  return undefined;
}

/**
 * Checks `Origin` (preferred) or `Referer` against `APP_URL`.
 *
 * CSRF defence: `SameSite=Lax` cookies plus a trusted origin on every
 * state-changing request. A missing or unparsable value fails closed.
 */
export function isTrustedOrigin(request: FastifyRequest, appUrl: string): boolean {
  const candidate = readCandidate(request);

  if (candidate === undefined || candidate.length > MAX_ORIGIN_LENGTH) {
    return false;
  }

  try {
    const parsed = new URL(candidate);

    return parsed.origin === appUrl;
  } catch {
    return false;
  }
}

/** Throws `403 FORBIDDEN` when the request origin is missing or not trusted. */
export function assertTrustedOrigin(request: FastifyRequest, config: AppConfig): void {
  if (!isTrustedOrigin(request, config.appUrl)) {
    throw new ApiError('FORBIDDEN', { message: 'Origen no permitido.' });
  }
}
