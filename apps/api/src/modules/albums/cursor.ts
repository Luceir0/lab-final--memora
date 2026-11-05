import { z } from 'zod';

import { ApiError } from '../../errors.ts';

/**
 * Opaque keyset cursor for `GET /circles/:circleId/albums`.
 *
 * Albums sort by `(createdAt desc, id desc)` and the cursor carries the last row
 * of the previous page, base64url-encoded so clients treat it as a token. It is
 * API infrastructure, not a shared contract: the wire format may change.
 */

const cursorPayloadSchema = z.object({
  createdAt: z.iso.datetime(),
  id: z.string().min(1).max(64),
});

const INVALID_CURSOR_MESSAGE = 'El cursor no es válido.';

export interface AlbumCursor {
  readonly createdAt: Date;
  readonly id: string;
}

/** Encodes the last row of a page. Deterministic for the same row. */
export function encodeAlbumCursor(cursor: AlbumCursor): string {
  return Buffer.from(
    JSON.stringify({ createdAt: cursor.createdAt.toISOString(), id: cursor.id }),
    'utf8',
  ).toString('base64url');
}

/**
 * Decodes a client cursor. Anything that is not a canonical payload →
 * `400 VALIDATION_ERROR` with the `cursor` field, never a 500.
 */
export function decodeAlbumCursor(raw: string): AlbumCursor {
  // `base64url` decoding never throws: invalid characters are ignored, and a
  // payload that survives decoding must still parse as JSON and match the
  // schema below.
  const decoded = Buffer.from(raw, 'base64url').toString('utf8');

  let payload: unknown;

  try {
    payload = JSON.parse(decoded);
  } catch {
    throw invalidCursor();
  }

  const result = cursorPayloadSchema.safeParse(payload);

  if (!result.success) {
    throw invalidCursor();
  }

  return { createdAt: new Date(result.data.createdAt), id: result.data.id };
}

function invalidCursor(): ApiError {
  return new ApiError('VALIDATION_ERROR', {
    message: 'Revisa el cursor de paginación.',
    details: [{ field: 'cursor', message: INVALID_CURSOR_MESSAGE }],
  });
}
