import { createHash, randomBytes } from 'node:crypto';

/** 32 random bytes: the same strength used for session tokens. */
export const INVITATION_TOKEN_BYTES = 32;

/** `docs/03-architecture/auth.md`: invitations live for 7 days. */
export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Raw token sent in the link. Never persisted and never logged. */
export function createInvitationToken(): string {
  return randomBytes(INVITATION_TOKEN_BYTES).toString('base64url');
}

/**
 * `SHA-256(token)` as lowercase hex: the only form stored in the database.
 *
 * A leaked row cannot be turned back into a usable link, and lookups stay a
 * plain unique index hit.
 */
export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function invitationExpiresAt(now: Date): Date {
  return new Date(now.getTime() + INVITATION_TTL_MS);
}
