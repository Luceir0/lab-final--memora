import type { ListAlbumsResponse } from '@memora/shared';

import {
  Prisma,
  type Circle,
  type Membership,
  type PrismaClient,
} from '../../generated/prisma/client.ts';
import { encodeAlbumCursor, type AlbumCursor } from './cursor.ts';
import { toAlbumDto, type AlbumWithRelations, type PublicUser } from './dto.ts';

/**
 * Data access for the albums module.
 *
 * Every read that exposes an album requires a membership row for the requesting
 * user in the circle that owns it. That is the single gate that turns a
 * stranger into a `404` instead of a `403` and keeps other circles invisible.
 * Authorization itself is decided with `can()` in the route, never here.
 *
 * Embedded users are selected with `{ id, name, avatarUrl }`: a plain
 * `include: { creator: true }` would load `email` and `passwordHash` into the
 * API process even though the DTO never serialises them.
 */

/** Fields of `User` that may leave the API. */
const publicUserSelect = {
  id: true,
  name: true,
  avatarUrl: true,
} as const satisfies Record<keyof PublicUser, true>;

/** Relations every album payload embeds, shared by all the queries below. */
const albumInclude = {
  coverPhoto: true,
  creator: { select: publicUserSelect },
  _count: { select: { photos: true } },
} as const;

export interface AlbumMembership {
  readonly album: AlbumWithRelations;
  readonly circle: Circle;
  readonly membership: Membership;
}

export interface AlbumPageParams {
  readonly cursor: AlbumCursor | null;
  readonly limit: number;
}

export interface NewAlbumInput {
  readonly circleId: string;
  readonly createdById: string;
  readonly title: string;
  readonly description: string | null;
  readonly date: Date | null;
}

export interface AlbumUpdateInput {
  readonly title?: string | undefined;
  readonly description?: string | null | undefined;
  readonly date?: Date | null | undefined;
  readonly coverPhotoId?: string | null | undefined;
}

/** Result of the atomic delete: a lost race is never an exception. */
export type DeleteAlbumOutcome = 'deleted' | 'missing' | 'not_empty';

/**
 * Loads an album only when `userId` has a membership row in its circle.
 *
 * Returns `null` for a missing album, an album of another circle and an album
 * in a circle the user does not belong to: the route maps all of them to the
 * same `404 NOT_FOUND`.
 */
export async function findAlbumForMember(
  prisma: PrismaClient,
  albumId: string,
  userId: string,
): Promise<AlbumMembership | null> {
  const row = await prisma.album.findFirst({
    where: {
      id: albumId,
      circle: { memberships: { some: { userId } } },
    },
    include: {
      ...albumInclude,
      circle: { include: { memberships: { where: { userId } } } },
    },
  });

  if (row === null) {
    return null;
  }

  const membership = row.circle.memberships[0];

  if (membership === undefined) {
    // The `where` above guarantees at least one row; reaching this point means
    // the database and the query disagree, which is an internal error.
    throw new Error('Un álbum accesible no tiene la membresía esperada.');
  }

  return { album: row, circle: row.circle, membership };
}

/** Keyset page of a circle's albums, newest first. */
export async function listAlbumsPage(
  prisma: PrismaClient,
  circleId: string,
  { cursor, limit }: AlbumPageParams,
): Promise<ListAlbumsResponse> {
  const rows = await prisma.album.findMany({
    where: {
      circleId,
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
    include: albumInclude,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    // One extra row only signals whether another page exists.
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map((row) => toAlbumDto(row)),
    nextCursor:
      hasMore && last !== undefined
        ? encodeAlbumCursor({ createdAt: last.createdAt, id: last.id })
        : null,
  };
}

/**
 * Creates the album and its `album.created` activity in one transaction
 * (AC-01 and activity.md): either both rows exist or neither does.
 */
export async function createAlbumWithActivity(
  prisma: PrismaClient,
  input: NewAlbumInput,
): Promise<AlbumWithRelations> {
  return prisma.$transaction(async (tx) => {
    const album = await tx.album.create({
      data: {
        circleId: input.circleId,
        createdBy: input.createdById,
        title: input.title,
        description: input.description,
        date: input.date,
      },
      include: albumInclude,
    });

    await tx.activity.create({
      data: {
        circleId: input.circleId,
        actorId: input.createdById,
        type: 'album_created',
        albumId: album.id,
        // No PII: the album title is the only payload.
        metadata: { albumTitle: album.title },
      },
    });

    return album;
  });
}

/** Applies a partial update. Omitted fields keep their persisted value. */
export async function updateAlbum(
  prisma: PrismaClient,
  albumId: string,
  update: AlbumUpdateInput,
): Promise<AlbumWithRelations> {
  return prisma.album.update({
    where: { id: albumId },
    data: {
      ...(update.title === undefined ? {} : { title: update.title }),
      ...(update.description === undefined ? {} : { description: update.description }),
      ...(update.date === undefined ? {} : { date: update.date }),
      ...(update.coverPhotoId === undefined ? {} : { coverPhotoId: update.coverPhotoId }),
    },
    include: albumInclude,
  });
}

/** Returns the photo id only when it belongs to the album and its circle. */
export async function findAlbumPhoto(
  prisma: PrismaClient,
  albumId: string,
  circleId: string,
  photoId: string,
): Promise<{ readonly id: string } | null> {
  return prisma.photo.findFirst({
    where: { id: photoId, albumId, circleId },
    select: { id: true },
  });
}

/**
 * Deletes an album only when it has no photos, inside one transaction.
 *
 * A `SELECT ... FOR UPDATE` on the album row makes the emptiness check
 * authoritative: a concurrent photo insert takes a `KEY SHARE` lock on the same
 * row, so it waits for this transaction (or this one waits for it) and the count
 * below always sees committed photos. The previous `deleteMany` with
 * `photos: { none: {} }` was not enough under `READ COMMITTED`, because the
 * `NOT EXISTS` ran before the row lock and a concurrently committed photo could
 * still be removed by the FK cascade.
 *
 * A missing row is `missing` (the route answers `404`), photos are `not_empty`
 * (the route answers `409 ALBUM_NOT_EMPTY`) and a successful delete is
 * `deleted`.
 */
export async function deleteAlbumIfEmpty(
  prisma: PrismaClient,
  albumId: string,
  circleId: string,
): Promise<DeleteAlbumOutcome> {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Album" WHERE "id" = ${albumId} AND "circleId" = ${circleId} FOR UPDATE
    `;

    if (locked.length === 0) {
      return 'missing';
    }

    const photosCount = await tx.photo.count({ where: { albumId } });

    if (photosCount > 0) {
      return 'not_empty';
    }

    await tx.album.delete({ where: { id: albumId } });

    return 'deleted';
  });
}

/**
 * Empties the album: deletes its photos and their tags in one transaction.
 *
 * `PhotoTag` rows are removed by the database cascade and `Activity.photoId`
 * becomes `null` through `SetNull`, so the historical events survive with their
 * album reference intact. Storage objects are intentionally **not** deleted
 * here: the real storage adapter arrives in F25 (G1 decision 3).
 *
 * Returns `null` when the album no longer exists, so the route can answer
 * `404` instead of a misleading `{ deletedCount: 0 }`.
 */
export async function emptyAlbum(
  prisma: PrismaClient,
  albumId: string,
  circleId: string,
): Promise<number | null> {
  return prisma.$transaction(async (tx) => {
    const album = await tx.album.findFirst({
      where: { id: albumId, circleId },
      select: { id: true },
    });

    if (album === null) {
      return null;
    }

    const deleted = await tx.photo.deleteMany({ where: { albumId, circleId } });

    // The album could have been deleted by another request after the read.
    // Re-check inside the transaction so the route answers `404` instead of a
    // misleading `{ deletedCount: 0 }`.
    const stillExists = await tx.album.findFirst({
      where: { id: albumId, circleId },
      select: { id: true },
    });

    return stillExists === null ? null : deleted.count;
  });
}

/** Prisma errors meaning the row changed between the read and the write. */
export function isAlbumWriteRace(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2025' || error.code === 'P2003')
  );
}
