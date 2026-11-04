import { createFileRoute, useRouter } from '@tanstack/react-router';

import { CircleDetailPage } from '../features/circles/circle-detail-page';

/**
 * Detalle de un círculo.
 *
 * Contenido privado: SPA (`ssr: false`) y componente en `features/circles/`.
 * El wrapper solo lee el parámetro de la ruta; no exporta nada más.
 */
export const Route = createFileRoute('/_app/circles/$circleId')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) =>
    search.created === true || search.created === '1' || search.created === 'true'
      ? { created: true }
      : {},
  head: () => ({
    meta: [{ title: 'Círculo · Memora' }],
  }),
  component: CircleDetailRoute,
});

function CircleDetailRoute() {
  const { circleId } = Route.useParams();
  const { created } = Route.useSearch();
  const router = useRouter();

  const closeCreatedToast = () => {
    void router.navigate({
      to: '/circles/$circleId',
      params: { circleId },
      search: {},
      replace: true,
    });
  };

  return (
    <CircleDetailPage
      circleId={circleId}
      created={created}
      onCreatedToastClose={closeCreatedToast}
    />
  );
}
