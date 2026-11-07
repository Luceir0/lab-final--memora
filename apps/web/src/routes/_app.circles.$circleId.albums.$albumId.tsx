import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router';

import { AlbumDetailPage } from '../features/albums/album-detail-page';

/** `/circles/:circleId/albums/:albumId/photos/:photoId`, con barra final opcional. */
const PHOTO_VIEWER_PATTERN = /^\/circles\/[^/]+\/albums\/[^/]+\/photos\/[^/]+\/?$/;

/**
 * Detalle de un álbum.
 *
 * Se anida en el layout del círculo para compartir los gates de sesión y
 * acceso, pero el layout detecta esta ruta y no pinta héroe, cabecera
 * compacta ni pestañas (D7).
 *
 * La galería se queda montada detrás del visor (ruta hija) para conservar el
 * scroll al volver. Mientras el visor está abierto, el contenido de fondo queda
 * `inert` y oculto a lectores de pantalla; el visor gestiona el foco.
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
  const viewerOpen = useRouterState({
    select: (state) => PHOTO_VIEWER_PATTERN.test(state.location.pathname),
  });

  return (
    <>
      <div inert={viewerOpen || undefined} aria-hidden={viewerOpen || undefined}>
        <AlbumDetailPage circleId={circleId} albumId={albumId} />
      </div>
      <Outlet />
    </>
  );
}
