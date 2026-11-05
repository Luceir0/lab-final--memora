import type { AlbumDto, UserDto } from '@memora/shared';

import type { Album, Photo, User } from '../../generated/prisma/client.ts';
import { toPhotoSummary } from '../circles/dto.ts';

/**
 * Mapping from persisted album rows to the frozen shared `AlbumDto`.
 *
 * Every conversion from `Date` to ISO string happens here. The DTO never
 * exposes storage keys (`originalKey`, `displayKey`, `thumbKey`) nor GPS
 * coordinates: the cover is reduced to `PhotoSummary` and the creator to the
 * public `UserDto`.
 */

/** Fields of `User` that may leave the API. */
export type PublicUser = Pick<User, 'id' | 'name' | 'avatarUrl'>;

/** Album row with the relations every `AlbumDto` needs. */
export interface AlbumWithRelations extends Album {
  readonly coverPhoto: Photo | null;
  readonly creator: PublicUser;
  readonly _count: { readonly photos: number };
}

/** Public identity. `email` and `passwordHash` are never selected nor copied. */
export function toUserDto(user: PublicUser): UserDto {
  return { id: user.id, name: user.name, avatarUrl: user.avatarUrl };
}

export function toAlbumDto(album: AlbumWithRelations): AlbumDto {
  return {
    id: album.id,
    circleId: album.circleId,
    title: album.title,
    description: album.description,
    date: album.date === null ? null : album.date.toISOString(),
    coverPhoto: album.coverPhoto === null ? null : toPhotoSummary(album.coverPhoto),
    photosCount: album._count.photos,
    createdBy: toUserDto(album.creator),
    createdAt: album.createdAt.toISOString(),
    updatedAt: album.updatedAt.toISOString(),
  };
}
