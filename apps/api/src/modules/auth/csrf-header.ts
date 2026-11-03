import { z } from 'zod';

import { CSRF_HEADER_NAME } from './constants.ts';

/**
 * Documents `X-CSRF-Token` on authenticated mutations.
 *
 * The header stays optional in the schema on purpose: a missing token must be
 * `403 FORBIDDEN` (checked by `assertCsrfToken`), not a `400` validation error.
 * `plugins/swagger.ts` marks it as required in the generated OpenAPI document.
 *
 * Shared by every module with authenticated mutations (F15, F17, ...).
 */
export const csrfHeaderSchema = z.object({
  [CSRF_HEADER_NAME]: z
    .string()
    .optional()
    .describe('Token CSRF ligado a la sesión actual. Obligatorio en la práctica: 403 si falta.'),
});
