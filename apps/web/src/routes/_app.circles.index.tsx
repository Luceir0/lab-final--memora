import { createFileRoute } from '@tanstack/react-router';

import { CircleListPage } from '../features/circles/circle-list-page';

/** `/circles`: lista, destacado y estados. */
export const Route = createFileRoute('/_app/circles/')({
  head: () => ({
    meta: [{ title: 'Mis círculos · Memora' }],
  }),
  component: CircleListPage,
});
