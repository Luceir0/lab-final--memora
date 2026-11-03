import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../../../packages/ui/src/test/axe';
import { RegisterRouteComponent } from '../features/auth/register-route';
import { AUTH_REGISTER_URL, testUser } from '../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../test/auth-server';

import { Route } from './register';

const server = createAuthTestServer();

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

/** Router de test con el componente y el `validateSearch` reales. */
const validateSearch = Route.options.validateSearch as (
  search: Record<string, unknown>,
) => Record<string, unknown>;

const rootRoute = createRootRoute({ component: Outlet });

function page(title: string) {
  return function Page() {
    return <h1>{title}</h1>;
  };
}

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch,
  component: RegisterRouteComponent,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch,
  component: page('Hola de nuevo'),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: page('Perfil'),
});

const circlesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/circles',
  component: page('Tus círculos'),
});

const routeTree = rootRoute.addChildren([registerRoute, loginRoute, profileRoute, circlesRoute]);

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    scrollRestoration: false,
  });

  const { container } = render(<RouterProvider router={router} />);

  return { router, container };
}

describe('ruta /register', () => {
  it('mantiene el modo SSR por defecto y declara el título', async () => {
    expect(Route.options.ssr).toBeUndefined();

    const head = Route.options.head;

    if (typeof head !== 'function') {
      throw new Error('La ruta /register no define head');
    }

    const result = await head({} as never);
    expect(JSON.stringify(result?.meta)).toContain('Crear cuenta · Memora');
  });

  it('no tiene violaciones axe en el árbol completo', async () => {
    const { container } = renderAt('/register');

    await screen.findByRole('heading', { level: 1, name: 'Crea tu cuenta' });

    await expectNoAxeViolations(container);
  });

  it('el enlace a acceso conserva un redirect interno válido', async () => {
    renderAt('/register?redirect=%2Fprofile');

    await screen.findByRole('heading', { level: 1, name: 'Crea tu cuenta' });

    expect(screen.getByText(/¿Ya tienes una\?/)).toBeTruthy();
    expect(screen.queryByText('Solo entra la gente a la que invitas.')).toBeNull();

    expect(screen.getByRole('link', { name: 'política de privacidad' }).getAttribute('href')).toBe(
      '/privacy',
    );

    const link = screen.getByRole('link', { name: 'Inicia sesión' });
    const href = link.getAttribute('href');

    expect(href).toBeTruthy();

    const url = new URL(href!, 'http://localhost');

    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('redirect')).toBe('/profile');
  });

  it('tras un 201 navega al destino sin pasar por /login', async () => {
    server.use(
      http.post(AUTH_REGISTER_URL, () => HttpResponse.json({ user: testUser }, { status: 201 })),
    );

    const { router } = renderAt('/register?redirect=%2Fprofile');
    const user = userEvent.setup();

    await screen.findByRole('heading', { level: 1, name: 'Crea tu cuenta' });
    await user.type(await screen.findByLabelText('Nombre'), 'Sofía Martín');
    await user.type(screen.getByLabelText('Email'), 'sofia@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreto123');
    await user.type(screen.getByLabelText('Repite la contraseña'), 'secreto123');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/profile');
    });

    expect(router.history.length).toBe(1);
    expect(router.state.location.href).not.toContain('/login');
  });
});
