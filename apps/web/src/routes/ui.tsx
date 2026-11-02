import { createFileRoute, notFound } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

/**
 * Catálogo de `@memora/ui`, solo en desarrollo.
 *
 * El árbol de rutas es idéntico en desarrollo y producción: `Route` siempre
 * está registrada para que `routeTree.gen.ts` no cambie con el modo. En
 * producción `beforeLoad` lanza `notFound()` y el catálogo nunca se importa:
 * el `import()` vive en la rama muerta de `import.meta.env.DEV`, así que Vite
 * no emite su chunk.
 *
 * Exporta solo `Route` para no romper el code-splitting (lección de F09).
 */
const DevUiShowcase = import.meta.env.DEV
  ? lazy(() => import('../features/dev/ui-showcase'))
  : null;

export const Route = createFileRoute('/ui')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'UI kit · Memora' }],
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound();
    }
  },
  component: UiDevRoute,
});

function UiDevRoute() {
  if (!DevUiShowcase) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <DevUiShowcase />
    </Suspense>
  );
}
