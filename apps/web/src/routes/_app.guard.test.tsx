import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { HttpResponse, delay, http } from 'msw';
import { useEffect, type ReactElement } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '../components/theme-provider';
import { useUploadQueue } from '../features/uploads/upload-queue-context';
import { AUTH_TEST_API_BASE } from '../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../test/auth-server';
import { defaultCircles, testMeResponse } from '../test/circles-fixtures';

import { Route as AppRoute } from './_app';

const server = createAuthTestServer();
const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const CIRCLES_URL = `${AUTH_TEST_API_BASE}/circles`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

const AppLayout = AppRoute.options.component as () => ReactElement;

function page(title: string) {
  return function Page() {
    return <h1>{title}</h1>;
  };
}

/**
 * Página de prueba que encola un archivo inválido en cliente: así la cola
 * queda visible sin depender de la red ni del transporte XHR.
 */
function QueueOrderPage() {
  const { enqueue } = useUploadQueue();

  useEffect(() => {
    enqueue([new File(['x'], 'animado.gif', { type: 'image/gif' })], {
      albumId: 'album-1',
      albumTitle: 'Verano',
      source: 'desktop',
    });
  }, [enqueue]);

  return <h1>Orden de la cola</h1>;
}

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, refetchOnWindowFocus: false },
    },
  });

  const rootRoute = createRootRoute({ component: Outlet });

  const appInnerRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: '_app',
    component: AppLayout,
  });

  const circlesRoute = createRoute({
    getParentRoute: () => appInnerRoute,
    path: '/circles',
    component: page('Tus círculos'),
  });

  const uploadsRoute = createRoute({
    getParentRoute: () => appInnerRoute,
    path: '/uploads',
    component: page('Subidas'),
  });

  const profileRoute = createRoute({
    getParentRoute: () => appInnerRoute,
    path: '/profile',
    component: page('Perfil'),
  });

  const helpRoute = createRoute({
    getParentRoute: () => appInnerRoute,
    path: '/help',
    component: page('Ayuda'),
  });

  const privacyRoute = createRoute({
    getParentRoute: () => appInnerRoute,
    path: '/privacy',
    component: page('Privacidad'),
  });

  const queueOrderRoute = createRoute({
    getParentRoute: () => appInnerRoute,
    path: '/queue-order',
    component: QueueOrderPage,
  });

  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    validateSearch: (search: Record<string, unknown>) => search as { redirect?: string },
    component: page('Entrar'),
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      appInnerRoute.addChildren([
        circlesRoute,
        uploadsRoute,
        profileRoute,
        helpRoute,
        privacyRoute,
        queueOrderRoute,
      ]),
      loginRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [path] }),
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

function circlesListHandler() {
  return http.get(CIRCLES_URL, () =>
    HttpResponse.json({ items: defaultCircles, nextCursor: null }),
  );
}

describe('guard de sesión de _app', () => {
  it('no pinta contenido privado mientras resuelve /me', async () => {
    server.use(
      http.get(ME_URL, async () => {
        await delay(300);
        return HttpResponse.json(testMeResponse);
      }),
      circlesListHandler(),
      ...defaultCircles.map((circle) =>
        http.get(`${CIRCLES_URL}/${circle.id}`, () =>
          HttpResponse.json({
            ...circle,
            stats: {
              membersCount: 1,
              albumsCount: 1,
              photosCount: 1,
              storageBytes: 0,
              lastUploadAt: null,
            },
          }),
        ),
      ),
    );

    const { container } = renderAt('/circles');

    expect(await screen.findByText('Cargando tu sesión…', {}, { timeout: 3000 })).toBeTruthy();
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Tus círculos' })).toBeNull();

    expect(
      await screen.findByRole('heading', { name: 'Tus círculos' }, { timeout: 5000 }),
    ).toBeTruthy();
  });

  it('ante un 401 limpia la caché y vuelve a /login con redirect', async () => {
    server.use(
      http.get(ME_URL, () =>
        HttpResponse.json(
          { code: 'UNAUTHENTICATED', message: 'Inicia sesión para continuar.', details: null },
          { status: 401 },
        ),
      ),
    );

    const { router, queryClient } = renderAt('/circles');
    const clearSpy = vi.spyOn(queryClient, 'clear');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });

    expect(clearSpy).toHaveBeenCalled();
    expect(router.state.location.search).toEqual({ redirect: '/circles' });
  });

  it('un 401 del sidebar también redirige', async () => {
    server.use(
      http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
      http.get(CIRCLES_URL, () =>
        HttpResponse.json(
          { code: 'UNAUTHENTICATED', message: 'Inicia sesión para continuar.', details: null },
          { status: 401 },
        ),
      ),
    );

    const { router } = renderAt('/uploads');

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(router.state.location.search).toEqual({ redirect: '/uploads' });
  });

  it('/help sigue siendo pública y no pide /me', async () => {
    renderAt('/help');

    expect(await screen.findByRole('heading', { name: 'Ayuda' })).toBeTruthy();
    expect(screen.queryByText('Cargando tu sesión…')).toBeNull();
  });

  it('/privacy sigue siendo pública y no pide /me', async () => {
    renderAt('/privacy');

    expect(await screen.findByRole('heading', { name: 'Privacidad' })).toBeTruthy();
    expect(screen.queryByText('Cargando tu sesión…')).toBeNull();
  });

  it('la barra global queda después del SkipLink y de <main> en el DOM', async () => {
    renderAt('/queue-order');

    expect(await screen.findByRole('heading', { name: 'Orden de la cola' })).toBeTruthy();

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar' }));

    const bar = await screen.findByRole('button', { name: /Abrir subidas\./ });
    const skipLink = screen.getByRole('link', { name: 'Saltar al contenido' });
    const main = document.getElementById('main-content');

    if (main === null) {
      throw new Error('No se ha montado <main>');
    }

    expect(skipLink.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(main.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('muestra un error recuperable si /me falla por red', async () => {
    server.use(
      http.get(ME_URL, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Fallo interno', details: null },
          { status: 500 },
        ),
      ),
    );

    renderAt('/profile');

    expect(await screen.findByText('No hemos podido comprobar tu sesión')).toBeTruthy();

    server.use(
      http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
      circlesListHandler(),
    );

    screen.getByRole('button', { name: 'Reintentar' }).click();

    expect(await screen.findByRole('heading', { name: 'Perfil' })).toBeTruthy();
  });
});
