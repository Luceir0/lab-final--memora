import { createFileRoute } from '@tanstack/react-router';

import { CreateCircleScreen } from '../features/circles/create-circle-screen';

/** `/circles/new`: alta dentro de `ResponsiveDialog` con URL propia. */
export const Route = createFileRoute('/_app/circles/new')({
  head: () => ({
    meta: [{ title: 'Nuevo círculo · Memora' }],
  }),
  component: CreateCircleScreen,
});
