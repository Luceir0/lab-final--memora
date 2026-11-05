import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { act, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ThemeProvider } from '../../components/theme-provider';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { circleDetail, circleWithCover } from '../../test/circles-fixtures';

import { CircleDetailLayout } from './circle-detail-layout';
import { sectionNavigationState } from './use-section-focus';

const server = createAuthTestServer();
const DETAIL_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia`;
const INVITATIONS_URL = `${DETAIL_URL}/invitations`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function useDetail() {
  server.use(
    http.get(DETAIL_URL, () => HttpResponse.json(circleDetail(circleWithCover))),
    http.get(INVITATIONS_URL, () => HttpResponse.json({ items: [], nextCursor: null })),
  );
}

/**
 * Router mínimo con la misma forma que el de la app: un layout de círculo
 * persistente y dos rutas hijas. Así el layout no se remonta al cambiar de
 * pestaña, igual que en producción, y el test mide el consumo real de la marca
 * de foco.
 */
function renderCircle(initialPath: string, initialState?: { readonly focusSection: string }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, refetchOnWindowFocus: false } },
  });

  const rootRoute = createRootRoute({ component: Outlet });

  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles/$circleId',
    component: function DetailLayout() {
      const { circleId } = detailRoute.useParams();

      return (
        <CircleDetailLayout circleId={circleId}>
          <Outlet />
        </CircleDetailLayout>
      );
    },
  });

  const albumsRoute = createRoute({
    getParentRoute: () => detailRoute,
    path: '/',
    component: function Albums() {
      return <p>Álbumes</p>;
    },
  });

  const peopleRoute = createRoute({
    getParentRoute: () => detailRoute,
    path: '/people',
    component: function People() {
      return <p>Personas</p>;
    },
  });

  const history = createMemoryHistory({ initialEntries: [initialPath] });

  // Simula `history.state` persistido tras una recarga: la entrada inicial ya
  // trae una marca de una sesión anterior antes de montar la aplicación.
  if (initialState !== undefined) {
    history.push(initialPath, initialState);
  }

  const router = createRouter({
    routeTree: rootRoute.addChildren([detailRoute.addChildren([albumsRoute, peopleRoute])]),
    history,
    context: { queryClient },
    scrollRestoration: false,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initialMode="system">
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );

  return { router };
}

async function getTitle() {
  return screen.findByRole('heading', { level: 1, name: 'Familia García' });
}

async function navigateTo(router: ReturnType<typeof renderCircle>['router'], href: string) {
  await act(async () => {
    await router.navigate({ href, state: sectionNavigationState });
  });
}

function expectTitleFocused() {
  return waitFor(() => {
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 1, name: 'Familia García' }),
    );
  });
}

function focusRequestIdOf(state: object): string {
  const value = (state as { focusSection?: unknown }).focusSection;

  if (typeof value !== 'string') {
    throw new Error('La marca de foco debe ser un string');
  }

  return value;
}

describe('foco de sección', () => {
  it('no enfoca el h1 en una carga directa', async () => {
    useDetail();
    renderCircle('/circles/cir_familia/people');

    const title = await getTitle();

    expect(document.activeElement).not.toBe(title);
  });

  it('enfoca el h1 cuando la navegación por pestañas lleva la marca', async () => {
    useDetail();
    const { router } = renderCircle('/circles/cir_familia');

    await getTitle();

    await navigateTo(router, '/circles/cir_familia/people');

    await expectTitleFocused();
  });

  it('vuelve a enfocar en la segunda navegación, no solo en la primera', async () => {
    useDetail();
    const { router } = renderCircle('/circles/cir_familia');

    await getTitle();

    await navigateTo(router, '/circles/cir_familia/people');

    await expectTitleFocused();

    // El foco se mueve fuera del título para que la aserción no pase por
    // arrastre: solo una nueva marca debe devolverlo al h1.
    act(() => {
      (document.activeElement as HTMLElement | null)?.blur();
    });

    expect(document.activeElement).not.toBe(
      screen.getByRole('heading', { level: 1, name: 'Familia García' }),
    );

    await navigateTo(router, '/circles/cir_familia');

    await expectTitleFocused();
  });

  it('ignora la marca persistida tras una recarga y enfoca en la siguiente navegación', async () => {
    useDetail();

    // Escenario de recarga: el historial conserva la marca de la sesión
    // anterior antes de que se monte el layout.
    const { router } = renderCircle('/circles/cir_familia/people', {
      focusSection: 'marca-de-la-sesion-anterior',
    });

    const title = await getTitle();

    // La marca está realmente en el estado del router al montar; sin la
    // supresión del primer valor, el layout enfocaría el h1 nada más cargar.
    expect(focusRequestIdOf(router.state.location.state)).toBe('marca-de-la-sesion-anterior');
    expect(document.activeElement).not.toBe(title);

    await navigateTo(router, '/circles/cir_familia');

    await expectTitleFocused();
  });
});

describe('sectionNavigationState', () => {
  it('no reutiliza el valor que ya trae el historial', () => {
    const previous = { focusSection: '1' };

    expect(focusRequestIdOf(sectionNavigationState(previous))).not.toBe(previous.focusSection);
  });

  it('genera un id distinto en cada navegación', () => {
    const first = sectionNavigationState({});

    expect(focusRequestIdOf(sectionNavigationState(first))).not.toBe(focusRequestIdOf(first));
  });
});
