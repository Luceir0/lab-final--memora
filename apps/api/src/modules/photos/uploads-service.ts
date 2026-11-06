import {
  MY_UPLOADS_PREVIEW_LIMIT,
  type MyUploadsAlbumGroup,
  type MyUploadsCircleGroup,
  type MyUploadsPhotosResponse,
  type MyUploadsSummary,
  type PhotoSummary,
} from '@memora/shared';

import { Prisma, type PrismaClient } from '../../generated/prisma/client.ts';
import {
  toPhotoDto,
  toPhotoSummary,
  type PhotoWithRelations,
  type PublicUser,
} from '../members/dto.ts';
import { encodeMyUploadsCursor, type MyUploadsCursor } from './uploads-cursor.ts';

/**
 * Data access for «Mis subidas» (`/me/uploads`).
 *
 * Visibility rule: a photo is listed only when its `uploaderId` is the
 * requesting user **and** that user still has a membership row in the photo's
 * circle. Leaving a circle keeps the authorship row but hides everything from
 * these endpoints, which is why the listing answers `404` for an album the user
 * can no longer access (never `403`).
 *
 * No N+1: the summary uses one `groupBy` for the per-album counts and one
 * `ROW_NUMBER()` query for every album's preview in a single round trip.
 */

/** Fields of `User` that may leave the API. */
const publicUserSelect = {
  id: true,
  name: true,
  avatarUrl: true,
} as const satisfies Record<keyof PublicUser, true>;

export interface MyUploadsPageParams {
  readonly cursor: MyUploadsCursor | null;
  readonly limit: number;
}

export interface AccessibleAlbum {
  readonly id: string;
  readonly circleId: string;
}

interface PreviewRow {
  readonly id: string;
  readonly albumId: string;
  readonly width: number;
  readonly height: number;
}

interface MutableCircleGroup {
  readonly circle: { readonly id: string; readonly name: string };
  photosCount: number;
  lastUploadAt: Date;
  readonly albums: MyUploadsAlbumGroup[];
}

/**
 * Groups the user's visible photos by circle and album.
 *
 * Circles are ordered by their newest upload (`lastUploadAt desc`, `id asc`);
 * albums by their own `lastUploadAt desc`, `id asc`. Each album carries up to
 * `MY_UPLOADS_PREVIEW_LIMIT` photos as decorative previews.
 */
export async function getMyUploadsSummary(
  prisma: PrismaClient,
  userId: string,
): Promise<MyUploadsSummary> {
  const groups = await prisma.photo.groupBy({
    by: ['albumId'],
    where: {
      uploaderId: userId,
      // Membership is checked by the database, so photos from a circle the
      // user left are not counted even though `uploaderId` still matches.
      circle: { memberships: { some: { userId } } },
    },
    _count: { _all: true },
    _max: { createdAt: true },
  });

  if (groups.length === 0) {
    return { total: 0, circles: [] };
  }

  const albumIds = groups.map((group) => group.albumId);

  // Counts and previews are independent; run them together. The album lookup
  // re-applies the membership filter so a stale group row cannot leak a title
  // of a circle the user no longer belongs to.
  const [albums, previews] = await Promise.all([
    prisma.album.findMany({
      where: {
        id: { in: albumIds },
        circle: { memberships: { some: { userId } } },
      },
      select: {
        id: true,
        title: true,
        circle: { select: { id: true, name: true } },
      },
    }),
    loadAlbumPreviews(prisma, userId, albumIds),
  ]);

  const albumById = new Map(albums.map((album) => [album.id, album]));
  const circles = new Map<string, MutableCircleGroup>();

  for (const group of groups) {
    const album = albumById.get(group.albumId);
    const lastUploadAt = group._max.createdAt;

    // A concurrent album delete cascades its photos; skip the stale group row.
    if (album === undefined || lastUploadAt === null) {
      continue;
    }

    const albumGroup: MyUploadsAlbumGroup = {
      album: { id: album.id, title: album.title },
      photosCount: group._count._all,
      lastUploadAt: lastUploadAt.toISOString(),
      preview: previews.get(album.id) ?? [],
    };

    const circle = circles.get(album.circle.id);

    if (circle === undefined) {
      circles.set(album.circle.id, {
        circle: { id: album.circle.id, name: album.circle.name },
        photosCount: albumGroup.photosCount,
        lastUploadAt,
        albums: [albumGroup],
      });
      continue;
    }

    circle.photosCount += albumGroup.photosCount;

    if (lastUploadAt.getTime() > circle.lastUploadAt.getTime()) {
      circle.lastUploadAt = lastUploadAt;
    }

    circle.albums.push(albumGroup);
  }

  const ordered = [...circles.values()]
    .sort(
      (left, right) =>
        right.lastUploadAt.getTime() - left.lastUploadAt.getTime() ||
        compareIds(left.circle.id, right.circle.id),
    )
    .map((group): MyUploadsCircleGroup => {
      group.albums.sort(
        (left, right) =>
          compareIsoDesc(left.lastUploadAt, right.lastUploadAt) ||
          compareIds(left.album.id, right.album.id),
      );

      return {
        circle: group.circle,
        photosCount: group.photosCount,
        albums: group.albums,
      };
    });

  return {
    total: ordered.reduce((sum, group) => sum + group.photosCount, 0),
    circles: ordered,
  };
}

/**
 * Loads up to `MY_UPLOADS_PREVIEW_LIMIT` previews of every album in one query.
 *
 * `ROW_NUMBER()` partitions by album and orders by `(createdAt desc, id desc)`,
 * so the database returns at most that many rows per album; a per-album loop
 * would be the N+1 this endpoint must avoid. The membership join keeps the
 * previews consistent with the counts even if the user left a circle mid-request.
 */
async function loadAlbumPreviews(
  prisma: PrismaClient,
  userId: string,
  albumIds: readonly string[],
): Promise<ReadonlyMap<string, PhotoSummary[]>> {
  const rows = await prisma.$queryRaw<PreviewRow[]>`
    SELECT ranked."id", ranked."albumId", ranked."width", ranked."height"
    FROM (
      SELECT
        p."id",
        p."albumId",
        p."width",
        p."height",
        ROW_NUMBER() OVER (
          PARTITION BY p."albumId"
          ORDER BY p."createdAt" DESC, p."id" DESC
        ) AS "position"
      FROM "Photo" p
      INNER JOIN "Membership" m
        ON m."circleId" = p."circleId" AND m."userId" = ${userId}
      WHERE p."uploaderId" = ${userId}
        AND p."albumId" IN (${Prisma.join(albumIds)})
    ) ranked
    WHERE ranked."position" <= ${MY_UPLOADS_PREVIEW_LIMIT}
    ORDER BY ranked."albumId" ASC, ranked."position" ASC
  `;

  const previews = new Map<string, PhotoSummary[]>();

  for (const row of rows) {
    const entry = previews.get(row.albumId) ?? [];

    entry.push(toPhotoSummary(row));
    previews.set(row.albumId, entry);
  }

  return previews;
}

/**
 * Returns the album only when it exists and the user is still a member of its
 * circle. `null` covers a missing album, an album of another circle and a
 * circle the user left; the route maps all of them to `404 NOT_FOUND`.
 */
export async function findAccessibleAlbum(
  prisma: PrismaClient,
  albumId: string,
  userId: string,
): Promise<AccessibleAlbum | null> {
  return prisma.album.findFirst({
    where: {
      id: albumId,
      circle: { memberships: { some: { userId } } },
    },
    select: { id: true, circleId: true },
  });
}

/** Keyset page of the user's own photos in an accessible album, newest first. */
export async function listMyAlbumPhotosPage(
  prisma: PrismaClient,
  albumId: string,
  userId: string,
  { cursor, limit }: MyUploadsPageParams,
): Promise<MyUploadsPhotosResponse> {
  // Membership was verified by `findAccessibleAlbum`; filtering by uploader is
  // what hides other members' photos of the same album.
  const [total, rows] = await Promise.all([
    prisma.photo.count({ where: { albumId, uploaderId: userId } }),
    prisma.photo.findMany({
      where: {
        albumId,
        uploaderId: userId,
        // `(createdAt, id)` keyset: strictly older timestamps first, and for
        // the same timestamp the id must be smaller (descending tie-break).
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
      // One extra row only signals whether another page exists.
      take: limit + 1,
    }),
  ]);

  const hasMore = rows.length > limit;
  const page: PhotoWithRelations[] = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map((row) => toPhotoDto(row)),
    nextCursor:
      hasMore && last !== undefined
        ? encodeMyUploadsCursor({ createdAt: last.createdAt, id: last.id })
        : null,
    total,
  };
}

/** Plain codepoint comparison: locale-independent `id asc` tie-break. */
function compareIds(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

/** Descending order for canonical ISO timestamps. */
function compareIsoDesc(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  return left < right ? 1 : -1;
}
