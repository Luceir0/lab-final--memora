import { z } from 'zod';

import { ApiError } from '../../errors.ts';

/**
 * Opaque keyset cursors for the members module.
 *
 * Two lists share this file because they are the two sides of the same screen:
 * - members sort by `(joinedAt asc, id asc)`, so the owner — whose membership
 *   is created with the circle — stays first;
 * - a person's photos sort by `(createdAt desc, id desc)`, newest first.
 *
 * The cursors carry the last row of the previous page, base64url-encoded so
 * clients treat them as tokens. They mirror `modules/circles/cursor.ts`; the
 * wire format is API infrastructure, not a shared contract.
 */

const cursorPayloadSchema = z.object({
  at: z.iso.datetime(),
  id: z.string().min(1).max(64),
});

const INVALID_CURSOR_MESSAGE = 'El cursor no es válido.';

/** Sort timestamp of the last row of a members page (`joinedAt`). */
export interface MemberCursor {
  readonly joinedAt: Date;
  readonly id: string;
}

/** Sort timestamp of the last row of a person's photos page (`createdAt`). */
export interface PersonPhotoCursor {
  readonly createdAt: Date;
  readonly id: string;
}

/** Encodes the last row of a page. Deterministic for the same row. */
export function encodeMemberCursor(cursor: MemberCursor): string {
  return encodeCursor(cursor.joinedAt, cursor.id);
}

/** Encodes the last row of a page. Deterministic for the same row. */
export function encodePersonPhotoCursor(cursor: PersonPhotoCursor): string {
  return encodeCursor(cursor.createdAt, cursor.id);
}

/**
 * Decodes a client cursor. Anything that is not a canonical payload →
 * `400 VALIDATION_ERROR` with the `cursor` field, never a 500.
 */
export function decodeMemberCursor(raw: string): MemberCursor {
  const parsed = parseCursor(raw);

  return { joinedAt: parsed.at, id: parsed.id };
}

/** Same contract as `decodeMemberCursor`, for the person photos list. */
export function decodePersonPhotoCursor(raw: string): PersonPhotoCursor {
  const parsed = parseCursor(raw);

  return { createdAt: parsed.at, id: parsed.id };
}

function encodeCursor(at: Date, id: string): string {
  return Buffer.from(JSON.stringify({ at: at.toISOString(), id }), 'utf8').toString('base64url');
}

function parseCursor(raw: string): { readonly at: Date; readonly id: string } {
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

  return { at: new Date(result.data.at), id: result.data.id };
}

function invalidCursor(): ApiError {
  return new ApiError('VALIDATION_ERROR', {
    message: 'Revisa el cursor de paginación.',
    details: [{ field: 'cursor', message: INVALID_CURSOR_MESSAGE }],
  });
}
