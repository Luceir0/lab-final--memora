import { createFileRoute } from '@tanstack/react-router';

import { AlbumDetailPage } from '../features/albums/album-detail-page';

/**
 * Detalle de un álbum.
 *
 * Se anida en el layout del círculo para compartir los gates de sesión y
 * acceso, pero el layout detecta esta ruta y no pinta héroe, cabecera
 * compacta ni pestañas (D7).
 */
export const Route = createFileRoute('/_app/circles/$circleId/albums/$albumId')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Álbum · Memora' }],
  }),
  component: AlbumDetailRoute,
});

function AlbumDetailRoute() {
  const { circleId, albumId } = Route.useParams();

  return <AlbumDetailPage circleId={circleId} albumId={albumId} />;
}
