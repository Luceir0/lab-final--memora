import {
  albumPhotosResponseSchema,
  personPhotosResponseSchema,
  type PhotoDto,
} from '@memora/shared';
import { useInfiniteQuery } from '@tanstack/react-query';

import { apiClient } from '../../lib/api-client';

/**
 * Tamaño de página de la galería.
 *
 * 48 es múltiplo de 3 y de 4, así que las filas de móvil y escritorio quedan
 * completas mientras se carga la siguiente página.
 */
export const PHOTO_PAGE_LIMIT = 48;

/**
 * Claves de React Query.
 *
 * La galería del álbum cuelga de `['album', albumId, 'photos', personId]` para
 * compartir caché entre el filtro del álbum y el filtro por álbum de la página
 * de persona. La vista completa de una persona usa su propia clave.
 */
export const photoKeys = {
  album: (albumId: string, personId: string | null) =>
    ['album', albumId, 'photos', personId ?? 'all'] as const,
  person: (circleId: string, userId: string) =>
    ['circle', circleId, 'person', userId, 'photos'] as const,
};

function albumPhotosPath(albumId: string): string {
  return `/albums/${encodeURIComponent(albumId)}/photos`;
}

function personPhotosPath(circleId: string, userId: string): string {
  return `/circles/${encodeURIComponent(circleId)}/members/${encodeURIComponent(userId)}/photos`;
}

/**
 * Fotos de un álbum con scroll infinito por cursor.
 *
 * `personId` filtra en el servidor por una persona del mismo círculo; el
 * cliente nunca mezcla fotos de otros círculos porque el endpoint ya valida la
 * pertenencia al álbum.
 */
export function useAlbumPhotosQuery(
  albumId: string | null,
  personId: string | null,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: photoKeys.album(albumId ?? 'none', personId),
    queryFn: ({ pageParam, signal }) =>
      apiClient.get(albumPhotosPath(albumId ?? ''), {
        schema: albumPhotosResponseSchema,
        query: {
          limit: PHOTO_PAGE_LIMIT,
          cursor: pageParam,
          ...(personId === null ? {} : { personId }),
        },
        signal,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && albumId !== null,
  });
}

/** Fotos de una persona dentro de un círculo, con scroll infinito por cursor. */
export function usePersonPhotosQuery(circleId: string, userId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: photoKeys.person(circleId, userId),
    queryFn: ({ pageParam, signal }) =>
      apiClient.get(personPhotosPath(circleId, userId), {
        schema: personPhotosResponseSchema,
        query: { limit: PHOTO_PAGE_LIMIT, cursor: pageParam },
        signal,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

/** Aplana las páginas cargadas conservando el orden del servidor. */
export function flattenPhotoPages(
  pages: readonly { readonly items: readonly PhotoDto[] }[],
): readonly PhotoDto[] {
  return pages.flatMap((page) => page.items);
}
