import type { AlbumDto, CircleDetailDto } from '@memora/shared';
import { describe, expect, it } from 'vitest';

import { albumCreator, otherAlbumCreator } from '../../test/fixtures/albums-fixtures';
import { circleDetail, circleWithCover } from '../../test/circles-fixtures';

import {
  canCreateAlbum,
  canEditAlbum,
  canManageAlbum,
  canUploadPhotos,
  type AlbumCircle,
} from './permissions';

const ME_ID = albumCreator.id;

function circleWith(
  role: CircleDetailDto['role'],
  membersCanCreateAlbums: boolean,
  membersCanUpload = true,
): CircleDetailDto {
  return circleDetail({
    ...circleWithCover,
    role,
    settings: { ...circleWithCover.settings, membersCanCreateAlbums, membersCanUpload },
  });
}

function albumBy(createdBy: AlbumDto['createdBy']): Pick<AlbumDto, 'createdBy'> {
  return { createdBy };
}

describe('canCreateAlbum', () => {
  it('permite al owner aunque la flag esté apagada', () => {
    expect(canCreateAlbum(circleWith('owner', false))).toBe(true);
  });

  it('permite al miembro mientras la flag siga activa', () => {
    expect(canCreateAlbum(circleWith('member', true))).toBe(true);
  });

  it('deniega al miembro sin la flag', () => {
    expect(canCreateAlbum(circleWith('member', false))).toBe(false);
  });
});

describe('canUploadPhotos', () => {
  it('permite al owner aunque la flag esté apagada', () => {
    expect(canUploadPhotos(circleWith('owner', true, false))).toBe(true);
  });

  it('permite al miembro mientras `membersCanUpload` siga activo', () => {
    expect(canUploadPhotos(circleWith('member', true, true))).toBe(true);
  });

  it('deniega al miembro sin la flag de subidas', () => {
    expect(canUploadPhotos(circleWith('member', true, false))).toBe(false);
  });
});

describe('canManageAlbum (vaciar y eliminar)', () => {
  it('permite al owner siempre', () => {
    expect(canManageAlbum(circleWith('owner', false), albumBy(otherAlbumCreator), ME_ID)).toBe(
      true,
    );
    expect(canManageAlbum(circleWith('owner', false), albumBy(otherAlbumCreator), null)).toBe(true);
  });

  it('permite al creador con la flag activa', () => {
    expect(canManageAlbum(circleWith('member', true), albumBy(albumCreator), ME_ID)).toBe(true);
  });

  it('permite al creador con la flag apagada', () => {
    expect(canManageAlbum(circleWith('member', false), albumBy(albumCreator), ME_ID)).toBe(true);
  });

  it('deniega a un miembro que no creó el álbum', () => {
    expect(canManageAlbum(circleWith('member', true), albumBy(otherAlbumCreator), ME_ID)).toBe(
      false,
    );
  });

  it('deniega mientras `meId` aún no se conoce', () => {
    expect(canManageAlbum(circleWith('member', true), albumBy(albumCreator), null)).toBe(false);
  });
});

describe('canEditAlbum', () => {
  it('permite al owner siempre', () => {
    const circle: AlbumCircle = circleWith('owner', false);

    expect(canEditAlbum(circle, albumBy(otherAlbumCreator), ME_ID)).toBe(true);
    expect(canEditAlbum(circle, albumBy(otherAlbumCreator), null)).toBe(true);
  });

  it('permite al creador con la flag activa', () => {
    expect(canEditAlbum(circleWith('member', true), albumBy(albumCreator), ME_ID)).toBe(true);
  });

  it('deniega al creador si la flag está apagada', () => {
    expect(canEditAlbum(circleWith('member', false), albumBy(albumCreator), ME_ID)).toBe(false);
  });

  it('deniega a un miembro que no creó el álbum', () => {
    expect(canEditAlbum(circleWith('member', true), albumBy(otherAlbumCreator), ME_ID)).toBe(false);
  });

  it('deniega mientras `meId` aún no se conoce', () => {
    expect(canEditAlbum(circleWith('member', true), albumBy(albumCreator), null)).toBe(false);
  });
});
