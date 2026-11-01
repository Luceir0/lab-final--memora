import { z } from 'zod';

import { ApiError } from '../errors.ts';
import type { MemoraServer } from '../types.ts';

const validateBodySchema = z.object({
  message: z.string().min(1).max(10),
});

export const REDACTION_PROBE = {
  password: 'password-secret-value',
  token: 'token-secret-value',
  passwordHash: 'password-hash-secret-value',
  tokenHash: 'token-hash-secret-value',
  csrfToken: 'csrf-token-secret-value',
  sessionToken: 'session-token-secret-value',
  sessionSecret: 'session-secret-value',
  email: 'person@example.test',
  user: {
    passwordHash: 'nested-password-hash-secret-value',
    email: 'nested-email-secret-value@example.test',
  },
  meta: {
    session: {
      token: 'deep-session-token-secret-value',
    },
  },
  req: {
    headers: {
      cookie: 'memora_session=cookie-secret-value',
      authorization: 'Bearer authorization-secret-value',
      'x-csrf-token': 'csrf-secret-value',
    },
  },
  res: {
    headers: {
      'set-cookie': 'memora_session=set-cookie-secret-value',
    },
  },
} as const;

/**
 * Routes that exist only in tests.
 *
 * They exercise validation, the 500 branch and log redaction without shipping
 * product behaviour or debug endpoints.
 */
export function registerTestRoutes(app: MemoraServer): void {
  app.post(
    '/api/__test__/validate',
    {
      schema: {
        hide: true,
        body: validateBodySchema,
      },
    },
    async (request) => ({ message: request.body.message }),
  );

  app.get(
    '/api/__test__/boom',
    {
      schema: { hide: true },
    },
    async () => {
      throw new Error('boom: internal detail that must never reach the client');
    },
  );

  app.get(
    '/api/__test__/log',
    {
      schema: { hide: true },
    },
    async (request) => {
      request.log.info(REDACTION_PROBE, 'redaction probe');

      return { ok: true };
    },
  );

  app.post(
    '/api/__test__/upload',
    {
      schema: { hide: true },
    },
    async (request) => {
      const file = await request.file();

      if (file === undefined) {
        throw new ApiError('VALIDATION_ERROR', {
          details: [{ message: 'Falta el archivo.' }],
        });
      }

      const buffer = await file.toBuffer();

      return {
        filename: file.filename,
        mimetype: file.mimetype,
        size: buffer.length,
      };
    },
  );
}
