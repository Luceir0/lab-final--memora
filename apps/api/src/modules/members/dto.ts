import {
  photoDtoSchema,
  type MemberDto,
  type PhotoDto,
  type Role,
  type UserDto,
} from '@memora/shared';

import type { Circle, Membership, Photo, User } from '../../generated/prisma/client.ts';
import { resolveCircleRole } from '../circles/dto.ts';

/**
 * Mapping from persisted rows to the shared DTOs of the members module.
 *
 * Prisma returns `Date` objects and loose `string`s; the response schemas
 * expect ISO strings and the exact enums, so every conversion happens here.
 * No member payload includes `email`: only `UserDto` fields are exposed.
 */

/** The only `User` columns this module is allowed to read. */
export type PublicUser = Pick<User, 'id' | 'name' | 'avatarUrl'>;

/** Public identity. `email` is never selected nor copied here. */
export function toUserDto(user: PublicUser): UserDto {
  return { id: user.id, name: user.name, avatarUrl: user.avatarUrl };
}

/**
 * Member row plus the per-circle `photosCount`.
 *
 * The role is resolved against `Circle.ownerId`: a membership row with a
 * forged `owner` role cannot claim ownership that the circle does not grant.
 */
export function toMemberDto(
  membership: Membership,
  user: PublicUser,
  circle: Pick<Circle, 'ownerId'>,
  photosCount: number,
): MemberDto {
  const role: Role = resolveCircleRole(circle, membership.userId, membership.role);

  return {
    user: toUserDto(user),
    role,
    joinedAt: membership.joinedAt.toISOString(),
    photosCount,
  };
}

/** Photo row with the two public relations every `PhotoDto` embeds. */
export interface PhotoWithRelations extends Photo {
  readonly uploader: PublicUser;
  readonly tags: ReadonlyArray<{ readonly taggedUser: PublicUser }>;
}

/**
 * Full public `PhotoDto`: uploader, tags and authenticated image URLs.
 *
 * Storage keys (`originalKey`, `displayKey`, `thumbKey`) and any GPS
 * coordinates never leave this function. The image endpoint itself arrives in
 * F29; here only the URLs are built.
 */
export function toPhotoDto(photo: PhotoWithRelations): PhotoDto {
  // Parsing keeps the DTO aligned with the frozen contract and rejects a
  // persisted `mimeType` outside the allowed enum as a server bug.
  return photoDtoSchema.parse({
    id: photo.id,
    circleId: photo.circleId,
    albumId: photo.albumId,
    uploader: toUserDto(photo.uploader),
    clientUploadId: photo.clientUploadId,
    description: photo.description,
    takenAt: photo.takenAt === null ? null : photo.takenAt.toISOString(),
    placeName: photo.placeName,
    mimeType: photo.mimeType,
    size: photo.size,
    width: photo.width,
    height: photo.height,
    thumbUrl: photoImageUrl(photo.id, 'thumb'),
    displayUrl: photoImageUrl(photo.id, 'display'),
    tags: photo.tags.map((tag) => toUserDto(tag.taggedUser)),
    createdAt: photo.createdAt.toISOString(),
    updatedAt: photo.updatedAt.toISOString(),
  });
}

/** Same URL shape as `circles/dto.ts`, never an unencoded id. */
function photoImageUrl(photoId: string, size: 'thumb' | 'display'): string {
  return `/api/photos/${encodeURIComponent(photoId)}/image?size=${size}`;
}
