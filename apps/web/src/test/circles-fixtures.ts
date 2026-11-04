import type { CircleDetailDto, CircleDto, CircleStats, PhotoSummary } from '@memora/shared';

import { testUser } from './auth-fixtures';

export const circleCover: PhotoSummary = {
  id: 'pho_cover_1',
  thumbUrl: '/api/photos/pho_cover_1/thumb',
  width: 1200,
  height: 800,
};

export const circleCoverTwo: PhotoSummary = {
  id: 'pho_cover_2',
  thumbUrl: '/api/photos/pho_cover_2/thumb',
  width: 900,
  height: 1200,
};

export const defaultCircleStats: CircleStats = {
  membersCount: 8,
  albumsCount: 12,
  photosCount: 1240,
  storageBytes: 512_000_000,
  lastUploadAt: '2026-11-03T09:00:00.000Z',
};

export const circleWithCover: CircleDto = {
  id: 'cir_familia',
  name: 'Familia García',
  description: 'Las fotos de casa, los veranos en Mallorca y todo lo que no queremos olvidar.',
  settings: {
    membersCanCreateAlbums: true,
    membersCanUpload: true,
    membersCanDownload: true,
    membersCanTag: true,
  },
  role: 'owner',
  coverPhoto: circleCover,
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-11-03T10:00:00.000Z',
};

export const circleWithoutCover: CircleDto = {
  id: 'cir_lisboa',
  name: 'Lisboa 2026',
  description: null,
  settings: {
    membersCanCreateAlbums: true,
    membersCanUpload: true,
    membersCanDownload: true,
    membersCanTag: false,
  },
  role: 'member',
  coverPhoto: null,
  createdAt: '2026-02-10T10:00:00.000Z',
  updatedAt: '2026-11-02T10:00:00.000Z',
};

export const circleThird: CircleDto = {
  id: 'cir_amigas',
  name: 'Amigas de la uni',
  description: 'Los viajes y las risas de siempre.',
  settings: {
    membersCanCreateAlbums: false,
    membersCanUpload: true,
    membersCanDownload: true,
    membersCanTag: true,
  },
  role: 'member',
  coverPhoto: circleCoverTwo,
  createdAt: '2026-03-10T10:00:00.000Z',
  updatedAt: '2026-10-20T10:00:00.000Z',
};

export const defaultCircles: readonly CircleDto[] = [
  circleWithCover,
  circleWithoutCover,
  circleThird,
];

export function circleDetail(circle: CircleDto, stats: Partial<CircleStats> = {}): CircleDetailDto {
  return { ...circle, stats: { ...defaultCircleStats, ...stats } };
}

export const testMeResponse = { user: testUser };
