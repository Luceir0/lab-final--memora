import type { PhotoDto } from '@memora/shared';

import { flattenPhotoPages, useAlbumPhotosQuery } from '../photos/queries';

/**
 * Fotos de un álbum para el selector de portada.
 *
 * Reutiliza la misma clave de caché que la galería (`['album', id, 'photos',
 * 'all']`): abrir el selector no vuelve a pedir fotos que ya están cargadas.
 * `enabled` se controla desde el consumidor para no pedir nada hasta que la
 * persona pide elegir una portada.
 */
export function useCoverAlbumPhotos(albumId: string | null, enabled: boolean) {
  const query = useAlbumPhotosQuery(albumId, null, enabled);
  const photos: readonly PhotoDto[] =
    query.data === undefined ? [] : flattenPhotoPages(query.data.pages);

  return { query, photos };
}
