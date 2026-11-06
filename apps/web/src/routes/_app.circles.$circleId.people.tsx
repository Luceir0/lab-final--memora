import { Outlet, createFileRoute, useRouterState } from '@tanstack/react-router';

import { PeoplePage } from '../features/members/people-page';

/** `/circles/:circleId/people/:userId/photos`, con barra final opcional. */
const PERSON_PHOTOS_PATTERN = /^\/circles\/[^/]+\/people\/[^/]+\/photos\/?$/;

/**
 * Personas del círculo.
 *
 * El layout padre ya ha resuelto sesión, permisos, datos y chrome; esta ruta
 * solo monta el contenido de la sección. La página «Fotos de esta persona» es
 * una ruta hija con su propio chrome: cuando está activa se delega en el
 * `<Outlet/>` para no pintar la lista de miembros debajo.
 */
export const Route = createFileRoute('/_app/circles/$circleId/people')({
  head: () => ({
    meta: [{ title: 'Personas · Memora' }],
  }),
  component: PeopleRoute,
});

function PeopleRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (PERSON_PHOTOS_PATTERN.test(pathname)) {
    return <Outlet />;
  }

  return <PeoplePage />;
}
