import type { AlbumDto } from '@memora/shared';
import type { QueryClient } from '@tanstack/react-query';

import { albumKeys } from '../albums/queries';

/**
 * Refresca el álbum tras una subida completada.
 *
 * Se hace desde el provider para que funcione aunque la pantalla del álbum
 * esté desmontada. El `circleId` sale de la caché del detalle; si no está, solo
 * se invalida el detalle y no se inventa una lista.
 */
export function invalidateAlbumAfterUpload(queryClient: QueryClient, albumId: string): void {
  const album = queryClient.getQueryData<AlbumDto>(albumKeys.detail(albumId));

  void queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });

  if (album !== undefined) {
    void queryClient.invalidateQueries({ queryKey: albumKeys.list(album.circleId) });
  }
}
