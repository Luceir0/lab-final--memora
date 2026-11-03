import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from '@tanstack/react-router';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from '../theme-provider';

import { AppShell } from './app-shell';

/**
 * Integración con el router real y su historial en memoria.
 *
 * El árbol de rutas es mínimo pero real (`createRoute`/`createRouter`): así se
 * ejercita el `Link` auténtico, que añade `aria-current` por su cuenta, y se
 * comprueba que no se duplique el estado activo ni el landmark.
 */
function ShellLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <ThemeProvider initialMode="system">
      <AppShell currentPath={pathname}>
        <Outlet />
      </AppShell>
    </ThemeProvider>
  );
}

const rootRoute = createRootRoute({ component: Outlet });

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_app',
  component: ShellLayout,
});

function page(title: string) {
  return function Page() {
    return <h1>{title}</h1>;
  };
}

const circlesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/circles',
  component: page('Tus círculos'),
});

const circleRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/circles/$circleId',
  component: page('Un círculo'),
});

const uploadsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/uploads',
  component: page('Subidas'),
});

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/profile',
  component: page('Perfil'),
});

const helpRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/help',
  component: page('Ayuda'),
});

const privacyRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/privacy',
  component: page('Privacidad'),
});

const routeTree = rootRoute.addChildren([
  appRoute.addChildren([
    circlesRoute,
    circleRoute,
    uploadsRoute,
    profileRoute,
    helpRoute,
    privacyRoute,
  ]),
]);

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    scrollRestoration: false,
  });

  render(<RouterProvider router={router} />);

  return router;
}

function navCurrentHrefs(): Array<string | null> {
  const nav = screen.getByRole('navigation', { name: 'Navegación principal' });

  return within(nav)
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
    .map((link) => link.getAttribute('href'));
}

function expectLogosWithoutCurrent(): void {
  const logos = screen.getAllByRole('link', { name: 'memora' });

  expect(logos.length).toBeGreaterThan(0);

  for (const logo of logos) {
    expect(logo.getAttribute('aria-current')).toBe('false');
  }
}

describe('AppShell con el router real', () => {
  it('en /help hay un solo nav, un aria-current dentro y ninguno en los logos', async () => {
    renderAt('/help');

    await screen.findByRole('heading', { level: 1, name: 'Ayuda' });

    expect(document.querySelectorAll('nav')).toHaveLength(1);
    expect(navCurrentHrefs()).toEqual(['/help']);
    expectLogosWithoutCurrent();
  });

  it('en una ruta hija con query string activa solo el destino de círculos', async () => {
    renderAt('/circles/abc?x=1');

    await screen.findByRole('heading', { level: 1, name: 'Un círculo' });

    expect(document.querySelectorAll('nav')).toHaveLength(1);
    expect(navCurrentHrefs()).toEqual(['/circles']);
    expectLogosWithoutCurrent();
  });

  it('el clic primario del logotipo navega a /circles sin recarga completa', async () => {
    const router = renderAt('/help');

    await screen.findByRole('heading', { level: 1, name: 'Ayuda' });

    const logo = screen.getAllByRole('link', { name: 'memora' })[0];

    if (!logo) {
      throw new Error('No hay logotipo');
    }

    const dispatched = fireEvent.click(logo);

    // `preventDefault` en el clic primario: lo resuelve el router, no el navegador.
    expect(dispatched).toBe(false);

    await screen.findByRole('heading', { level: 1, name: 'Tus círculos' });

    expect(router.state.location.pathname).toBe('/circles');
    expect(screen.queryByRole('heading', { level: 1, name: 'Ayuda' })).toBeNull();
    expectLogosWithoutCurrent();
  });

  it('con modificador no intercepta el clic del logotipo', async () => {
    const router = renderAt('/help');

    await screen.findByRole('heading', { level: 1, name: 'Ayuda' });

    const logo = screen.getAllByRole('link', { name: 'memora' })[0];

    if (!logo) {
      throw new Error('No hay logotipo');
    }

    const dispatched = fireEvent.click(logo, { ctrlKey: true });

    // Sin `preventDefault` el navegador decide (nueva pestaña, etc.).
    expect(dispatched).toBe(true);
    expect(router.state.location.pathname).toBe('/help');
    expect(screen.getByRole('heading', { level: 1, name: 'Ayuda' })).toBeTruthy();
  });
});
