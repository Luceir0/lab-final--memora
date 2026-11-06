import { createFileRoute } from '@tanstack/react-router';

import { CircleSettingsPage } from '../features/circles/settings/circle-settings-page';

/**
 * Ajustes del círculo.
 *
 * `ssr: false` se hereda del layout `$circleId`; esta ruta solo declara su
 * título y monta la sección. El chrome (migas, H1, pestañas y foco) lo pinta
 * `CircleDetailLayout`.
 */
export const Route = createFileRoute('/_app/circles/$circleId/settings')({
  head: () => ({
    meta: [{ title: 'Ajustes · Memora' }],
  }),
  component: CircleSettingsPage,
});
