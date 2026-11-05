import { Outlet, createFileRoute } from '@tanstack/react-router';

import { CircleDetailLayout } from '../features/circles/circle-detail-layout';

function parseFlag(value: unknown): boolean {
  return value === true || value === '1' || value === 'true';
}

/**
 * Layout estructural de un círculo.
 *
 * Contenido privado: SPA (`ssr: false`). Pide el círculo, resuelve 401/404/error
 * y comparte los datos por contexto con la sección hija. El chrome compartido
 * (migas, héroe, cabecera compacta, pestañas y diálogos) lo pinta
 * `CircleDetailLayout` alrededor del `<Outlet/>`: así el héroe y los modales no
 * se remontan al cambiar de pestaña. El detalle de un álbum detecta su ruta y
 * se queda solo con el provider.
 */
export const Route = createFileRoute('/_app/circles/$circleId')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => {
    const result: { created?: boolean; albumDeleted?: boolean } = {};

    if (parseFlag(search.created)) {
      result.created = true;
    }

    if (parseFlag(search.albumDeleted)) {
      result.albumDeleted = true;
    }

    return result;
  },
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
