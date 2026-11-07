import { createFileRoute } from '@tanstack/react-router';

import { useCircleDetail } from '../features/circles/circle-detail-context';
import { useMeQuery } from '../features/circles/queries';
import { canTagPhoto } from '../features/photos/tags/permissions';
import { PhotoViewer } from '../features/photos/viewer/photo-viewer';

/**
 * Visor de foto (F30), anidado bajo el álbum.
 *
 * La ruta del álbum sigue montada detrás; esta ruta solo pinta el visor en un
 * portal. El enlace es privado: la API exige sesión y membresía vigente.
 *
 * El rol del círculo y la cuenta actual llegan al visor para decidir si se
 * ofrece editar los metadatos (F31). `/me` ya está en caché por el layout
 * privado, así que esta lectura no añade una petición.
 */
export const Route = createFileRoute('/_app/circles/$circleId/albums/$albumId/photos/$photoId')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Foto · Memora' }],
  }),
  component: PhotoViewerRoute,
});

function PhotoViewerRoute() {
  const { circleId, albumId, photoId } = Route.useParams();
  const { circle } = useCircleDetail();
  const meQuery = useMeQuery();

  return (
    <PhotoViewer
      circleId={circleId}
      albumId={albumId}
      photoId={photoId}
      allowOriginal={circle.settings.membersCanDownload}
      circleRole={circle.role}
      circleName={circle.name}
      canTag={canTagPhoto({
        circleRole: circle.role,
        membersCanTag: circle.settings.membersCanTag,
      })}
      currentUserId={meQuery.data?.user.id ?? null}
    />
  );
}
