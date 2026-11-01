import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { ERROR_MESSAGES } from '@memora/shared';

/** Global ceiling per IP. Per-action limits (login, uploads, downloads) land in F15/F25. */
export const DEFAULT_GLOBAL_RATE_LIMIT = 300;

export interface RateLimitOptions {
  readonly max?: number;
  readonly timeWindow?: string;
}

export async function registerRateLimit(
  app: FastifyInstance,
  options: RateLimitOptions = {},
): Promise<void> {
  await app.register(rateLimit, {
    global: true,
    max: options.max ?? DEFAULT_GLOBAL_RATE_LIMIT,
    timeWindow: options.timeWindow ?? '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      code: 'RATE_LIMITED',
      message: ERROR_MESSAGES.RATE_LIMITED,
      details: null,
    }),
  });
}
