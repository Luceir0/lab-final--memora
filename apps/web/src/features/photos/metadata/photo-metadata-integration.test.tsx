import type { AlbumPhotosResponse, PhotoDto, Role, UpdatePhotoRequest } from '@memora/shared';
import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query';
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
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AUTH_TEST_API_BASE, testUser } from '../../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../../test/auth-server';
import { albumWithPhotos } from '../../../test/fixtures/albums-fixtures';
import { galleryPhotos } from '../../../test/fixtures/photos-fixtures';

import { PhotoViewer } from '../viewer/photo-viewer';

const server = createAuthTestServer();
const ALBUM_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano`;
const ALBUM_PHOTOS_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano/photos`;
const PHOTO_URL = `${AUTH_TEST_API_BASE}/photos/:photoId`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const VIEWER_PATH = '/circles/cir_familia/albums/alb_verano/photos/pho_playa';

function useViewerApi(options: { readonly onPatch?: () => void } = {}) {
  server.use(
    http.get(ALBUM_URL, () => HttpResponse.json(albumWithPhotos)),
    http.get(ALBUM_PHOTOS_URL, () => HttpResponse.json({ items: galleryPhotos, nextCursor: null })),
    http.get(PHOTO_URL, ({ params }) => {
      const photo = galleryPhotos.find((item) => item.id === params.photoId);

      return photo === undefined
        ? HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
        : HttpResponse.json(photo);
    }),
    http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-token' })),
    http.patch(PHOTO_URL, async ({ params, request }) => {
      options.onPatch?.();

      const body = (await request.json()) as UpdatePhotoRequest;
      const photo = galleryPhotos.find((item) => item.id === params.photoId);

      if (photo === undefined) {
        return HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 });
      }

      return HttpResponse.json({
        ...photo,
        ...body,
        updatedAt: '2026-08-05T00:00:00.000Z',
      });
    }),
  );
}

function renderViewer(options: { readonly role?: Role; readonly meId?: string | null } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  const rootRoute = createRootRoute({ component: Outlet });
  const albumRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles/$circleId/albums/$albumId',
    component: Outlet,
  });
  const viewerRoute = createRoute({
    getParentRoute: () => albumRoute,
    path: 'photos/$photoId',
    component: function ViewerRoute() {
      const { circleId, albumId, photoId } = viewerRoute.useParams();

      return (
        <PhotoViewer
          circleId={circleId}
          albumId={albumId}
          photoId={photoId}
          circleRole={options.role ?? 'member'}
          currentUserId={options.meId === undefined ? null : options.meId}
        />
      );
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([albumRoute.addChildren([viewerRoute])]),
    history: createMemoryHistory({ initialEntries: [VIEWER_PATH] }),
    context: { queryClient },
    scrollRestoration: false,
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { ...result, router, queryClient };
}

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});

afterAll(() => {
  server.close();
});

describe('PhotoDetailsPanel · metadatos', () => {
  it('muestra «Editar» al autor y actualiza panel, detalle y galería al guardar', async () => {
    const user = userEvent.setup();
    useViewerApi();
    const { queryClient } = renderViewer({ meId: testUser.id });

    const details = await screen.findByTestId('photo-viewer-details');
    const editButton = await within(details).findByRole('button', {
      name: 'Editar datos de la foto',
    });

    await user.click(editButton);

    const description = await screen.findByLabelText('Descripción (opcional)');
    await user.clear(description);
    await user.type(description, 'Nueva descripción');

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(within(details).getByText('Nueva descripción')).toBeTruthy();
    });

    expect(within(details).getByRole('status').textContent).toBe('Cambios guardados.');
    expect(screen.queryByTestId('photo-metadata-form')).toBeNull();

    const detail = queryClient.getQueryData<PhotoDto>(['photo', 'pho_playa']);
    expect(detail?.description).toBe('Nueva descripción');

    const albumPages = queryClient.getQueryData<InfiniteData<AlbumPhotosResponse>>([
      'album',
      'alb_verano',
      'photos',
      'all',
    ]);
    const albumPhoto = albumPages?.pages[0]?.items.find((item) => item.id === 'pho_playa');
    expect(albumPhoto?.description).toBe('Nueva descripción');
  });

  it('no muestra «Editar» a otro miembro', async () => {
    useViewerApi();
    renderViewer({ meId: 'usr_otro', role: 'member' });

    const details = await screen.findByTestId('photo-viewer-details');

    expect(within(details).queryByRole('button', { name: 'Editar datos de la foto' })).toBeNull();
  });

  it('muestra «Editar» al propietario del círculo aunque no sea el autor', async () => {
    useViewerApi();
    renderViewer({ meId: 'usr_otro', role: 'owner' });

    const details = await screen.findByTestId('photo-viewer-details');

    expect(
      await within(details).findByRole('button', { name: 'Editar datos de la foto' }),
    ).toBeTruthy();
  });

  it('cancelar con Escape restaura los valores originales sin cerrar el visor', async () => {
    const user = userEvent.setup();
    const onPatch = vi.fn();
    useViewerApi({ onPatch });
    renderViewer({ meId: testUser.id });

    const details = await screen.findByTestId('photo-viewer-details');
    await user.click(
      await within(details).findByRole('button', { name: 'Editar datos de la foto' }),
    );

    const description = await screen.findByLabelText('Descripción (opcional)');
    await user.clear(description);
    await user.type(description, 'Borrador que se descarta');

    fireEvent.keyDown(description, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByTestId('photo-metadata-form')).toBeNull();
    });

    expect(screen.getByTestId('photo-viewer')).toBeTruthy();
    expect(within(details).getByText('Atardecer en la playa')).toBeTruthy();
    expect(onPatch).not.toHaveBeenCalled();

    await user.click(within(details).getByRole('button', { name: 'Editar datos de la foto' }));

    expect(await screen.findByLabelText('Descripción (opcional)')).toHaveProperty(
      'value',
      'Atardecer en la playa',
    );
  });

  it('elimina la foto desde el visor con CSRF y vuelve al álbum', async () => {
    const user = userEvent.setup();
    const deletes: (string | null)[] = [];

    useViewerApi();
    server.use(
      http.delete(PHOTO_URL, ({ params, request }) => {
        deletes.push(`${String(params.photoId)}|${request.headers.get('x-csrf-token')}`);

        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { router } = renderViewer({ meId: testUser.id });
    const details = await screen.findByTestId('photo-viewer-details');

    await user.click(within(details).getByRole('button', { name: 'Eliminar foto' }));

    const dialog = await screen.findByRole('dialog', { name: 'Eliminar foto' });

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar foto' }));

    await waitFor(() => {
      expect(deletes).toEqual(['pho_playa|csrf-token']);
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles/cir_familia/albums/alb_verano');
    });

    expect(screen.queryByTestId('photo-viewer')).toBeNull();
  });

  it('mantiene el visor abierto con el error si el borrado falla', async () => {
    const user = userEvent.setup();

    useViewerApi();
    server.use(
      http.delete(PHOTO_URL, () => HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 })),
    );

    renderViewer({ meId: testUser.id });

    const details = await screen.findByTestId('photo-viewer-details');

    await user.click(within(details).getByRole('button', { name: 'Eliminar foto' }));

    const dialog = await screen.findByRole('dialog', { name: 'Eliminar foto' });

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar foto' }));

    expect(await within(dialog).findByText('No hemos podido eliminar la foto')).toBeTruthy();
    expect(screen.getByTestId('photo-viewer')).toBeTruthy();
  });
});
