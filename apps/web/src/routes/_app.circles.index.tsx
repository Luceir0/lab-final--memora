import { createFileRoute, useRouter } from '@tanstack/react-router';

import { CircleListPage } from '../features/circles/circle-list-page';
import { parseSearchFlag } from '../features/circles/search-flags';

/**
 * `/circles`: lista, destacado y estados.
 *
 * Acepta las marcas de aviso `deleted` y `left` que dejan las acciones de
 * Ajustes. Se limpian de la URL con `replace` al cerrar el toast.
 */
export const Route = createFileRoute('/_app/circles/')({
  validateSearch: (search: Record<string, unknown>) => {
    const result: { deleted?: boolean; left?: boolean } = {};

    if (parseSearchFlag(search.deleted)) {
      result.deleted = true;
    }

    if (parseSearchFlag(search.left)) {
      result.left = true;
    }

    return result;
  },
  head: () => ({
    meta: [{ title: 'Mis círculos · Memora' }],
  }),
  component: CirclesIndexRoute,
});

function CirclesIndexRoute() {
  const { deleted, left } = Route.useSearch();
  const router = useRouter();

  const clearNotice = () => {
    void router.navigate({ href: '/circles', replace: true });
  };

  return <CircleListPage deleted={deleted} left={left} onNoticeClose={clearNotice} />;
}
