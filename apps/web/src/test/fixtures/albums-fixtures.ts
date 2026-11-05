import type { AlbumDto, PhotoSummary } from '@memora/shared';

import { testUser } from '../auth-fixtures';

/**
 * Fixtures de álbumes para los tests de F24.
 *
 * Los `createdBy` usan `testUser` cuando el álbum debe ser editable por la
 * cuenta autenticada (el handler de `/me` devuelve `testUser`) y otro usuario
 * cuando no. Así el mismo fixture sirve para owner, creador y miembro ajeno sin
 * cambiar el handler de `/me`.
 */

export const albumCover: PhotoSummary = {
  id: 'pho_album_cover',
  thumbUrl: '/api/photos/pho_album_cover/thumb',
  width: 1200,
  height: 800,
};

/** Coincide con `testUser`: la cuenta autenticada es la creadora. */
export const albumCreator = {
  id: testUser.id,
  name: testUser.name,
  avatarUrl: null,
};

/** Otra persona del círculo: la cuenta autenticada no es la creadora. */
export const otherAlbumCreator = {
  id: 'usr_lucas',
  name: 'Lucas Vidal',
  avatarUrl: null,
};

/** Con portada, 342 fotos y fecha de agosto de 2026. */
export const albumWithPhotos: AlbumDto = {
  id: 'alb_verano',
  circleId: 'cir_familia',
  title: 'Verano en Mallorca',
  description: 'Dos semanas en Dejà con los primos.',
  date: '2026-08-01T00:00:00.000Z',
  coverPhoto: albumCover,
  photosCount: 342,
  createdBy: albumCreator,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

/** Vacío, sin portada ni fecha, creado por otra persona. */
export const albumEmpty: AlbumDto = {
  id: 'alb_vacio',
  circleId: 'cir_familia',
  title: 'Sin fotos todavía',
  description: null,
  date: null,
  coverPhoto: null,
  photosCount: 0,
  createdBy: otherAlbumCreator,
  createdAt: '2026-09-12T10:00:00.000Z',
  updatedAt: '2026-09-12T10:00:00.000Z',
};

/** Una sola foto: comprueba el singular de `formatAlbumPhotos`. */
export const albumSinglePhoto: AlbumDto = {
  id: 'alb_una',
  circleId: 'cir_familia',
  title: 'La primera',
  description: 'Una tarde cualquiera.',
  date: '2026-10-01T00:00:00.000Z',
  coverPhoto: null,
  photosCount: 1,
  createdBy: albumCreator,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-02T10:00:00.000Z',
};

/** Sin portada y sin fecha: «Sin fecha · álbum continuo». */
export const albumNoCoverNoDate: AlbumDto = {
  id: 'alb_continuo',
  circleId: 'cir_familia',
  title: 'Recuerdos sueltos',
  description: null,
  date: null,
  coverPhoto: null,
  photosCount: 12,
  createdBy: otherAlbumCreator,
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-10-20T10:00:00.000Z',
};

/** Título en el límite del contrato: 120 caracteres. */
export const albumLongTitle: AlbumDto = {
  id: 'alb_largo',
  circleId: 'cir_familia',
  title: 'Un verano interminable. '.repeat(5).slice(0, 120),
  description: 'Un título que ocupa todo el ancho disponible de la tarjeta.',
  date: '2026-05-01T00:00:00.000Z',
  coverPhoto: albumCover,
  photosCount: 7,
  createdBy: otherAlbumCreator,
  createdAt: '2026-05-01T10:00:00.000Z',
  updatedAt: '2026-05-02T10:00:00.000Z',
};
