import { createRouter } from '@tanstack/react-router';

import { createQueryClient, type RouterContext } from './lib/query-client';
import { routeTree } from './routeTree.gen';

/**
 * Router de la aplicación. `routeTree.gen.ts` lo genera el plugin de TanStack
 * Router a partir de `src/routes/**` al arrancar `dev` o `build`.
 *
 * `getRouter()` se llama una vez por navegador y una vez por petición en
 * servidor: el `QueryClient` creado aquí nunca se comparte entre peticiones.
 */
export function getRouter() {
  const context: RouterContext = { queryClient: createQueryClient() };

  return createRouter({
    routeTree,
    context,
    defaultPreload: 'intent',
    scrollRestoration: true,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
