import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

/**
 * Router de la aplicación. `routeTree.gen.ts` lo genera el plugin de TanStack
 * Router a partir de `src/routes/**` al arrancar `dev` o `build`.
 */
export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
