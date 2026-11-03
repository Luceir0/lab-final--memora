import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createQueryClient } from '../lib/query-client';
import { routeTree } from '../routeTree.gen';

import { Route as PrivacyRoute } from './_app.privacy';
import { Route as ProfileRoute } from './_app.profile';
import { Route as UploadsRoute } from './_app.uploads';

/**
 * El Perfil provisional usa `Link` para Ayuda y Privacidad. Estas pruebas
 * montan las páginas sin router, así que el `Link` real se sustituye por un
 * ancla equivalente; la navegación real se cubre en los tests de integración.
 */
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();

  return {
    ...actual,
    Link: ({
      to,
      children,
      className,
    }: {
      readonly to: string;
      readonly children?: ReactNode;
      readonly className?: string;
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

const PLACEHOLDERS = [
  { path: '/profile', title: 'Perfil', Route: ProfileRoute },
  { path: '/uploads', title: 'Subidas', Route: UploadsRoute },
  { path: '/privacy', title: 'Privacidad', Route: PrivacyRoute },
] as const;

describe('pantallas provisionales', () => {
  it.each(PLACEHOLDERS)('$path tiene título real y texto honesto', ({ title, Route }) => {
    const Page = Route.options.component;

    expect(typeof Page).toBe('function');

    if (typeof Page !== 'function') {
      throw new Error(`La ruta ${title} no tiene componente`);
    }

    render(<Page />);

    expect(screen.getByRole('heading', { level: 1, name: title })).toBeTruthy();
    expect(screen.getByText(/entrega próxima/i)).toBeTruthy();
  });

  it.each(PLACEHOLDERS)('$path resuelve a su ruta y no al 404', async ({ path }) => {
    const router = createRouter({
      routeTree,
      context: { queryClient: createQueryClient() },
      history: createMemoryHistory({ initialEntries: [path] }),
      scrollRestoration: false,
    });

    await router.load();

    const routeIds = router.state.matches.map((match) => match.routeId);

    expect(routeIds).toContain('/_app');
    expect(routeIds.at(-1)).toBe(`/_app${path}`);
  });
});
