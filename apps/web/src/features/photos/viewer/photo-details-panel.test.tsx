import type { Role } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { testUser } from '../../../test/auth-fixtures';
import { makePhoto } from '../../../test/fixtures/photos-fixtures';

import { PhotoDetailsPanel } from './photo-details-panel';

const photo = makePhoto({
  id: 'pho_test',
  description: 'Atardecer en la playa',
  placeName: 'Deià',
});

interface RenderPanelOptions {
  readonly role?: Role;
  readonly meId?: string | null;
  readonly canDownload?: boolean;
}

function renderPanel(options: RenderPanelOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const rootRoute = createRootRoute({
    component: function PanelRoute() {
      return (
        <PhotoDetailsPanel
          photo={photo}
          circleId="cir_familia"
          albumId="alb_verano"
          circleRole={options.role ?? 'member'}
          meId={options.meId === undefined ? testUser.id : options.meId}
          canDownload={options.canDownload ?? false}
          onDeleted={() => undefined}
          className="flex flex-col"
        />
      );
    },
  });

  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    context: { queryClient },
    scrollRestoration: false,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { queryClient, router };
}

describe('PhotoDetailsPanel · disposición', () => {
  it('muestra autoría arriba, datos en el centro y acciones al final', async () => {
    renderPanel();

    const details = await screen.findByTestId('photo-viewer-details');

    expect(within(details).getByText('Sofía Martín')).toBeTruthy();
    expect(within(details).getByText(/Subida el/)).toBeTruthy();
    expect(within(details).getByText('Atardecer en la playa')).toBeTruthy();
    expect(within(details).getByText('Deià')).toBeTruthy();

    const content = within(details).getByTestId('photo-details-content');
    const actions = within(details).getByTestId('photo-details-actions');

    expect(content.className).toContain('flex-1');
    expect(actions.className).toContain('mt-auto');
    expect(actions.className).toContain('border-t');

    expect(within(actions).getByRole('button', { name: 'Editar datos de la foto' })).toBeTruthy();
    expect(within(actions).getByRole('button', { name: 'Eliminar foto' })).toBeTruthy();

    // El orden del DOM decide el de tabulación: datos y después acciones.
    expect(content.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  });

  it('mantiene el orden de tabulación de acciones: Editar y luego Eliminar', async () => {
    const user = userEvent.setup();
    renderPanel();

    await screen.findByTestId('photo-viewer-details');

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Editar datos de la foto' }),
    );

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Eliminar foto' }));
  });

  it('oculta la fila de acciones mientras se edita, porque el formulario tiene las suyas', async () => {
    const user = userEvent.setup();
    renderPanel();

    const details = await screen.findByTestId('photo-viewer-details');
    await user.click(within(details).getByRole('button', { name: 'Editar datos de la foto' }));

    expect(await screen.findByTestId('photo-metadata-form')).toBeTruthy();
    expect(within(details).queryByTestId('photo-details-actions')).toBeNull();
    expect(within(details).queryByTestId('photo-details-content')).toBeNull();
  });

  it('no muestra acciones a quien no puede editar ni borrar', async () => {
    renderPanel({ meId: 'usr_otro', role: 'member' });

    const details = await screen.findByTestId('photo-viewer-details');

    expect(within(details).queryByTestId('photo-details-actions')).toBeNull();
    expect(within(details).queryByRole('button', { name: 'Editar datos de la foto' })).toBeNull();
    expect(within(details).queryByRole('button', { name: 'Eliminar foto' })).toBeNull();
  });
});

describe('PhotoDetailsPanel · descarga', () => {
  it('enlaza el original con `download` cuando hay permiso', async () => {
    renderPanel({ canDownload: true });

    const link = await screen.findByRole('link', { name: 'Descargar foto original' });

    expect(link.getAttribute('href')).toBe('/api/photos/pho_test/download');
    expect(link.hasAttribute('download')).toBe(true);
  });

  it('no muestra la descarga sin permiso', async () => {
    renderPanel({ canDownload: false });

    const details = await screen.findByTestId('photo-viewer-details');

    expect(within(details).queryByRole('link', { name: 'Descargar foto original' })).toBeNull();
  });
});
