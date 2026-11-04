import { Outlet, createFileRoute } from '@tanstack/react-router';

/**
 * Layout de `/circles`.
 *
 * Contenido privado: se renderiza solo en cliente (`ssr: false`) y comparte el
 * shell y el guard de `_app`. Las hojas de este árbol viven en
 * `_app.circles.index.tsx` y `_app.circles.new.tsx`.
 */
export const Route = createFileRoute('/_app/circles')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Círculos · Memora' }],
  }),
  component: CirclesLayout,
});

function CirclesLayout() {
  return <Outlet />;
}
