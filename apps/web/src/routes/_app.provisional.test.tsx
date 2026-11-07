import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { createQueryClient } from '../lib/query-client';
import { routeTree } from '../routeTree.gen';

/**
 * `/profile` ya no es una pantalla provisional. Se conserva esta comprobación
 * de árbol de rutas para garantizar que el destino resuelve a su ruta real y
 * no cae en el 404.
 */
describe('rutas sin placeholder', () => {
  it('/profile resuelve a su ruta real y no al 404', async () => {
    const router = createRouter({
      routeTree,
      context: { queryClient: createQueryClient() },
      history: createMemoryHistory({ initialEntries: ['/profile'] }),
      scrollRestoration: false,
    });

    await router.load();

    const routeIds = router.state.matches.map((match) => match.routeId);

    expect(routeIds).toContain('/_app');
    expect(routeIds.at(-1)).toBe('/_app/profile');
  });

  it('/uploads sigue resolviendo a su ruta real y no al 404', async () => {
    const router = createRouter({
      routeTree,
      context: { queryClient: createQueryClient() },
      history: createMemoryHistory({ initialEntries: ['/uploads'] }),
      scrollRestoration: false,
    });

    await router.load();

    const routeIds = router.state.matches.map((match) => match.routeId);

    expect(routeIds).toContain('/_app');
    expect(routeIds.at(-1)).toBe('/_app/uploads');
  });
});
