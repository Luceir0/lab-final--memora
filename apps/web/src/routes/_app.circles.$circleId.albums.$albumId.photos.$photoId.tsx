import { createFileRoute } from '@tanstack/react-router';

import { useCircleDetail } from '../features/circles/circle-detail-context';
import { PhotoViewer } from '../features/photos/viewer/photo-viewer';

/**
 * Visor de foto (F30), anidado bajo el álbum.
 *
 * La ruta del álbum sigue montada detrás; esta ruta solo pinta el visor en un
 * portal. El enlace es privado: la API exige sesión y membresía vigente.
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

  return (
    <PhotoViewer
      circleId={circleId}
      albumId={albumId}
      photoId={photoId}
      allowOriginal={circle.settings.membersCanDownload}
    />
  );
}
