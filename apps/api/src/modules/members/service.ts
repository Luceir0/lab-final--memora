import type { ListMembersResponse, PersonPhotosResponse } from '@memora/shared';

import type { Circle, Membership, PrismaClient } from '../../generated/prisma/client.ts';
import {
  encodeMemberCursor,
  encodePersonPhotoCursor,
  type MemberCursor,
  type PersonPhotoCursor,
} from './cursor.ts';
import { toMemberDto, toPhotoDto, type PhotoWithRelations, type PublicUser } from './dto.ts';

/**
 * Data access for the members module.
 *
 * Every read requires a membership row for the requesting user (checked in the
 * route), so a stranger always sees `404 NOT_FOUND`. Authorization itself is
 * decided with `can()` in the route, never here.
 *
 * Every embedded `User` is selected with `{ id, name, avatarUrl }`: a plain
 * `include: { user: true }` would load `email` and `passwordHash` into the API
 * process even though the DTO never serialises them. The public identity is the
 * only thing this module needs, so it is the only thing it reads.
 */

export interface MemberPageParams {
  readonly cursor: MemberCursor | null;
  readonly limit: number;
}

export interface PersonPhotoPageParams {
  readonly cursor: PersonPhotoCursor | null;
  readonly limit: number;
}

/** Fields of `User` that may leave the API. */
const publicUserSelect = {
  id: true,
  name: true,
  avatarUrl: true,
} as const satisfies Record<keyof PublicUser, true>;

/** Membership of one user in one circle, or `null` when they are not a member. */
export function findCircleMember(
  prisma: PrismaClient,
  circleId: string,
  userId: string,
): Promise<(Membership & { readonly user: PublicUser }) | null> {
  return prisma.membership.findUnique({
    where: { circleId_userId: { circleId, userId } },
    include: { user: { select: publicUserSelect } },
  });
}

/**
 * Keyset page of members ordered by `joinedAt asc, id asc`.
 *
 * The owner's membership is created together with the circle, so this order
 * keeps the owner first. Counts are resolved with **one** extra grouped query
 * for the whole page (`photoTag.groupBy`), never one query per member:
 * - only tags on photos of this circle count, so a tag in another circle is
 *   invisible here (AC-05);
 * - a member with no tags is reported as `0`.
 */
export async function listMembersPage(
  prisma: PrismaClient,
  circle: Pick<Circle, 'id' | 'ownerId'>,
  { cursor, limit }: MemberPageParams,
): Promise<ListMembersResponse> {
  const rows = await prisma.membership.findMany({
    where: {
      circleId: circle.id,
      // `(joinedAt, id)` keyset: strictly later joins first, and for the same
      // timestamp the id must be greater (ascending tie-break).
      ...(cursor === null
        ? {}
        : {
            OR: [
              { joinedAt: { gt: cursor.joinedAt } },
              { joinedAt: cursor.joinedAt, id: { gt: cursor.id } },
            ],
          }),
    },
    include: { user: { select: publicUserSelect } },
    orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
    // One extra row only signals whether another page exists.
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);
  const counts = await loadPhotosCounts(
    prisma,
    circle.id,
    page.map((row) => row.userId),
  );

  return {
    items: page.map((row) => toMemberDto(row, row.user, circle, counts.get(row.userId) ?? 0)),
    nextCursor:
      hasMore && last !== undefined
        ? encodeMemberCursor({ joinedAt: last.joinedAt, id: last.id })
        : null,
  };
}

/** Tagged-photo counts of a whole page, in a single grouped query. */
async function loadPhotosCounts(
  prisma: PrismaClient,
  circleId: string,
  userIds: readonly string[],
): Promise<ReadonlyMap<string, number>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const groups = await prisma.photoTag.groupBy({
    by: ['taggedUserId'],
    where: {
      taggedUserId: { in: [...userIds] },
      // Scope the count to this circle: `PhotoTag` has no `circleId`.
      photo: { circleId },
    },
    _count: { _all: true },
  });

  return new Map(groups.map((group) => [group.taggedUserId, group._count._all]));
}

/**
 * Expels a member from a circle.
 *
 * Runs in one transaction: the person's membership row is deleted first and
 * then their tags **in this circle**. That order is deliberate: it matches the
 * `Membership → PhotoTag` lock order used by `addPhotoTag` (which locks the
 * membership `FOR SHARE`), so an expulsion that wins cannot leave behind a tag
 * committed concurrently for a former member. Tags they created for other
 * people, tags of other circles, their photos, those photos' authorship and
 * `Activity` are untouched (AC-04). Returns the number of deleted memberships
 * so the route can map a lost race to `404`.
 */
export async function removeCircleMember(
  prisma: PrismaClient,
  circleId: string,
  userId: string,
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const removed = await tx.membership.deleteMany({
      // The role is never part of the condition: ownership is decided by
      // `Circle.ownerId` in the route before reaching this point.
      where: { circleId, userId },
    });

    await tx.photoTag.deleteMany({
      where: { taggedUserId: userId, photo: { circleId } },
    });

    return removed.count;
  });
}

/**
 * Leaves a circle voluntarily.
 *
 * Same transactional cleanup as `removeCircleMember`, for the caller's own
 * row. The route rejects the owner before calling this, so the owner can never
 * delete their own membership here.
 */
export async function leaveCircle(
  prisma: PrismaClient,
  circleId: string,
  userId: string,
): Promise<number> {
  return removeCircleMember(prisma, circleId, userId);
}

/**
 * Photos of one circle where `userId` is tagged, newest first.
 *
 * The `circleId` filter is on `Photo`, the tag filter on `tags.some`, so a tag
 * on a photo of another circle never leaks into this list (AC-07).
 */
export async function listPersonPhotosPage(
  prisma: PrismaClient,
  circleId: string,
  userId: string,
  { cursor, limit }: PersonPhotoPageParams,
): Promise<PersonPhotosResponse> {
  const rows = await prisma.photo.findMany({
    where: {
      circleId,
      tags: { some: { taggedUserId: userId } },
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
    include: {
      uploader: { select: publicUserSelect },
      // Stable tag order: the client compares lists between renders.
      tags: {
        select: { taggedUser: { select: publicUserSelect } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page: PhotoWithRelations[] = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map((row) => toPhotoDto(row)),
    nextCursor:
      hasMore && last !== undefined
        ? encodePersonPhotoCursor({ createdAt: last.createdAt, id: last.id })
        : null,
  };
}
