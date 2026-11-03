import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { Route as ProfileRoute } from '../../routes/_app.profile';

const ProfilePage = ProfileRoute.options.component;

if (typeof ProfilePage !== 'function') {
  throw new Error('La ruta /profile no tiene componente');
}

const rootRoute = createRootRoute({ component: Outlet });

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const helpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/help',
  component: () => null,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/privacy',
  component: () => null,
});

const routeTree = rootRoute.addChildren([profileRoute, helpRoute, privacyRoute]);

function renderProfile() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/profile'] }),
    scrollRestoration: false,
  });

  return render(<RouterProvider router={router} />);
}

function isBefore(first: Node, second: Node): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe('Perfil provisional', () => {
  it('ordena cabecera, instalación, accesos y aviso', async () => {
    renderProfile();

    const heading = await screen.findByRole('heading', { level: 1, name: 'Perfil' });
    const install = screen.getByRole('heading', { level: 2, name: 'Instala Memora' });
    const quickLinks = screen.getByRole('navigation', { name: 'Más secciones' });
    const notice = screen.getByText(/entrega próxima/i);

    expect(isBefore(heading, install)).toBe(true);
    expect(isBefore(install, quickLinks)).toBe(true);
    expect(isBefore(quickLinks, notice)).toBe(true);
  });

  it('tiene un único h1 y los enlaces de Ayuda y Privacidad', async () => {
    renderProfile();

    await screen.findByRole('heading', { level: 1, name: 'Perfil' });

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

    const quickLinks = screen.getByRole('navigation', { name: 'Más secciones' });
    const links = within(quickLinks).getAllByRole('link');

    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/help', '/privacy']);
    expect(quickLinks.className).toContain('lg:hidden');

    for (const link of links) {
      expect(link.className).toContain('min-h-14');
      expect(link.className).toContain('bg-surface');
      expect(link.className).toContain('border-border');
    }
  });

  it('usa el contenedor de 80rem con sus gutters', async () => {
    const { container } = renderProfile();

    await screen.findByRole('heading', { level: 1, name: 'Perfil' });

    const box = container.querySelector<HTMLElement>('.max-w-7xl');

    expect(box?.className).toContain('px-6');
    expect(box?.className).toContain('lg:px-8');
    expect(box?.className).not.toMatch(/max-w-\[|px-\[/);
  });

  it('monta la fila de instalación solo por debajo de lg', async () => {
    const { container } = renderProfile();

    await screen.findByRole('heading', { level: 1, name: 'Perfil' });

    const row = container.querySelector('section[aria-labelledby="install-app-title"]');

    expect(row?.className).toContain('lg:hidden');
  });

  it('no tiene violaciones de axe', async () => {
    const { container } = renderProfile();

    await screen.findByRole('heading', { level: 1, name: 'Perfil' });

    await expectNoAxeViolations(container);
  });
});
