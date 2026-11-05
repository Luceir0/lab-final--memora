import { Outlet, createFileRoute } from '@tanstack/react-router';

import { CircleDetailLayout } from '../features/circles/circle-detail-layout';

/**
 * Layout estructural de un círculo.
 *
 * Contenido privado: SPA (`ssr: false`). Pide el círculo, resuelve 401/404/error
 * y comparte los datos por contexto con la sección hija. El chrome compartido
 * (migas, héroe, cabecera compacta, pestañas y diálogo de invitar) lo pinta
 * `CircleDetailLayout` alrededor del `<Outlet/>`: así el héroe y el modal no se
 * remontan al cambiar de pestaña. La sección hija solo aporta su contenido.
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

  return (
    <CircleDetailLayout circleId={circleId}>
      <Outlet />
    </CircleDetailLayout>
  );
}
