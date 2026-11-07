import type { PhotoDto, Role } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { AUTH_TEST_API_BASE, testUser } from '../../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../../test/auth-server';
import { makePhoto } from '../../../test/fixtures/photos-fixtures';
import { defaultMembers, lucasMember } from '../../members/members-fixtures';

import { PhotoDetailsPanel } from './photo-details-panel';

const server = createAuthTestServer();
const MEMBERS_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia/members`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const TAGS_URL = `${AUTH_TEST_API_BASE}/photos/pho_test/tags`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

const photo = makePhoto({
  id: 'pho_test',
  description: 'Atardecer en la playa',
  placeName: 'Deià',
});

interface RenderPanelOptions {
  readonly role?: Role;
  readonly meId?: string | null;
  readonly canDownload?: boolean;
  readonly canTag?: boolean;
  readonly circleName?: string;
  readonly photo?: PhotoDto;
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
          photo={options.photo ?? photo}
          circleId="cir_familia"
          albumId="alb_verano"
          circleRole={options.role ?? 'member'}
          meId={options.meId === undefined ? testUser.id : options.meId}
          canDownload={options.canDownload ?? false}
          canTag={options.canTag ?? false}
          circleName={options.circleName ?? 'Familia García'}
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
    expect(within(details).queryByRole('button', { name: 'Etiquetar personas' })).toBeNull();
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

describe('PhotoDetailsPanel · etiquetas', () => {
  it('ofrece etiquetar cuando la cuenta tiene permiso', async () => {
    renderPanel({ canTag: true });

    const details = await screen.findByTestId('photo-viewer-details');

    expect(within(details).getByRole('button', { name: 'Etiquetar personas' })).toBeTruthy();
  });

  it('no ofrece etiquetar sin permiso', async () => {
    renderPanel({ canTag: false });

    const details = await screen.findByTestId('photo-viewer-details');

    expect(within(details).queryByRole('button', { name: 'Etiquetar personas' })).toBeNull();
  });

  it('anuncia «Etiquetas guardadas.» en la región viva tras guardar', async () => {
    const user = userEvent.setup();

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-token' })),
      http.get(MEMBERS_URL, () => HttpResponse.json({ items: defaultMembers, nextCursor: null })),
      http.post(TAGS_URL, () =>
        HttpResponse.json(
          {
            id: 'tag_lucas',
            photoId: 'pho_test',
            user: lucasMember.user,
            createdAt: '2026-11-07T10:00:00.000Z',
          },
          { status: 201 },
        ),
      ),
    );

    renderPanel({ canTag: true });

    const details = await screen.findByTestId('photo-viewer-details');

    await user.click(within(details).getByRole('button', { name: 'Etiquetar personas' }));

    const dialog = await screen.findByRole('dialog', { name: 'Etiquetar personas' });

    await user.click(await within(dialog).findByRole('checkbox', { name: 'Lucas Vidal' }));
    await user.click(within(dialog).getByRole('button', { name: 'Guardar etiquetas' }));

    const status = await within(details).findByText('Etiquetas guardadas.');

    expect(status.closest('[role="status"]')?.getAttribute('aria-live')).toBe('polite');
  });

  it('lista las personas etiquetadas en el panel', async () => {
    renderPanel({
      canTag: true,
      photo: makePhoto({
        id: 'pho_test',
        tags: [
          { id: 'usr_lucas', name: 'Lucas Vidal', avatarUrl: null },
          { id: 'usr_laura', name: 'Laura Moreno', avatarUrl: null },
        ],
      }),
    });

    const details = await screen.findByTestId('photo-viewer-details');

    expect(within(details).getByRole('heading', { name: 'Personas etiquetadas' })).toBeTruthy();

    const items = within(details).getAllByRole('listitem');

    expect(items[0]?.textContent).toContain('Lucas Vidal');
    expect(items[1]?.textContent).toContain('Laura Moreno');
  });
});
