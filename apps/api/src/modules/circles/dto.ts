import {
  circleSettingsSchema,
  type CircleDetailDto,
  type CircleDto,
  type CircleSettings,
  type CircleStats,
  type PhotoSummary,
  type Role,
} from '@memora/shared';

import type { Circle, Photo } from '../../generated/prisma/client.ts';

/**
 * Mapping from persisted rows to the frozen shared DTOs.
 *
 * Prisma returns `Date` objects and a loose `JsonValue` for `settings`; the
 * response schemas expect ISO strings and the exact settings shape, so every
 * conversion happens here and nowhere else.
 */

/** Photo preview used by covers. Matches `GET /photos/:photoId/image?size=thumb`. */
export function toPhotoSummary(photo: Pick<Photo, 'id' | 'width' | 'height'>): PhotoSummary {
  return {
    id: photo.id,
    thumbUrl: `/api/photos/${encodeURIComponent(photo.id)}/image?size=thumb`,
    width: photo.width,
    height: photo.height,
  };
}

/** Parses `Circle.settings`. Invalid persisted JSON is a server bug, not a 4xx. */
export function toCircleSettings(value: Circle['settings']): CircleSettings {
  return circleSettingsSchema.parse(value);
}

/**
 * Role exposed to the client.
 *
 * Ownership is authoritative: a membership row with a forged `owner` role must
 * not claim ownership that `Circle.ownerId` does not grant.
 */
export function resolveCircleRole(
  circle: Pick<Circle, 'ownerId'>,
  userId: string,
  membershipRole: Role,
): Role {
  if (circle.ownerId === userId) {
    return 'owner';
  }

  // There is exactly one owner per circle and ownership is decided by
  // `Circle.ownerId`: a non-owner must never be exposed as owner even if the
  // membership row was tampered with.
  return membershipRole === 'owner' ? 'member' : membershipRole;
}

export function toCircleDto(circle: Circle, role: Role, coverPhoto: Photo | null): CircleDto {
  return {
    id: circle.id,
    name: circle.name,
    description: circle.description,
    settings: toCircleSettings(circle.settings),
    role,
    coverPhoto: coverPhoto === null ? null : toPhotoSummary(coverPhoto),
    createdAt: circle.createdAt.toISOString(),
    updatedAt: circle.updatedAt.toISOString(),
  };
}

export function toCircleDetailDto(circleDto: CircleDto, stats: CircleStats): CircleDetailDto {
  return { ...circleDto, stats };
}
