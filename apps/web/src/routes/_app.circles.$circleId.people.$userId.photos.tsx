import { createFileRoute } from '@tanstack/react-router';

import { PersonPhotosPage } from '../features/photos/person-photos-page';

/**
 * «Fotos de esta persona».
 *
 * Se anida en el layout del círculo para compartir sesión, acceso y datos, pero
 * el layout detecta esta ruta y no pinta el chrome del círculo: la página trae
 * su propia cabecera y su enlace de vuelta a Personas.
 */
export const Route = createFileRoute('/_app/circles/$circleId/people/$userId/photos')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Fotos de una persona · Memora' }],
  }),
  component: PersonPhotosRoute,
});

function PersonPhotosRoute() {
  const { userId } = Route.useParams();

  return <PersonPhotosPage userId={userId} />;
}
