import {
  albumResponseSchema,
  deleteAlbumResponseSchema,
  emptyAlbumResponseSchema,
  listAlbumsResponseSchema,
  type AlbumDto,
  type CreateAlbumRequest,
  type ListAlbumsResponse,
  type UpdateAlbumRequest,
} from '@memora/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import { apiClient } from '../../lib/api-client';
import { fetchCsrfToken } from '../../lib/csrf';
import { circleKeys } from '../circles/queries';

/** Tamaño de página de `GET /circles/:circleId/albums`. */
export const ALBUM_LIST_PAGE_LIMIT = 24;

/**
 * Claves de React Query.
 *
 * La lista cuelga de `['circle', circleId, 'albums']` para invalidar por
 * círculo; el detalle usa `['album', albumId]` porque se pide por id.
 */
export const albumKeys = {
  list: (circleId: string) => ['circle', circleId, 'albums'] as const,
  detail: (albumId: string) => ['album', albumId] as const,
};

function albumsPath(circleId: string): string {
  return `/circles/${encodeURIComponent(circleId)}/albums`;
}

function albumPath(albumId: string): string {
  return `/albums/${encodeURIComponent(albumId)}`;
}

/** Lista paginada con keyset. «Cargar más» usa `fetchNextPage`. */
export function useAlbumListQuery(circleId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: albumKeys.list(circleId),
    queryFn: ({ pageParam, signal }) =>
      apiClient.get(albumsPath(circleId), {
        schema: listAlbumsResponseSchema,
        query: { limit: ALBUM_LIST_PAGE_LIMIT, cursor: pageParam },
        signal,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

/** Aplana las páginas cargadas conservando el orden del servidor. */
export function flattenAlbumPages(
  pages: readonly { readonly items: readonly AlbumDto[] }[],
): readonly AlbumDto[] {
  return pages.flatMap((page) => page.items);
}

/** Detalle de un álbum por id. */
export function useAlbumDetailQuery(albumId: string, enabled = true) {
  return useQuery<AlbumDto>({
    queryKey: albumKeys.detail(albumId),
    queryFn: () =>
      apiClient.get(albumPath(albumId), {
        schema: albumResponseSchema,
      }),
    enabled,
  });
}

/**
 * Alta de álbum.
 *
 * Pide un token CSRF fresco justo antes del `POST` y lo envía en
 * `X-CSRF-Token`, igual que el alta de círculo.
 */
export function useCreateAlbumMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation<AlbumDto, unknown, CreateAlbumRequest>({
    mutationFn: async (input) => {
      const csrfToken = await fetchCsrfToken(queryClient);

      return apiClient.post(albumsPath(circleId), input, {
        schema: albumResponseSchema,
        headers: { 'X-CSRF-Token': csrfToken },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: albumKeys.list(circleId) });
      void queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });
    },
  });
}

/** Edición de título, descripción, fecha o portada. */
export function useUpdateAlbumMutation(albumId: string, circleId: string) {
  const queryClient = useQueryClient();

  return useMutation<AlbumDto, unknown, UpdateAlbumRequest>({
    mutationFn: async (input) => {
      const csrfToken = await fetchCsrfToken(queryClient);

      return apiClient.patch(albumPath(albumId), input, {
        schema: albumResponseSchema,
        headers: { 'X-CSRF-Token': csrfToken },
      });
    },
    onSuccess: (album, input) => {
      queryClient.setQueryData(albumKeys.detail(albumId), album);
      void queryClient.invalidateQueries({ queryKey: albumKeys.list(circleId) });
      void queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });

      /*
       * AC-09 exige refrescar la lista de círculos al cambiar la portada,
       * aunque hoy `CircleDto` no muestre la portada del álbum y no exista una
       * dependencia visual directa. Se limita a los PATCH que incluyen
       * `coverPhotoId` para no añadir refetches en ediciones de texto.
       */
      if (input.coverPhotoId !== undefined) {
        void queryClient.invalidateQueries({ queryKey: circleKeys.list });
      }
    },
  });
}

/**
 * Eliminación de un álbum vacío.
 *
 * La API responde `409 ALBUM_NOT_EMPTY` si todavía tiene fotos; el consumidor
 * lo detecta con `isAlbumNotEmptyError`.
 */
export function useDeleteAlbumMutation(albumId: string, circleId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, void>({
    mutationFn: async () => {
      const csrfToken = await fetchCsrfToken(queryClient);

      await apiClient.delete(albumPath(albumId), {
        schema: deleteAlbumResponseSchema,
        headers: { 'X-CSRF-Token': csrfToken },
      });
    },
    onSuccess: () => {
      // Quita el álbum de la lista cacheada antes de invalidar: al volver a la
      // pestaña no se pinta durante el refetch.
      queryClient.setQueryData<InfiniteData<ListAlbumsResponse>>(
        albumKeys.list(circleId),
        (current) =>
          current === undefined
            ? current
            : {
                ...current,
                pages: current.pages.map((page) => ({
                  ...page,
                  items: page.items.filter((album) => album.id !== albumId),
                })),
              },
      );
      queryClient.removeQueries({ queryKey: albumKeys.detail(albumId) });
      void queryClient.invalidateQueries({ queryKey: albumKeys.list(circleId) });
      void queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });
    },
  });
}

/**
 * Vaciado de un álbum: borra sus fotos y etiquetas.
 *
 * La API es idempotente y devuelve `deletedCount`; se invalida el detalle, la
 * lista y las stats del círculo, que incluyen el total de fotos.
 */
export function useEmptyAlbumMutation(albumId: string, circleId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ readonly deletedCount: number }, unknown, void>({
    mutationFn: async () => {
      const csrfToken = await fetchCsrfToken(queryClient);

      return apiClient.delete(`${albumPath(albumId)}/photos`, {
        schema: emptyAlbumResponseSchema,
        headers: { 'X-CSRF-Token': csrfToken },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });
      void queryClient.invalidateQueries({ queryKey: albumKeys.list(circleId) });
      void queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });
    },
  });
}
