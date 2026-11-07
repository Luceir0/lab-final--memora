import type { CurrentUserDto } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { ThemeProvider } from '../../components/theme-provider';
import { THEME_COOKIE } from '../../lib/theme';
import { AUTH_TEST_API_BASE, testUser } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { Route as ProfileRoute } from '../../routes/_app.profile';

import { ProfilePage } from './profile-page';

const server = createAuthTestServer();
const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const LOGOUT_URL = `${AUTH_TEST_API_BASE}/auth/logout`;

const user: CurrentUserDto = testUser;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
  vi.unstubAllGlobals();
});

afterAll(() => {
  server.close();
});

function registerProfileApi() {
  server.use(
    http.get(ME_URL, () => HttpResponse.json({ user })),
    http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-profile' })),
  );
}

interface RenderProfileOptions {
  /** Retardo del `GET /me` para observar el esqueleto. */
  readonly meDelayMs?: number;
  /** Número de `GET /me` que fallan con 500 antes de responder bien. */
  readonly meFailuresBeforeSuccess?: number;
  /** Se llama en cada `GET /me` con el número de intento. */
  readonly onMeRequest?: (attempt: number) => void;
}

function renderProfilePage(
  options: RenderProfileOptions = {},
  initialEntries: readonly string[] = ['/profile'],
) {
  registerProfileApi();

  let attempts = 0;

  server.use(
    http.get(ME_URL, async () => {
      attempts += 1;
      options.onMeRequest?.(attempts);

      if (options.meDelayMs !== undefined) {
        await delay(options.meDelayMs);
      }

      if (attempts <= (options.meFailuresBeforeSuccess ?? 0)) {
        return HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Fallo interno', details: null },
          { status: 500 },
        );
      }

      return HttpResponse.json({ user });
    }),
  );

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, refetchOnWindowFocus: false },
    },
  });

  const rootRoute = createRootRoute({ component: Outlet });

  const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/profile',
    component: ProfilePage,
  });

  const helpRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/help',
    component: () => <h1>Ayuda</h1>,
  });

  const privacyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/privacy',
    component: () => <h1>Privacidad</h1>,
  });

  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: () => <h1>Entrar</h1>,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([profileRoute, helpRoute, privacyRoute, loginRoute]),
    history: createMemoryHistory({ initialEntries: [...initialEntries] }),
    scrollRestoration: false,
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initialMode="system">
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );

  return { ...result, router, queryClient, meAttempts: () => attempts };
}

async function findProfile(): Promise<HTMLElement> {
  return screen.findByRole('heading', { level: 1, name: 'Perfil' });
}

/** Espera a que `/me` resuelva y la tarjeta pinte la acción «Editar». */
async function findLoadedProfile(): Promise<HTMLElement> {
  await findProfile();
  return screen.findByRole('button', { name: 'Editar' });
}

describe('ruta /profile', () => {
  it('declara el título de Perfil', async () => {
    const head = ProfileRoute.options.head;

    expect(typeof head).toBe('function');

    if (typeof head !== 'function') {
      return;
    }

    const result = (await head({} as never)) as { meta?: Array<{ title?: string }> } | undefined;

    expect(result?.meta?.find((meta) => meta.title !== undefined)?.title).toBe('Perfil · Memora');
  });
});

describe('Perfil', () => {
  it('muestra los datos, la apariencia, la instalación, los accesos y el logout', async () => {
    renderProfilePage();

    await findLoadedProfile();

    expect(screen.getByText(user.name)).toBeTruthy();
    expect(screen.getByText(user.email)).toBeTruthy();
    expect(screen.getByText('SM')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Cambiar foto|Subir foto/ })).toBeNull();
    expect(screen.queryByText(/Almacenamiento/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy();

    expect(screen.getByRole('heading', { level: 2, name: 'Apariencia' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Apariencia' })).toBeTruthy();

    expect(screen.getByRole('heading', { level: 2, name: 'Instala Memora' })).toBeTruthy();

    const quickLinks = screen.getByRole('navigation', { name: 'Más secciones' });
    expect(
      within(quickLinks)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/help', '/privacy']);

    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
  });

  it('mantiene el email en solo lectura al editar el nombre', async () => {
    renderProfilePage();
    await findLoadedProfile();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    const email = screen.getByLabelText('Email') as HTMLInputElement;

    expect(email.value).toBe(user.email);
    expect(email.readOnly).toBe(true);
    expect(screen.getByText('El email no se puede cambiar en este momento.')).toBeTruthy();
  });

  it('guarda el nombre con un PATCH y refresca la caché compartida', async () => {
    const requests: Array<{ readonly body: unknown; readonly csrf: string | null }> = [];

    server.use(
      http.patch(ME_URL, async ({ request }) => {
        const body: unknown = await request.json();

        requests.push({ body, csrf: request.headers.get('x-csrf-token') });

        return HttpResponse.json({
          user: { ...user, name: 'Sofía Martín Ortega' },
        });
      }),
    );

    renderProfilePage();
    await findLoadedProfile();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    const name = screen.getByLabelText('Nombre');
    await userEvent.clear(name);
    await userEvent.type(name, 'Sofía Martín Ortega');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(requests).toHaveLength(1);
    });

    expect(requests[0]?.body).toEqual({ name: 'Sofía Martín Ortega' });
    expect(requests[0]?.csrf).toBe('csrf-profile');

    expect(await screen.findByText('Sofía Martín Ortega')).toBeTruthy();
    expect(screen.getByText('Nombre actualizado')).toBeTruthy();
    expect(screen.queryByLabelText('Nombre')).toBeNull();
  });

  it('valida el nombre en cliente y no llama a la API si está vacío', async () => {
    let patchCalls = 0;

    server.use(
      http.patch(ME_URL, () => {
        patchCalls += 1;
        return HttpResponse.json({ user });
      }),
    );

    renderProfilePage();
    await findLoadedProfile();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    const name = screen.getByLabelText('Nombre');
    await userEvent.clear(name);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('El nombre es obligatorio.')).toBeTruthy();
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(name);
    expect(patchCalls).toBe(0);
  });

  it('muestra el error por campo que devuelve el PATCH', async () => {
    server.use(
      http.patch(ME_URL, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'Revisa los datos enviados.',
            details: [{ field: 'name', message: 'Ese nombre no está permitido.' }],
          },
          { status: 400 },
        ),
      ),
    );

    renderProfilePage();
    await findLoadedProfile();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    const name = screen.getByLabelText('Nombre');
    await userEvent.clear(name);
    await userEvent.type(name, 'Otro nombre');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Ese nombre no está permitido.')).toBeTruthy();
    expect(document.activeElement).toBe(name);
  });

  it('anuncia un fallo de guardado sin error de campo', async () => {
    server.use(
      http.patch(ME_URL, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Fallo interno', details: null },
          { status: 500 },
        ),
      ),
    );

    renderProfilePage();
    await findLoadedProfile();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    const name = screen.getByLabelText('Nombre');
    await userEvent.clear(name);
    await userEvent.type(name, 'Otro nombre');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('No hemos podido guardar tus datos')).toBeTruthy();
  });

  it('cancela la edición con Escape sin enviar nada', async () => {
    renderProfilePage();
    await findLoadedProfile();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    const name = screen.getByLabelText('Nombre');

    await userEvent.clear(name);
    await userEvent.type(name, 'Cambio descartado');
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByLabelText('Nombre')).toBeNull();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy();
    expect(screen.getByText(user.name)).toBeTruthy();
  });

  it('persiste el tema en la cookie al elegir otra apariencia', async () => {
    renderProfilePage();
    await findLoadedProfile();

    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }));

    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('cierra la sesión con confirmación y navega a /login', async () => {
    let logoutCalls = 0;

    server.use(
      http.post(LOGOUT_URL, () => {
        logoutCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { queryClient } = renderProfilePage();
    await findLoadedProfile();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('¿Cerrar sesión?')).toBeTruthy();
    expect(dialog.querySelector('[data-tone="danger"]')).toBeNull();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeTruthy();
    expect(logoutCalls).toBe(1);
    expect(queryClient.getQueryData(['me'])).toBeUndefined();
  });

  it('muestra el error de logout y mantiene la sesión si falla', async () => {
    server.use(
      http.post(LOGOUT_URL, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Fallo interno', details: null },
          { status: 500 },
        ),
      ),
    );

    renderProfilePage();
    await findLoadedProfile();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('No hemos podido cerrar la sesión')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Perfil' })).toBeTruthy();
  });

  it('muestra el esqueleto de carga y luego los datos', async () => {
    const { container } = renderProfilePage({ meDelayMs: 40 });

    expect(await screen.findByText('Cargando tu perfil…')).toBeTruthy();
    await expectNoAxeViolations(container);

    await findLoadedProfile();
    expect(await screen.findByText(user.email)).toBeTruthy();
  });

  it('muestra el error de carga y permite reintentar', async () => {
    const { container, meAttempts } = renderProfilePage({ meFailuresBeforeSuccess: 1 });
    await findProfile();

    expect(await screen.findByText('No hemos podido cargar tu perfil')).toBeTruthy();
    await expectNoAxeViolations(container);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText(user.email)).toBeTruthy();
    expect(meAttempts()).toBe(2);
  });

  it('no tiene violaciones de axe con datos y en edición', async () => {
    const { container } = renderProfilePage();
    await findLoadedProfile();

    await expectNoAxeViolations(container);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    await screen.findByLabelText('Nombre');

    await expectNoAxeViolations(container);
  });
});
