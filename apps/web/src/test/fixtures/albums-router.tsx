import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from '@tanstack/react-router';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

import { ThemeProvider } from '../../components/theme-provider';

/** Contenido de la ruta de detalle: fijo o según la ruta actual. */
export type AlbumDetailRouteContent = ReactNode | ((pathname: string) => ReactNode | undefined);

/**
 * Router mínimo para los tests de F24.
 *
 * `renderWithRouter` (en `test/circles-harness.tsx`) no conoce la ruta de
 * detalle de álbum. Este helper la añade, además de permitir contenido distinto
 * en `/circles/$circleId` y en `/circles/$circleId/albums/$albumId`: así se
 * puede comprobar que, tras eliminar un álbum, la página del círculo recibe la
 * marca `albumDeleted`.
 *
 * `albumDetailRoute` también acepta una función que recibe el `pathname`: sirve
 * para montar una ruta canónica distinta (`/circles/cir_otro/albums/...`)
 * cuando el detalle redirige por pertenecer a otro círculo.
 */
export interface AlbumsRouterOptions {
  readonly queryClient?: QueryClient;
  /** Contenido de `/circles/$circleId`. Por defecto, `ui`. */
  readonly circleRoute?: ReactNode;
  /** Contenido de `/circles/$circleId/albums/$albumId`. Por defecto, `ui`. */
  readonly albumDetailRoute?: AlbumDetailRouteContent;
}

export function renderAlbumsRouter(
  ui: ReactNode,
  initialPath = '/',
  options: AlbumsRouterOptions = {},
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

  const circleRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles/$circleId',
    validateSearch: (search: Record<string, unknown>) =>
      search as { albumDeleted?: boolean; created?: boolean },
    component: page(options.circleRoute ?? ui),
  });

  const albumDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles/$circleId/albums/$albumId',
    component: AlbumDetailRoute,
  });

  function AlbumDetailRoute() {
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const content = options.albumDetailRoute ?? ui;
    const resolved = typeof content === 'function' ? (content(pathname) ?? ui) : content;

    return <>{resolved}</>;
  }

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
      circleRoute,
      albumDetailRoute,
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
