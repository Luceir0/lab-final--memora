import type { PhotoDto } from '@memora/shared';

import { testUser } from '../auth-fixtures';

const sofia = { id: testUser.id, name: testUser.name, avatarUrl: null };
const lucas = { id: 'usr_lucas', name: 'Lucas Vidal', avatarUrl: null };
const laura = { id: 'usr_laura', name: 'Laura Moreno', avatarUrl: null };

/**
 * Foto de galería con valores válidos del contrato.
 *
 * Las URLs imitan las de F27 (`/image?size=thumb|display`) para que los tests
 * puedan comprobar `srcset` sin red real.
 */
export function makePhoto(overrides: Partial<PhotoDto> = {}): PhotoDto {
  const id = overrides.id ?? 'pho_1';

  return {
    id,
    circleId: 'cir_familia',
    albumId: 'alb_verano',
    uploader: sofia,
    clientUploadId: null,
    description: null,
    takenAt: '2026-08-01T10:00:00.000Z',
    placeName: null,
    mimeType: 'image/webp',
    size: 12_345,
    width: 1600,
    height: 1200,
    thumbUrl: `/api/photos/${id}/image?size=thumb`,
    displayUrl: `/api/photos/${id}/image?size=display`,
    tags: [],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  };
}

export const galleryPhotos: readonly PhotoDto[] = [
  makePhoto({
    id: 'pho_playa',
    description: 'Atardecer en la playa',
    tags: [lucas, laura],
  }),
  makePhoto({
    id: 'pho_cena',
    description: null,
    placeName: 'Deià',
    takenAt: '2026-08-02T20:30:00.000Z',
    tags: [lucas],
  }),
  makePhoto({
    id: 'pho_montana',
    description: null,
    takenAt: null,
    tags: [sofia],
  }),
];

export const personPhotos: readonly PhotoDto[] = galleryPhotos.filter((photo) =>
  photo.tags.some((tag) => tag.id === lucas.id),
);
