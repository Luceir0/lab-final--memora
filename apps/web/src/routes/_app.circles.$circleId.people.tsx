import { createFileRoute } from '@tanstack/react-router';

import { PeoplePage } from '../features/members/people-page';

/**
 * Personas del círculo.
 *
 * El layout padre ya ha resuelto sesión, permisos, datos y chrome; esta ruta
 * solo monta el contenido de la sección.
 */
export const Route = createFileRoute('/_app/circles/$circleId/people')({
  head: () => ({
    meta: [{ title: 'Personas · Memora' }],
  }),
  component: PeoplePage,
});
