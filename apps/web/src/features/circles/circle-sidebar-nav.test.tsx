import { QueryClient } from '@tanstack/react-query';
import { screen, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { renderWithRouter } from '../../test/circles-harness';
import { circleThird, circleWithCover, defaultCircles } from '../../test/circles-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';

import { CircleSidebarNav } from './circle-sidebar-nav';

const server = createAuthTestServer();
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

function useCircles() {
  server.use(
    http.get(CIRCLES_URL, () => HttpResponse.json({ items: defaultCircles, nextCursor: null })),
  );
}

describe('CircleSidebarNav', () => {
  it('lista los círculos y despliega el subnav del activo', async () => {
    useCircles();

    const { container } = renderWithRouter(
      <CircleSidebarNav currentPath="/circles/cir_familia" />,
      '/circles/cir_familia',
    );

    const family = await screen.findByRole('link', { name: /Familia García/ });

    expect(family.getAttribute('href')).toBe('/circles/cir_familia');
    expect(family.getAttribute('aria-current')).toBe('page');
    expect(family.className).toContain('bg-primary-soft');
    expect(screen.getByRole('link', { name: /Lisboa 2026/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Amigas de la uni/ })).toBeTruthy();

    const albums = screen.getByRole('link', { name: 'Álbumes' });
    const people = screen.getByRole('link', { name: /^Personas/ });

    expect(albums.getAttribute('href')).toBe('/circles/cir_familia');
    expect(albums.getAttribute('aria-current')).toBeNull();
    expect(albums.closest('ul')?.className).not.toContain('border-l');
    // La sección actual va en negrita, sin píldora.
    expect(albums.className).toContain('font-semibold');
    expect(albums.className).toContain('text-primary-text');
    expect(albums.className).not.toContain('bg-primary-soft');
    expect(people.getAttribute('href')).toBe('/circles/cir_familia/people');
    expect(people.getAttribute('aria-current')).toBeNull();
    expect(people.getAttribute('aria-disabled')).toBeNull();
    expect(people.className).not.toContain('font-semibold');

    await expectNoAxeViolations(container);
  });

  it('marca Personas como página activa en su sección sin duplicar aria-current', async () => {
    useCircles();

    renderWithRouter(
      <CircleSidebarNav currentPath="/circles/cir_familia/people" />,
      '/circles/cir_familia/people',
    );

    const family = await screen.findByRole('link', { name: /Familia García/ });

    // El círculo se resalta en todas sus secciones, pero el `aria-current`
    // sigue siendo único y en esta sección lo lleva Personas.
    expect(family.getAttribute('aria-current')).toBeNull();
    expect(family.className).toContain('bg-primary-soft');
    expect(family.className).toContain('font-semibold');
    expect(family.className).toContain('text-primary-text');

    const people = screen.getByRole('link', { name: /^Personas/ });

    expect(people.getAttribute('href')).toBe('/circles/cir_familia/people');
    expect(people.getAttribute('aria-current')).toBe('page');
    expect(people.className).toContain('font-semibold');
    expect(people.className).toContain('text-primary-text');
    expect(people.className).not.toContain('bg-primary-soft');
    expect(people.getAttribute('aria-disabled')).toBeNull();

    const albums = screen.getByRole('link', { name: 'Álbumes' });

    expect(albums.getAttribute('aria-current')).toBeNull();
    expect(albums.className).not.toContain('font-semibold');
    expect(albums.className).not.toContain('bg-primary-soft');
    expect(
      screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page'),
    ).toHaveLength(1);
  });

  it('marca Álbumes como página activa dentro de un álbum sin duplicar aria-current', async () => {
    useCircles();

    renderWithRouter(<CircleSidebarNav currentPath="/circles/cir_familia/albums/alb_verano" />);

    const family = await screen.findByRole('link', { name: /Familia García/ });

    // El círculo se resalta, pero dentro de un álbum no es la página actual.
    expect(family.getAttribute('aria-current')).toBeNull();
    expect(family.className).toContain('bg-primary-soft');
    expect(family.className).toContain('font-semibold');
    expect(family.className).toContain('text-primary-text');

    const albums = screen.getByRole('link', { name: 'Álbumes' });

    expect(albums.getAttribute('href')).toBe('/circles/cir_familia');
    expect(albums.getAttribute('aria-current')).toBe('page');
    expect(albums.className).toContain('font-semibold');
    expect(albums.className).toContain('text-primary-text');
    expect(albums.className).not.toContain('bg-primary-soft');

    expect(
      screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page'),
    ).toHaveLength(1);
  });

  it('lleva a Ajustes con un enlace real y marca la sección activa', async () => {
    useCircles();

    renderWithRouter(<CircleSidebarNav currentPath="/circles/cir_familia/settings" />);

    await screen.findByRole('link', { name: /Familia García/ });

    const item = screen.getByRole('link', { name: /^Ajustes/ });

    expect(item.getAttribute('aria-disabled')).toBeNull();
    expect(item.getAttribute('href')).toBe('/circles/cir_familia/settings');
    expect(item.getAttribute('aria-current')).toBe('page');
    expect(item.className).toContain('font-semibold');
    expect(
      screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page'),
    ).toHaveLength(1);
  });

  it('no muestra subnav fuera de un círculo', async () => {
    useCircles();

    renderWithRouter(<CircleSidebarNav currentPath="/circles" />);

    const family = await screen.findByRole('link', { name: /Familia García/ });

    expect(family.getAttribute('aria-current')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Álbumes' })).toBeNull();
  });

  it('usa todas las páginas cargadas para encontrar el círculo activo', async () => {
    useCircles();

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
    });
    queryClient.setQueryData(['circles', 'list'], {
      pages: [
        { items: [circleWithCover], nextCursor: 'cursor-2' },
        { items: [circleThird], nextCursor: null },
      ],
      pageParams: [null, 'cursor-2'],
    });

    renderWithRouter(<CircleSidebarNav currentPath="/circles/cir_amigas" />, '/', {
      queryClient,
    });

    const active = await screen.findByRole('link', { name: /Amigas de la uni/ });

    expect(active.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Álbumes' })).toBeTruthy();
  });

  it('no deja enlaces duplicados en la lista de círculos', async () => {
    useCircles();

    renderWithRouter(<CircleSidebarNav currentPath="/circles" />);

    const list = await screen.findByRole('list');
    const links = within(list).getAllByRole('link');

    expect(links).toHaveLength(3);
    expect(new Set(links.map((link) => link.getAttribute('href'))).size).toBe(3);
  });
});
