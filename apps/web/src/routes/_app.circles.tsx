import { createFileRoute } from '@tanstack/react-router';

import { CirclesPage } from '../features/spike/circles-page';

export const Route = createFileRoute('/_app/circles')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Zona privada · Memora' }],
  }),
  component: CirclesPage,
});
