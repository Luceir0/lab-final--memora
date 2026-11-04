import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

import { ThemeProvider } from '../components/theme-provider';

/**
 * Router mínimo para probar componentes de `features/circles` sin arrastrar
 * el documento SSR de Start. Incluye los destinos a los que navegan o enlazan
 * las pantallas: `/`, `/circles`, `/circles/new`, `/help` y `/login`.
 */
export interface RenderWithRouterOptions {
  readonly queryClient?: QueryClient;
}

export function renderWithRouter(
  ui: ReactNode,
  initialPath = '/',
  options: RenderWithRouterOptions = {},
) {
  const queryClient =
    options.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          refetchOnWindowFocus: false,
        },
      },
    });

  const rootRoute = createRootRoute({ component: Outlet });

  const page = (element: ReactNode) =>
    function Page() {
      return <>{element}</>;
    };

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: page(ui),
  });

  const circlesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles',
    component: page(<h1>Mis círculos</h1>),
  });

  const newCircleRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles/new',
    component: page(ui),
  });

  const circleDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles/$circleId',
    component: page(ui),
  });

  const helpRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/help',
    component: page(<h1>Ayuda</h1>),
  });

  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    validateSearch: (search: Record<string, unknown>) => search as { redirect?: string },
    component: page(<h1>Entrar</h1>),
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      indexRoute,
      circlesRoute,
      newCircleRoute,
      circleDetailRoute,
      helpRoute,
      loginRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    context: { queryClient },
    scrollRestoration: false,
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initialMode="system">
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );

  return { ...result, router, queryClient };
}
