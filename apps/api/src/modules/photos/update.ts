import { ApiError } from '../../errors.ts';
import {
  Prisma,
  type Circle,
  type Membership,
  type PrismaClient,
} from '../../generated/prisma/client.ts';
import type { PhotoWithRelations } from '../members/dto.ts';
import { findPhotoForMember, PHOTO_INCLUDE } from './service.ts';

/**
 * Data access for `PATCH /photos/:photoId` (F31).
 *
 * Authorization stays in the route: this module only loads the photo, the
 * circle that owns it and the requester's membership, so `can()` can resolve
 * the owner from `Circle.ownerId` instead of trusting the membership `role`.
 */

/** Photo, its circle and the membership of the requesting user. */
export interface PhotoUpdateTarget {
  readonly photo: PhotoWithRelations;
  readonly circle: Circle;
  readonly membership: Membership;
}

/**
 * Loads a photo plus the facts `can()` needs for `photo.update`.
 *
 * Reuses `findPhotoForMember`, so a missing photo, a photo from another circle
 * and a circle the user left all return `null` and the route answers the same
 * `404`. The membership read also returns `null` when it disappears between the
 * two queries, keeping the fail-closed behaviour.
 */
export async function findPhotoUpdateTarget(
  prisma: PrismaClient,
  photoId: string,
  userId: string,
): Promise<PhotoUpdateTarget | null> {
  const photo = await findPhotoForMember(prisma, photoId, userId);

  if (photo === null) {
    return null;
  }

  const membership = await prisma.membership.findUnique({
    where: { circleId_userId: { circleId: photo.circleId, userId } },
    include: { circle: true },
  });

  if (membership === null) {
    return null;
  }

  return { photo, circle: membership.circle, membership };
}

/** Only the three editable fields; storage keys and coordinates never pass. */
export interface PhotoUpdateInput {
  readonly description?: string | null | undefined;
  readonly takenAt?: Date | null | undefined;
  readonly placeName?: string | null | undefined;
}

/**
 * Persists the partial update and returns the photo with the relations
 * `PhotoDto` needs.
 *
 * `undefined` means "leave as is" and `null` clears the column. A photo deleted
 * between the authorization read and the write answers `404`, never a `500`.
 */
export async function updatePhoto(
  prisma: PrismaClient,
  photoId: string,
  input: PhotoUpdateInput,
): Promise<PhotoWithRelations> {
  // Built key by key: with `exactOptionalPropertyTypes`, an explicit
  // `undefined` is not assignable to Prisma's optional update fields.
  const data: Prisma.PhotoUpdateInput = {};

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.takenAt !== undefined) {
    data.takenAt = input.takenAt;
  }

  if (input.placeName !== undefined) {
    data.placeName = input.placeName;
  }

  try {
    return await prisma.photo.update({
      where: { id: photoId },
      data,
      include: PHOTO_INCLUDE,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new ApiError('NOT_FOUND');
    }

    throw error;
  }
}
