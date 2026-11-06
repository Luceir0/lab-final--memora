import {
  photoResponseSchema,
  type AlbumPhotosResponse,
  type PhotoDto,
  type UpdatePhotoRequest,
} from '@memora/shared';
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api-client';
import { fetchCsrfToken } from '../../../lib/csrf';
import { photoViewerKeys } from '../viewer/queries';

/**
 * Sustituye una foto dentro de las páginas ya cargadas sin cambiar el orden.
 *
 * Se usa tanto para la galería del álbum (con o sin filtro de persona) como
 * para la vista de una persona: en ambos casos el `PhotoDto` vive dentro de un
 * `InfiniteData` con `items`.
 */
function replacePhotoInPages(
  current: InfiniteData<AlbumPhotosResponse> | undefined,
  updated: PhotoDto,
): InfiniteData<AlbumPhotosResponse> | undefined {
  if (current === undefined) {
    return current;
  }

  return {
    ...current,
    pages: current.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => (item.id === updated.id ? updated : item)),
    })),
  };
}

/**
 * `PATCH /photos/:photoId` — descripción, fecha y lugar.
 *
 * - Pide un token CSRF fresco justo antes del `PATCH`, como el resto de
 *   mutaciones.
 * - Al guardar, actualiza el detalle del visor y todas las listas de fotos
 *   cacheadas del álbum y de sus personas para que la miniatura y el panel
 *   reflejen el cambio sin recargar.
 * - Nunca envía coordenadas: el contrato solo admite `placeName`.
 */
export function useUpdatePhotoMetadataMutation(photoId: string, albumId: string, circleId: string) {
  const queryClient = useQueryClient();

  return useMutation<PhotoDto, unknown, UpdatePhotoRequest>({
    mutationFn: async (input) => {
      const csrfToken = await fetchCsrfToken(queryClient);

      return apiClient.patch(`/photos/${encodeURIComponent(photoId)}`, input, {
        schema: photoResponseSchema,
        headers: { 'X-CSRF-Token': csrfToken },
      });
    },
    onSuccess: (photo) => {
      queryClient.setQueryData(photoViewerKeys.detail(photoId), photo);

      queryClient.setQueriesData<InfiniteData<AlbumPhotosResponse>>(
        { queryKey: ['album', albumId, 'photos'] },
        (current) => replacePhotoInPages(current, photo),
      );

      queryClient.setQueriesData<InfiniteData<AlbumPhotosResponse>>(
        { queryKey: ['circle', circleId, 'person'] },
        (current) => replacePhotoInPages(current, photo),
      );
    },
  });
}
