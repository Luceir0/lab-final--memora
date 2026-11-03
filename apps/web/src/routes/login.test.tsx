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
import { LoginRouteComponent } from '../features/auth/login-route';
import { AUTH_LOGIN_URL, testUser } from '../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../test/auth-server';

import { Route } from './login';

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

/**
 * Router de test con el componente y el `validateSearch` reales de la ruta.
 * Solo se sustituye el árbol generado, que arrastra el documento SSR de Start.
 */
const validateSearch = Route.options.validateSearch as (
  search: Record<string, unknown>,
) => Record<string, unknown>;

const rootRoute = createRootRoute({ component: Outlet });

function page(title: string) {
  return function Page() {
    return <h1>{title}</h1>;
  };
}

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch,
  component: LoginRouteComponent,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch,
  component: page('Crea tu cuenta'),
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

const routeTree = rootRoute.addChildren([loginRoute, registerRoute, profileRoute, circlesRoute]);

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    scrollRestoration: false,
  });

  const { container } = render(<RouterProvider router={router} />);

  return { router, container };
}

describe('ruta /login', () => {
  it('mantiene el modo SSR por defecto y declara el título', async () => {
    expect(Route.options.ssr).toBeUndefined();

    const head = Route.options.head;

    if (typeof head !== 'function') {
      throw new Error('La ruta /login no define head');
    }

    const result = await head({} as never);
    expect(JSON.stringify(result?.meta)).toContain('Entrar · Memora');
  });

  it('no tiene violaciones axe en el árbol completo', async () => {
    const { container } = renderAt('/login');

    await screen.findByRole('heading', { level: 1, name: 'Hola de nuevo' });

    await expectNoAxeViolations(container);
  });

  it('el enlace a registro conserva un redirect interno válido', async () => {
    renderAt('/login?redirect=%2Fprofile%3Ftab%3Dcuenta');

    await screen.findByRole('heading', { level: 1, name: 'Hola de nuevo' });

    const link = await screen.findByRole('link', { name: 'Crea una' });
    const href = link.getAttribute('href');

    expect(href).toBeTruthy();

    const url = new URL(href!, 'http://localhost');

    expect(url.pathname).toBe('/register');
    expect(url.searchParams.get('redirect')).toBe('/profile?tab=cuenta');
  });

  it('tras un acceso correcto navega al redirect y reemplaza el historial', async () => {
    server.use(http.post(AUTH_LOGIN_URL, () => HttpResponse.json({ user: testUser })));

    const { router } = renderAt('/login?redirect=%2Fprofile%3Ftab%3Dcuenta');
    const user = userEvent.setup();

    await screen.findByRole('heading', { level: 1, name: 'Hola de nuevo' });
    await user.type(await screen.findByLabelText('Email'), 'sofia@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreto123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/profile');
    });

    expect(router.state.location.search).toEqual({ tab: 'cuenta' });
    expect(router.history.length).toBe(1);
    expect(router.state.location.href).not.toContain('/login');
  });

  it('ignora un redirect externo en la URL y navega a /circles', async () => {
    server.use(http.post(AUTH_LOGIN_URL, () => HttpResponse.json({ user: testUser })));

    const { router } = renderAt('/login?redirect=https%3A%2F%2Fevil.example');
    const user = userEvent.setup();

    await screen.findByRole('heading', { level: 1, name: 'Hola de nuevo' });
    await user.type(await screen.findByLabelText('Email'), 'sofia@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreto123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles');
    });
  });
});
