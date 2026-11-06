import { photoResponseSchema, type PhotoDto } from '@memora/shared';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api-client';

/**
 * Claves del visor.
 *
 * El detalle de una foto no se comparte con la galería: la galería ya trae el
 * `PhotoDto` completo en sus páginas, pero el visor debe funcionar también con
 * un enlace directo, sin caché previa.
 */
export const photoViewerKeys = {
  detail: (photoId: string) => ['photo', photoId] as const,
};

/** `GET /photos/:photoId` — detalle de una foto con autor, fecha y lugar. */
export function usePhotoQuery(photoId: string) {
  return useQuery<PhotoDto>({
    queryKey: photoViewerKeys.detail(photoId),
    queryFn: ({ signal }) =>
      apiClient.get(`/photos/${encodeURIComponent(photoId)}`, {
        schema: photoResponseSchema,
        signal,
      }),
  });
}

/**
 * URL de la variante original a partir de la `displayUrl` del contrato.
 *
 * El `PhotoDto` solo expone `thumbUrl` y `displayUrl`; la variante original se
 * pide con el mismo endpoint cambiando `size`. El contrato congela el formato
 * `/api/photos/:id/image?size=display`, así que la sustitución es segura y, si
 * no coincide, se mantiene `displayUrl` en lugar de inventar una ruta.
 */
export function originalImageUrl(displayUrl: string): string {
  return displayUrl.replace(/([?&])size=display\b/, '$1size=original');
}
