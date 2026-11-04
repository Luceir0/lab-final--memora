import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useParams,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ThemeProvider } from '../../components/theme-provider';
import { Route as DetailFileRoute } from '../../routes/_app.circles.$circleId';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { circleDetail, circleWithCover, testMeResponse } from '../../test/circles-fixtures';
import { CreateCircleScreen } from './create-circle-screen';
import { CircleDetailPage } from './circle-detail-page';

const server = createAuthTestServer();
const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const CIRCLES_URL = `${AUTH_TEST_API_BASE}/circles`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const DETAIL_URL = `${CIRCLES_URL}/cir_new`;

const createdCircle = {
  ...circleWithCover,
  id: 'cir_new',
  name: 'Viaje a Asturias',
  description: 'La casa, la playa y los paseos.',
  coverPhoto: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const validateSearch = DetailFileRoute.options.validateSearch as (
  search: Record<string, unknown>,
) => { created?: boolean };

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function DetailRoute() {
  const params = useParams({ strict: false }) as { circleId: string };
  const { created } = useSearch({ strict: false }) as { created?: boolean };
  const router = useRouter();

  return (
    <CircleDetailPage
      circleId={params.circleId}
      created={created}
      onCreatedToastClose={() => {
        void router.navigate({
          to: '/circles/$circleId',
          params: { circleId: params.circleId },
          search: {},
          replace: true,
        });
      }}
    />
  );
}

function renderFlow() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });

  const rootRoute = createRootRoute({ component: Outlet });
  const listRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles',
    component: () => <h1>Mis círculos</h1>,
  });
  const newRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles/new',
    component: CreateCircleScreen,
  });
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles/$circleId',
    validateSearch,
    component: DetailRoute,
  });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    validateSearch: (search: Record<string, unknown>) => search as { redirect?: string },
    component: () => <h1>Entrar</h1>,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([listRoute, newRoute, detailRoute, loginRoute]),
    history: createMemoryHistory({ initialEntries: ['/circles/new'] }),
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

  return { container: result.container, router };
}

function useCreateFlow() {
  server.use(
    http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
    http.get(CIRCLES_URL, () => HttpResponse.json({ items: [], nextCursor: null })),
    http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-create' })),
    http.post(CIRCLES_URL, () => HttpResponse.json(createdCircle, { status: 201 })),
    http.get(DETAIL_URL, () =>
      HttpResponse.json(
        circleDetail(createdCircle, {
          membersCount: 1,
          albumsCount: 0,
          photosCount: 0,
          lastUploadAt: null,
        }),
      ),
    ),
  );
}

describe('flujo de alta de círculo', () => {
  it('crea, navega al detalle, muestra el toast y enfoca el h1', async () => {
    useCreateFlow();

    const { container, router } = renderFlow();
    const user = userEvent.setup();

    expect(await screen.findByRole('dialog', { name: 'Nuevo círculo' })).toBeTruthy();
    // La lista sigue montada detrás del diálogo.
    expect(await screen.findByRole('heading', { level: 1, name: 'Hola, Sofía' })).toBeTruthy();
    await user.type(screen.getByLabelText('Nombre del círculo'), 'Viaje a Asturias');
    await user.click(screen.getByRole('button', { name: 'Guardar círculo' }));

    const title = await screen.findByRole(
      'heading',
      { level: 1, name: 'Viaje a Asturias' },
      {
        timeout: 5000,
      },
    );

    await waitFor(() => {
      expect(document.activeElement).toBe(title);
    });

    expect(router.state.location.pathname).toBe('/circles/cir_new');
    expect(router.state.location.search).toEqual({ created: true });
    expect(screen.getByText('Círculo creado')).toBeTruthy();
    expect(screen.getByText('Ya puedes invitar a tu gente.')).toBeTruthy();
    expect(screen.getByText('Solo tú, de momento · Creado hoy')).toBeTruthy();
    expect(container.textContent).not.toMatch(/F2[248]/);

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    await waitFor(() => {
      expect(screen.queryByText('Círculo creado')).toBeNull();
    });
    expect(router.state.location.search).toEqual({});
  });
});
