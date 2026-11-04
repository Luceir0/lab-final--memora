import type { InvitationState, ListInvitationsResponse } from '@memora/shared';

import {
  Prisma,
  type Invitation,
  type Membership,
  type PrismaClient,
  type User,
} from '../../generated/prisma/client.ts';
import { hashSessionToken } from '../auth/session.ts';
import { encodeInvitationCursor, type InvitationCursor } from './cursor.ts';
import { toInvitationDto } from './dto.ts';
import { createInvitationToken, hashInvitationToken, invitationExpiresAt } from './token.ts';

/**
 * Data access for the invitations module.
 *
 * Authorization is decided in the route with `can()`; this service only answers
 * "what does the database say". The raw token is created here, returned to the
 * route once, and never stored: the row keeps only its SHA-256 hash.
 */

/**
 * Relations needed by every response that embeds the circle.
 *
 * `coverPhoto` is required to build a `CircleDto`; `creator.name` is the only
 * field the preview exposes about the inviter.
 */
const invitationRelations = {
  circle: { include: { coverPhoto: true } },
  creator: { select: { name: true } },
} satisfies Prisma.InvitationInclude;

export type InvitationWithRelations = Prisma.InvitationGetPayload<{
  include: typeof invitationRelations;
}>;

export interface NewInvitationInput {
  readonly circleId: string;
  readonly createdBy: string;
  readonly invitedEmail: string | null;
  readonly now: Date;
}

export interface NewInvitation {
  readonly invitation: Invitation;
  /** Raw token: the only time it exists outside the client's link. */
  readonly token: string;
}

export interface InvitationPageParams {
  readonly cursor: InvitationCursor | null;
  readonly limit: number;
  readonly now: Date;
}

/** Creates a pending invitation; the caller sends the email afterwards. */
export async function createInvitation(
  prisma: PrismaClient,
  input: NewInvitationInput,
): Promise<NewInvitation> {
  const token = createInvitationToken();

  const invitation = await prisma.invitation.create({
    data: {
      circleId: input.circleId,
      tokenHash: hashInvitationToken(token),
      createdBy: input.createdBy,
      invitedEmail: input.invitedEmail,
      expiresAt: invitationExpiresAt(input.now),
    },
  });

  return { invitation, token };
}

/**
 * Page of invitations that are still usable: not revoked, not accepted and not
 * expired, ordered by `createdAt desc, id desc`.
 *
 * "Pending" is deliberately narrower than "all invitations": accepted and
 * expired rows are history, and the owner does not need them to manage links.
 */
export async function listPendingInvitationsPage(
  prisma: PrismaClient,
  circleId: string,
  { cursor, limit, now }: InvitationPageParams,
): Promise<ListInvitationsResponse> {
  const rows = await prisma.invitation.findMany({
    where: {
      circleId,
      revokedAt: null,
      acceptedAt: null,
      expiresAt: { gt: now },
      // `(createdAt, id)` keyset: strictly older timestamps first, and for the
      // same timestamp the id must be smaller (descending tie-break).
      ...(cursor === null
        ? {}
        : {
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { lt: cursor.id } },
            ],
          }),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    // One extra row only signals whether another page exists.
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map((row) => toInvitationDto(row)),
    nextCursor:
      hasMore && last !== undefined
        ? encodeInvitationCursor({ createdAt: last.createdAt, id: last.id })
        : null,
  };
}

/** Finds an invitation by its hash, with the data every response needs. */
export function findInvitationByToken(
  prisma: PrismaClient,
  tokenHash: string,
): Promise<InvitationWithRelations | null> {
  return prisma.invitation.findUnique({
    where: { tokenHash },
    include: invitationRelations,
  });
}

/**
 * Resolves the four preview states. Order matters and is part of the contract:
 * `revoked` > `expired` > `already_member` > `valid`.
 */
export function resolveInvitationState(
  invitation: Pick<Invitation, 'revokedAt' | 'expiresAt'>,
  options: { readonly isMember: boolean; readonly now: Date },
): InvitationState {
  if (invitation.revokedAt !== null) {
    return 'revoked';
  }

  if (invitation.expiresAt.getTime() <= options.now.getTime()) {
    return 'expired';
  }

  return options.isMember ? 'already_member' : 'valid';
}

/**
 * Session viewer for the public preview.
 *
 * The preview never requires a session, so a missing, unknown or expired cookie
 * means "anonymous", not `401`. The stale row is left for `resolveSession()` to
 * clean up on the next authenticated request.
 */
export async function findSessionViewer(
  prisma: PrismaClient,
  sessionToken: unknown,
  now: Date,
): Promise<User | null> {
  if (typeof sessionToken !== 'string' || sessionToken.length === 0) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(sessionToken) },
    include: { user: true },
  });

  if (session === null || session.expiresAt.getTime() <= now.getTime()) {
    return null;
  }

  return session.user;
}

export function findMembership(
  prisma: PrismaClient,
  circleId: string,
  userId: string,
): Promise<Membership | null> {
  return prisma.membership.findUnique({
    where: { circleId_userId: { circleId, userId } },
  });
}

export type RevokeInvitationOutcome = 'revoked' | 'unchanged' | 'missing';

/**
 * Idempotent revocation.
 *
 * A missing (or foreign-circle) row is `missing` → 404. An invitation that was
 * already revoked, already accepted or has expired is `unchanged` → 204 with no
 * write: revoking an accepted invitation must not expel the member.
 */
export async function revokeInvitation(
  prisma: PrismaClient,
  input: { readonly circleId: string; readonly invitationId: string; readonly now: Date },
): Promise<RevokeInvitationOutcome> {
  const invitation = await prisma.invitation.findFirst({
    where: { id: input.invitationId, circleId: input.circleId },
    select: { id: true, revokedAt: true, acceptedAt: true, expiresAt: true },
  });

  if (invitation === null) {
    return 'missing';
  }

  if (
    invitation.revokedAt !== null ||
    invitation.acceptedAt !== null ||
    invitation.expiresAt.getTime() <= input.now.getTime()
  ) {
    return 'unchanged';
  }

  // `updateMany` with the same guards avoids `P2025` if another request revokes
  // or accepts the invitation between the read and this write.
  const result = await prisma.invitation.updateMany({
    where: {
      id: input.invitationId,
      revokedAt: null,
      acceptedAt: null,
      expiresAt: { gt: input.now },
    },
    data: { revokedAt: input.now },
  });

  return result.count === 0 ? 'unchanged' : 'revoked';
}

export type AcceptInvitationOutcome =
  | { readonly outcome: 'joined'; readonly role: Membership['role'] }
  | { readonly outcome: 'already_member'; readonly role: Membership['role'] }
  /** Revoked, expired or deleted between the route read and the transaction. */
  | { readonly outcome: 'unavailable' }
  /** The circle disappeared mid-transaction (FK failure). */
  | { readonly outcome: 'gone' };

interface JoinInvitationInput {
  readonly invitationId: string;
  readonly circleId: string;
  readonly userId: string;
  readonly now: Date;
}

/** Internal signal: another transaction revoked or expired the invitation. */
class InvitationUnavailableError extends Error {}

/**
 * Joins the circle through an invitation, idempotently per user.
 *
 * The membership row, the `member_joined` activity and the `acceptedAt` /
 * `acceptedBy` marker are written in one transaction. Two concurrent
 * acceptances by the same user resolve as `already_member` through `P2002`; a
 * circle deleted mid-flight resolves as `gone` instead of a 500.
 *
 * The link stays reusable until it expires (auth.md), so `acceptedAt` is the
 * last acceptance and does not gate later joins.
 */
export async function joinThroughInvitation(
  prisma: PrismaClient,
  input: JoinInvitationInput,
): Promise<AcceptInvitationOutcome> {
  const existing = await findMembership(prisma, input.circleId, input.userId);

  if (existing !== null) {
    return { outcome: 'already_member', role: existing.role };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.invitation.updateMany({
        where: {
          id: input.invitationId,
          revokedAt: null,
          expiresAt: { gt: input.now },
        },
        data: { acceptedAt: input.now, acceptedBy: input.userId },
      });

      if (claimed.count === 0) {
        throw new InvitationUnavailableError();
      }

      await tx.membership.create({
        data: {
          circleId: input.circleId,
          userId: input.userId,
          role: 'member',
          joinedAt: input.now,
        },
      });

      await tx.activity.create({
        data: {
          circleId: input.circleId,
          actorId: input.userId,
          type: 'member_joined',
          // No PII: the actor and the circle identify the event.
          metadata: {},
        },
      });
    });

    return { outcome: 'joined', role: 'member' };
  } catch (error) {
    if (error instanceof InvitationUnavailableError) {
      return { outcome: 'unavailable' };
    }

    if (isPrismaError(error, 'P2002')) {
      // Another request created the membership first; the whole transaction of
      // the loser rolled back, so there is no duplicate activity either.
      const membership = await findMembership(prisma, input.circleId, input.userId);

      return { outcome: 'already_member', role: membership?.role ?? 'member' };
    }

    if (isPrismaError(error, 'P2025') || isPrismaError(error, 'P2003')) {
      return { outcome: 'gone' };
    }

    throw error;
  }
}

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
