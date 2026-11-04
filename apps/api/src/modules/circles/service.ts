import {
  DEFAULT_CIRCLE_SETTINGS,
  type CircleSettings,
  type CircleStats,
  type ListCirclesResponse,
} from '@memora/shared';

import type { Circle, Membership, Photo, PrismaClient } from '../../generated/prisma/client.ts';
import { encodeCircleCursor, type CircleCursor } from './cursor.ts';
import { resolveCircleRole, toCircleDto } from './dto.ts';

/**
 * Data access for the circles module.
 *
 * Every read that exposes a circle requires a membership row for the
 * requesting user: that is the single gate that turns a stranger into a 404
 * instead of a 403 and keeps other circles invisible. Authorization itself is
 * decided with `can()` in the route, never here.
 */

export interface CircleMembership {
  readonly circle: Circle;
  readonly membership: Membership;
  readonly coverPhoto: Photo | null;
}

export interface NewCircleInput {
  readonly ownerId: string;
  readonly name: string;
  readonly description: string | null;
  /** Whole object, never merged; omitted means `DEFAULT_CIRCLE_SETTINGS`. */
  readonly settings?: CircleSettings | undefined;
}

export interface CircleUpdateInput {
  readonly name?: string | undefined;
  readonly description?: string | null | undefined;
  readonly coverPhotoId?: string | null | undefined;
  readonly settings?: CircleSettings | undefined;
}

export interface UpdatedCircle {
  readonly circle: Circle;
  readonly coverPhoto: Photo | null;
}

export interface CirclePageParams {
  readonly cursor: CircleCursor | null;
  readonly limit: number;
}

/**
 * Loads a circle only when `userId` has a membership row in it.
 *
 * Returns `null` for a missing circle and for a circle the user does not
 * belong to: the route maps both to the same `404 NOT_FOUND`.
 */
export async function findCircleForMember(
  prisma: PrismaClient,
  circleId: string,
  userId: string,
): Promise<CircleMembership | null> {
  const circle = await prisma.circle.findFirst({
    where: { id: circleId, memberships: { some: { userId } } },
    include: {
      coverPhoto: true,
      memberships: { where: { userId } },
    },
  });

  if (circle === null) {
    return null;
  }

  const membership = circle.memberships[0];

  if (membership === undefined) {
    // The `where` above guarantees at least one row; reaching this point means
    // the database and the query disagree, which is an internal error.
    throw new Error('Un círculo accesible no tiene la membresía esperada.');
  }

  return { circle, membership, coverPhoto: circle.coverPhoto };
}

/** Creates the circle and the creator's `owner` membership atomically (AC-01). */
export async function createCircleWithOwner(
  prisma: PrismaClient,
  input: NewCircleInput,
): Promise<CircleMembership> {
  return prisma.$transaction(async (tx) => {
    const circle = await tx.circle.create({
      data: {
        ownerId: input.ownerId,
        name: input.name,
        description: input.description,
        // `settings` is optional on create: without it the circle starts with
        // every member capability enabled, and when sent it is stored whole.
        settings: { ...(input.settings ?? DEFAULT_CIRCLE_SETTINGS) },
      },
    });

    const membership = await tx.membership.create({
      data: {
        circleId: circle.id,
        userId: input.ownerId,
        role: 'owner',
      },
    });

    return { circle, membership, coverPhoto: null };
  });
}

/** Applies a partial update. `settings` replaces the whole object, never merges. */
export async function updateCircle(
  prisma: PrismaClient,
  circleId: string,
  update: CircleUpdateInput,
): Promise<UpdatedCircle> {
  const circle = await prisma.circle.update({
    where: { id: circleId },
    data: {
      ...(update.name === undefined ? {} : { name: update.name }),
      ...(update.description === undefined ? {} : { description: update.description }),
      ...(update.coverPhotoId === undefined ? {} : { coverPhotoId: update.coverPhotoId }),
      ...(update.settings === undefined ? {} : { settings: { ...update.settings } }),
    },
    include: { coverPhoto: true },
  });

  return { circle, coverPhoto: circle.coverPhoto };
}

/**
 * Deletes the circle row; children are removed by the database cascade.
 *
 * Uses `deleteMany` so a row that disappears between the membership read and
 * the write is reported as `count: 0` instead of throwing `P2025` (which would
 * become a 500).
 */
export async function deleteCircle(prisma: PrismaClient, circleId: string): Promise<number> {
  const result = await prisma.circle.deleteMany({ where: { id: circleId } });

  return result.count;
}

/** Returns the photo id only when it belongs to the circle. */
export async function findCirclePhoto(
  prisma: PrismaClient,
  circleId: string,
  photoId: string,
): Promise<{ readonly id: string } | null> {
  return prisma.photo.findFirst({
    where: { id: photoId, circleId },
    select: { id: true },
  });
}

/**
 * Circle stats scoped to one circle.
 *
 * The three reads run in a single transaction and the query count is constant
 * (no N+1) regardless of how many photos, albums or members the circle has.
 */
export async function loadCircleStats(
  prisma: PrismaClient,
  circleId: string,
): Promise<CircleStats> {
  const [membersCount, albumsCount, photoStats] = await prisma.$transaction([
    prisma.membership.count({ where: { circleId } }),
    prisma.album.count({ where: { circleId } }),
    prisma.photo.aggregate({
      where: { circleId },
      _count: { _all: true },
      _sum: { size: true },
      _max: { createdAt: true },
    }),
  ]);

  return {
    membersCount,
    albumsCount,
    photosCount: photoStats._count._all,
    storageBytes: photoStats._sum.size ?? 0,
    lastUploadAt: photoStats._max.createdAt?.toISOString() ?? null,
  };
}

/** Keyset page of the caller's circles, newest activity first. */
export async function listCirclesPage(
  prisma: PrismaClient,
  userId: string,
  { cursor, limit }: CirclePageParams,
): Promise<ListCirclesResponse> {
  const rows = await prisma.circle.findMany({
    where: {
      memberships: { some: { userId } },
      // `(updatedAt, id)` keyset: strictly older timestamps first, and for the
      // same timestamp the id must be smaller (descending tie-break).
      ...(cursor === null
        ? {}
        : {
            OR: [
              { updatedAt: { lt: cursor.updatedAt } },
              { updatedAt: cursor.updatedAt, id: { lt: cursor.id } },
            ],
          }),
    },
    include: {
      coverPhoto: true,
      memberships: { where: { userId } },
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    // One extra row only signals whether another page exists.
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);

  const items = page.map((row) => {
    const membership = row.memberships[0];

    if (membership === undefined) {
      throw new Error('Un círculo listado no tiene la membresía esperada.');
    }

    return toCircleDto(row, resolveCircleRole(row, userId, membership.role), row.coverPhoto);
  });

  return {
    items,
    nextCursor:
      hasMore && last !== undefined
        ? encodeCircleCursor({ updatedAt: last.updatedAt, id: last.id })
        : null,
  };
}
