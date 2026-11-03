import { z } from 'zod';

import { ApiError } from '../../errors.ts';

/**
 * Opaque keyset cursor for `GET /circles`.
 *
 * The API sorts by `(updatedAt desc, id desc)` and the cursor carries the last
 * row of the previous page, base64url-encoded so clients treat it as a token.
 * It is API infrastructure, not a shared contract: the wire format may change.
 */

const cursorPayloadSchema = z.object({
  updatedAt: z.iso.datetime(),
  id: z.string().min(1).max(64),
});

export interface CircleCursor {
  readonly updatedAt: Date;
  readonly id: string;
}

const INVALID_CURSOR_MESSAGE = 'El cursor no es válido.';

/** Encodes the last row of a page. Deterministic for the same row. */
export function encodeCircleCursor(cursor: CircleCursor): string {
  return Buffer.from(
    JSON.stringify({ updatedAt: cursor.updatedAt.toISOString(), id: cursor.id }),
    'utf8',
  ).toString('base64url');
}

/**
 * Decodes a client cursor. Anything that is not a canonical payload →
 * `400 VALIDATION_ERROR` with the `cursor` field, never a 500.
 */
export function decodeCircleCursor(raw: string): CircleCursor {
  const parsed = parseCursor(raw);

  if (parsed === null) {
    throw new ApiError('VALIDATION_ERROR', {
      message: 'Revisa el cursor de paginación.',
      details: [{ field: 'cursor', message: INVALID_CURSOR_MESSAGE }],
    });
  }

  return { updatedAt: new Date(parsed.updatedAt), id: parsed.id };
}

function parseCursor(raw: string): { updatedAt: string; id: string } | null {
  // `base64url` decoding never throws: invalid characters are ignored, and a
  // payload that survives decoding must still parse as JSON and match the
  // schema below.
  const decoded = Buffer.from(raw, 'base64url').toString('utf8');

  let payload: unknown;

  try {
    payload = JSON.parse(decoded);
  } catch {
    return null;
  }

  const result = cursorPayloadSchema.safeParse(payload);

  return result.success ? result.data : null;
}
