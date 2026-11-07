import { deletePhotoResponseSchema } from '@memora/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api-client';
import { fetchCsrfToken } from '../../../lib/csrf';
import { albumKeys } from '../../albums/queries';
import { circleKeys } from '../../circles/queries';
import { uploadHistoryKeys } from '../../uploads/history/queries';
import { photoViewerKeys } from '../viewer/queries';

export interface PhotoDeleteScope {
  readonly circleId: string;
  readonly albumId: string;
}

export interface PhotoDeleteInvalidation extends PhotoDeleteScope {
  readonly photoIds: readonly string[];
}

/**
 * `DELETE /photos/:photoId` — una sola foto.
 *
 * El token CSRF se pasa desde fuera para que el borrado múltiple pueda pedir
 * uno solo y repartirlo entre las peticiones limitadas.
 */
export async function deletePhotoRequest(photoId: string, csrfToken: string): Promise<void> {
  await apiClient.delete(`/photos/${encodeURIComponent(photoId)}`, {
    schema: deletePhotoResponseSchema,
    headers: { 'X-CSRF-Token': csrfToken },
  });
}

/**
 * Refresca todo lo que cambia al borrar fotos: detalle y listas del álbum,
 * fotos por persona, «Mis subidas» y las stats del círculo.
 *
 * El detalle del visor se elimina de la caché porque la foto ya no existe; si
 * se dejara, un enlace directo volvería a pintar datos obsoletos.
 */
export function invalidateAfterPhotoDelete(
  queryClient: QueryClient,
  { circleId, albumId, photoIds }: PhotoDeleteInvalidation,
): void {
  for (const photoId of photoIds) {
    queryClient.removeQueries({ queryKey: photoViewerKeys.detail(photoId) });
  }

  void queryClient.invalidateQueries({ queryKey: ['album', albumId, 'photos'] });
  void queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });
  void queryClient.invalidateQueries({ queryKey: albumKeys.list(circleId) });
  void queryClient.invalidateQueries({ queryKey: ['circle', circleId, 'person'] });
  void queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });
  void queryClient.invalidateQueries({ queryKey: uploadHistoryKeys.all });
}

/**
 * Borrado de una foto desde el visor.
 *
 * Igual que el `PATCH` de metadatos: pide un CSRF fresco justo antes de la
 * mutación y, al terminar, invalida las cachés afectadas.
 */
export function useDeletePhotoMutation({ circleId, albumId }: PhotoDeleteScope) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: async (photoId) => {
      const csrfToken = await fetchCsrfToken(queryClient);

      await deletePhotoRequest(photoId, csrfToken);
    },
    onSuccess: (_result, photoId) => {
      invalidateAfterPhotoDelete(queryClient, { circleId, albumId, photoIds: [photoId] });
    },
  });
}
