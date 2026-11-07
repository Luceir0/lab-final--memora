import { photoTagDtoSchema, type PhotoTagDto } from '@memora/shared';

import { ApiError } from '../../errors.ts';
import { Prisma, type PhotoTag, type PrismaClient } from '../../generated/prisma/client.ts';
import { toUserDto, type PublicUser } from '../members/dto.ts';

/**
 * Data access for `POST /photos/:photoId/tags` and
 * `DELETE /photos/:photoId/tags/:userId` (F32).
 *
 * Authorization stays in the route: this module only persists tags and maps
 * them to the frozen `PhotoTagDto`. The tagged user select never includes
 * `email`, storage keys or coordinates.
 */

/** Only the public identity columns a `PhotoTagDto` embeds. */
const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
} as const;

export const PHOTO_TAG_INCLUDE = {
  taggedUser: { select: PUBLIC_USER_SELECT },
} as const satisfies Prisma.PhotoTagInclude;

/** Persisted tag plus the public identity of the tagged user. */
export interface PhotoTagWithUser extends PhotoTag {
  readonly taggedUser: PublicUser;
}

/** Maps a persisted tag to the frozen contract. Email never leaves the database. */
export function toPhotoTagDto(tag: PhotoTagWithUser): PhotoTagDto {
  return photoTagDtoSchema.parse({
    id: tag.id,
    photoId: tag.photoId,
    user: toUserDto(tag.taggedUser),
    createdAt: tag.createdAt.toISOString(),
  });
}

export interface AddPhotoTagInput {
  readonly photoId: string;
  /** Circle that owns the photo; the target must be a current member of it. */
  readonly circleId: string;
  readonly taggedUserId: string;
  readonly createdBy: string;
}

export type AddPhotoTagOutcome =
  | { readonly status: 200; readonly tag: PhotoTagDto }
  | { readonly status: 201; readonly tag: PhotoTagDto };

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function findPhotoTag(
  prisma: PrismaClient,
  photoId: string,
  taggedUserId: string,
): Promise<PhotoTagWithUser | null> {
  return prisma.photoTag.findUnique({
    where: { photoId_taggedUserId: { photoId, taggedUserId } },
    include: PHOTO_TAG_INCLUDE,
  });
}

/**
 * Adds one tag. The target must be a current member of the photo's circle:
 * anything else answers `404` so users from other circles are never revealed.
 *
 * The membership row is locked with `FOR SHARE` inside the same transaction as
 * the tag read/insert. Expulsion (`removeCircleMember`) deletes the membership
 * first (`FOR UPDATE` row lock) and the tags afterwards, so both operations
 * share the lock order `Membership → PhotoTag`: a tag can never be committed
 * for a member whose expulsion has already won.
 *
 * Idempotent by `(photoId, taggedUserId)`: an existing tag answers `200` with
 * the same row and a new one `201`. A concurrent insert that wins the unique
 * constraint (`P2002`) aborts the transaction, so the re-read and the `200`
 * happen outside it with the normal client.
 */
export async function addPhotoTag(
  prisma: PrismaClient,
  input: AddPhotoTagInput,
): Promise<AddPhotoTagOutcome> {
  try {
    return await prisma.$transaction(async (tx) => {
      const membership = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Membership"
        WHERE "circleId" = ${input.circleId} AND "userId" = ${input.taggedUserId}
        FOR SHARE
      `;

      if (membership.length === 0) {
        throw new ApiError('NOT_FOUND');
      }

      const existing = await tx.photoTag.findUnique({
        where: {
          photoId_taggedUserId: {
            photoId: input.photoId,
            taggedUserId: input.taggedUserId,
          },
        },
        include: PHOTO_TAG_INCLUDE,
      });

      if (existing !== null) {
        return { status: 200, tag: toPhotoTagDto(existing) } as const;
      }

      const created = await tx.photoTag.create({
        data: {
          photoId: input.photoId,
          taggedUserId: input.taggedUserId,
          createdBy: input.createdBy,
        },
        include: PHOTO_TAG_INCLUDE,
      });

      return { status: 201, tag: toPhotoTagDto(created) } as const;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      // Another request created the same tag and won the unique constraint.
      // The transaction is already aborted, so re-read with the normal client.
      const raced = await findPhotoTag(prisma, input.photoId, input.taggedUserId);

      if (raced !== null) {
        return { status: 200, tag: toPhotoTagDto(raced) };
      }

      // The winner was deleted before we could re-read it: report the conflict
      // instead of leaking the original P2002 as a 500.
      throw new ApiError('CONFLICT');
    }

    // The photo or the target disappeared between the route checks and the
    // insert. Answer the same 404 as a missing photo instead of leaking a 500.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2003' || error.code === 'P2025')
    ) {
      throw new ApiError('NOT_FOUND');
    }

    throw error;
  }
}

/**
 * Removes one tag. Idempotent: a tag that does not exist is not an error, so
 * repeating the request still answers `204` and no row is touched.
 */
export async function removePhotoTag(
  prisma: PrismaClient,
  photoId: string,
  taggedUserId: string,
): Promise<number> {
  const result = await prisma.photoTag.deleteMany({
    where: { photoId, taggedUserId },
  });

  return result.count;
}
