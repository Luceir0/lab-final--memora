import {
  DEFAULT_PAGE_LIMIT,
  myUploadsPhotosResponseSchema,
  myUploadsSummarySchema,
  type MyUploadsPhotosResponse,
  type PhotoDto,
} from '@memora/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api-client';

/** Tamaño de página de `GET /me/uploads/photos`. */
export const MY_UPLOADS_PHOTOS_LIMIT = DEFAULT_PAGE_LIMIT;

/**
 * Claves de React Query de «Mis subidas».
 *
 * Todo cuelga de `['me', 'uploads']` para que la invalidación tras una subida
 * (sesión siguiente) pueda refrescar el historial completo con ese prefijo.
 */
export const uploadHistoryKeys = {
  all: ['me', 'uploads'] as const,
  summary: () => [...uploadHistoryKeys.all, 'summary'] as const,
  photos: (albumId: string) => [...uploadHistoryKeys.all, 'photos', albumId] as const,
};

/** Resumen agrupado por círculo y carpeta. Sin paginación. */
export function useUploadHistoryQuery(enabled = true) {
  return useQuery({
    queryKey: uploadHistoryKeys.summary(),
    queryFn: ({ signal }) =>
      apiClient.get('/me/uploads', {
        schema: myUploadsSummarySchema,
        signal,
      }),
    enabled,
  });
}

/**
 * Mis fotos de una carpeta, paginadas por keyset.
 *
 * La query solo se activa cuando la carpeta se abre: el resumen no pide fotos
 * por adelantado. Al cerrarla se conserva la caché para no repetir la petición
 * dentro de la misma visita.
 */
export function useUploadAlbumPhotosQuery(albumId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: uploadHistoryKeys.photos(albumId),
    queryFn: ({ pageParam, signal }) =>
      apiClient.get('/me/uploads/photos', {
        schema: myUploadsPhotosResponseSchema,
        query: {
          albumId,
          cursor: pageParam,
          limit: MY_UPLOADS_PHOTOS_LIMIT,
        },
        signal,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

/**
 * Aplana las páginas cargadas y elimina ids repetidos por si el keyset
 * devolviera una foto ya visible: «Ver más» nunca duplica elementos.
 */
export function flattenUploadPhotoPages(
  pages: readonly Pick<MyUploadsPhotosResponse, 'items'>[],
): readonly PhotoDto[] {
  const seen = new Set<string>();
  const photos: PhotoDto[] = [];

  for (const page of pages) {
    for (const photo of page.items) {
      if (seen.has(photo.id)) {
        continue;
      }

      seen.add(photo.id);
      photos.push(photo);
    }
  }

  return photos;
}
