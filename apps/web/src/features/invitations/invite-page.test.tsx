import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { normalizeAuthRedirect } from '../auth/redirect';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { circleWithCover } from '../../test/circles-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { InvitationPage, InvitationPagePending } from './invitation-page';
import { invitationLoginHref, type InvitationPageData } from './page-data';
import {
  failedInvitationData,
  invitationData,
  invalidInvitationData,
  previewWithState,
  testInvitationToken,
} from './test-fixtures';

const server = createAuthTestServer();
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const ACCEPT_URL = `${AUTH_TEST_API_BASE}/invitations/${testInvitationToken}/accept`;

function jsonError(status: number, code: string, message: string): Response {
  return HttpResponse.json({ code, message, details: null }, { status });
}

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

interface RenderInvitationOptions {
  /** Se llama cada vez que el router ejecuta el loader de la ruta. */
  readonly onLoader?: (() => void) | undefined;
}

function renderInvitationPage(data: InvitationPageData, options: RenderInvitationOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, refetchOnWindowFocus: false },
    },
  });

  const rootRoute = createRootRoute({ component: Outlet });
  const page = (label: string) =>
    function Page() {
      return <h1>{label}</h1>;
    };

  function InvitationTestPage() {
    const router = useRouter();

    return (
      <InvitationPage
        data={data}
        onAccepted={(circleId) => {
          void router.navigate({
            to: '/circles/$circleId',
            params: { circleId },
            replace: true,
          });
        }}
      />
    );
  }

  const routeTree = rootRoute.addChildren([
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/invite/$token',
      loader: () => {
        options.onLoader?.();
        return null;
      },
      component: InvitationTestPage,
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/circles',
      component: page('Mis círculos'),
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/circles/$circleId',
      component: page('Círculo'),
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/login',
      component: page('Entrar'),
    }),
    createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: page('Inicio'),
    }),
  ]);

  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/invite/${testInvitationToken}`] }),
    context: { queryClient },
    scrollRestoration: false,
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { ...result, router, queryClient };
}

describe('página de invitación', () => {
  it('anuncia la carga una sola vez y conserva h1 y título (A-05)', async () => {
    const previousTitle = document.title;
    render(<InvitationPagePending />);

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toContain('Cargando');
    expect(screen.getByRole('heading', { level: 1, name: 'Cargando invitación' })).toBeTruthy();

    await waitFor(() => {
      expect(document.title).toBe('Invitación · Memora');
    });

    document.title = previousTitle;
  });

  it('pinta la tarjeta válida con sesión y no muestra fotos (AC-02)', async () => {
    const { container } = renderInvitationPage(invitationData());

    expect(await screen.findByRole('heading', { level: 1, name: 'Familia García' })).toBeTruthy();
    expect(screen.getByText('Lucas Vidal')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Aceptar invitación' })).toBeTruthy();
    expect(screen.getByText(/Entrarás como sofia\.martin@correo\.es/)).toBeTruthy();
    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(container.querySelector('[data-invitation-actions]')?.className.includes('fixed')).toBe(
      false,
    );

    await expectNoAxeViolations(container);
  });

  it('sin sesión ofrece entrar y conserva el token en el redirect (D5, AC-04)', async () => {
    renderInvitationPage(invitationData(undefined, null));

    const link = await screen.findByRole('link', { name: 'Entrar para aceptar' });

    expect(link.getAttribute('href')).toBe(
      `/login?redirect=${encodeURIComponent(`/invite/${testInvitationToken}`)}`,
    );
    expect(screen.queryByRole('button', { name: 'Aceptar invitación' })).toBeNull();
    expect(screen.queryByText(/Entrarás como/)).toBeNull();
  });

  it('muestra la caducidad con el nombre del invitador y del círculo', async () => {
    renderInvitationPage(invitationData(previewWithState('expired')));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Esta invitación ha caducado' }),
    ).toBeTruthy();
    expect(screen.getByText('Caducada')).toBeTruthy();
    expect(screen.getByText(/Pide a Lucas Vidal/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Aceptar invitación' })).toBeNull();
  });

  it('muestra la invitación revocada', async () => {
    renderInvitationPage(invitationData(previewWithState('revoked')));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Esta invitación ya no está disponible',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Revocada')).toBeTruthy();
  });

  it('muestra «ya eres miembro» con el nombre del círculo', async () => {
    renderInvitationPage(invitationData(previewWithState('already_member')));

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Ya formas parte de Familia García',
      }),
    ).toBeTruthy();
    expect(screen.getByText('Ya eres miembro')).toBeTruthy();
  });

  it('muestra el enlace inválido con salida a mis círculos', async () => {
    renderInvitationPage(invalidInvitationData);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Este enlace no es válido' }),
    ).toBeTruthy();
    expect(screen.getByText('Inválida')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ir a mis círculos' }).getAttribute('href')).toBe(
      '/circles',
    );
  });

  it('muestra un error reintentable si la API falla', async () => {
    const { router, container } = renderInvitationPage(failedInvitationData);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'No hemos podido cargar la invitación',
      }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ir a mis círculos' })).toBeTruthy();

    vi.spyOn(router, 'invalidate').mockReturnValue(new Promise<void>(() => {}));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('button', { name: 'Reintentando…' })).toBeTruthy();
    expect(container.querySelector('article')?.getAttribute('aria-busy')).toBe('true');
  });

  it('muestra el estado aceptando y no duplica el envío', async () => {
    let acceptCalls = 0;
    let releaseAccept: (() => void) | undefined;

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-invite' })),
      http.post(ACCEPT_URL, async () => {
        acceptCalls += 1;
        await new Promise<void>((resolve) => {
          releaseAccept = resolve;
        });
        return HttpResponse.json({ circle: circleWithCover, state: 'valid' });
      }),
    );

    const { router } = renderInvitationPage(invitationData());
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Aceptar invitación' }));

    await waitFor(() => {
      expect(acceptCalls).toBe(1);
    });

    const pendingButton = await screen.findByRole('button', { name: 'Aceptando…' });
    expect(pendingButton.getAttribute('aria-disabled')).toBe('true');
    expect(pendingButton.getAttribute('aria-busy')).toBe('true');

    await user.click(pendingButton);
    expect(acceptCalls).toBe(1);

    releaseAccept?.();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/circles/${circleWithCover.id}`);
    });
  });

  it('si aceptar devuelve 401 ofrece entrar de nuevo con el token (M-03)', async () => {
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-invite' })),
      http.post(ACCEPT_URL, () =>
        jsonError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.'),
      ),
    );

    const data = invitationData();
    renderInvitationPage(data);
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Aceptar invitación' }));

    expect(await screen.findByText('Tu sesión ha caducado')).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Entrar de nuevo' });
    expect(link.getAttribute('href')).toBe(invitationLoginHref(data));
    expect(link.className).toContain('h-11');
  });

  it('si aceptar devuelve 409 refresca la preview (M-03)', async () => {
    let loaderCalls = 0;

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-invite' })),
      http.post(ACCEPT_URL, () =>
        jsonError(409, 'CONFLICT', 'La invitación ha caducado o se ha revocado.'),
      ),
    );

    renderInvitationPage(invitationData(), {
      onLoader: () => {
        loaderCalls += 1;
      },
    });
    const user = userEvent.setup();

    await screen.findByRole('heading', { level: 1, name: 'Familia García' });
    await waitFor(() => {
      expect(loaderCalls).toBe(1);
    });

    await user.click(screen.getByRole('button', { name: 'Aceptar invitación' }));
    expect(await screen.findByText('Esta invitación ya no está disponible')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Actualizar' }));

    await waitFor(() => {
      expect(loaderCalls).toBe(2);
    });
  });

  it('si aceptar falla con 5xx permite reintentar y vuelve a llamar (M-03)', async () => {
    let acceptCalls = 0;

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-invite' })),
      http.post(ACCEPT_URL, () => {
        acceptCalls += 1;
        return jsonError(500, 'INTERNAL_ERROR', 'Ha ocurrido un error inesperado.');
      }),
    );

    const { container } = renderInvitationPage(invitationData());
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Aceptar invitación' }));
    expect(await screen.findByText('No hemos podido aceptar la invitación')).toBeTruthy();
    await waitFor(() => {
      expect(acceptCalls).toBe(1);
    });

    const alert = screen.getByRole('alert');
    const actions = container.querySelector('[data-invitation-actions]');
    expect(actions?.contains(alert)).toBe(false);
    expect(container.querySelector('article')?.contains(alert)).toBe(false);

    const retry = screen.getByRole('button', { name: 'Reintentar' });
    expect(retry.className).toContain('h-11');
    await user.click(retry);
    await waitFor(() => {
      expect(acceptCalls).toBe(2);
    });
  });

  it('el redirect de login conserva el token y el normalizador lo acepta (M-03)', () => {
    const data = invitationData();
    const href = invitationLoginHref(data);
    const url = new URL(href, 'http://localhost');
    const redirect = url.searchParams.get('redirect');

    expect(url.pathname).toBe('/login');
    expect(redirect).toBe(`/invite/${testInvitationToken}`);
    expect(normalizeAuthRedirect(redirect)).toBe(`/invite/${testInvitationToken}`);
  });

  it('acepta la invitación con CSRF y navega al círculo (AC-05)', async () => {
    let csrfHeader: string | null = null;

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-invite' })),
      http.post(ACCEPT_URL, ({ request }) => {
        csrfHeader = request.headers.get('x-csrf-token');
        return HttpResponse.json({ circle: circleWithCover, state: 'valid' });
      }),
    );

    const { router } = renderInvitationPage(invitationData());
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Aceptar invitación' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/circles/${circleWithCover.id}`);
    });
    expect(csrfHeader).toBe('csrf-invite');
  });
});
