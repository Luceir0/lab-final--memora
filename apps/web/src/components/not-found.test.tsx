import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { NotFound } from './not-found';

function renderWithRouter(children: ReactNode): void {
  const rootRoute = createRootRoute({ component: () => <>{children}</> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    scrollRestoration: false,
  });

  render(<RouterProvider router={router} />);
}

describe('NotFound', () => {
  it('explica el 404 y enlaza a la portada', async () => {
    renderWithRouter(<NotFound />);

    const heading = await screen.findByRole('heading', {
      level: 1,
      name: 'Página no encontrada',
    });
    expect(document.activeElement).toBe(heading);
    expect(screen.getByText(/la página ya no existe/i)).toBeTruthy();

    const homeLink = screen.getByRole('link', { name: 'Volver al inicio' });
    expect(homeLink.getAttribute('href')).toBe('/');
  });
});
