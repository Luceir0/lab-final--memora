import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, delay, http } from 'msw';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_TEST_API_BASE } from '../../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../../test/auth-server';
import { albumWithPhotos } from '../../../test/fixtures/albums-fixtures';
import { galleryPhotos } from '../../../test/fixtures/photos-fixtures';

import { rememberViewerOrigin } from './origin';
import { PhotoViewer } from './photo-viewer';
import { registerPhotoSelectionClear, resetPhotoSelectionBridge } from './selection-bridge';

const server = createAuthTestServer();
const ALBUM_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano`;
const ALBUM_PHOTOS_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano/photos`;
const PHOTO_URL = `${AUTH_TEST_API_BASE}/photos/:photoId`;
const VIEWER_PATH = '/circles/cir_familia/albums/alb_verano/photos/pho_playa';

beforeAll(() => {
  startAuthTestServer(server);
});

beforeEach(() => {
  resetPhotoSelectionBridge();
});

afterEach(() => {
  server.resetHandlers();
  resetPhotoSelectionBridge();
  vi.restoreAllMocks();
});

afterAll(() => {
  server.close();
});

function useViewerApi(options: { readonly missingPhoto?: boolean } = {}) {
  server.use(
    http.get(ALBUM_URL, () => HttpResponse.json(albumWithPhotos)),
    http.get(ALBUM_PHOTOS_URL, () => HttpResponse.json({ items: galleryPhotos, nextCursor: null })),
    http.get(PHOTO_URL, ({ params }) => {
      if (options.missingPhoto) {
        return HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 });
      }

      const photo = galleryPhotos.find((item) => item.id === params.photoId);

      return photo === undefined
        ? HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
        : HttpResponse.json(photo);
    }),
  );
}

function renderViewer(options: { readonly initialPath?: string } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, refetchOnWindowFocus: false },
    },
  });
  const rootRoute = createRootRoute({ component: Outlet });
  const albumRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles/$circleId/albums/$albumId',
    component: function AlbumRoute() {
      return (
        <div>
          <p data-testid="album-route">Álbum</p>
          <button type="button" data-photo-tile="pho_playa">
            Miniatura de origen
          </button>
          <Outlet />
        </div>
      );
    },
  });
  const viewerRoute = createRoute({
    getParentRoute: () => albumRoute,
    path: 'photos/$photoId',
    component: function ViewerRoute() {
      const { circleId, albumId, photoId } = viewerRoute.useParams();

      return <PhotoViewer circleId={circleId} albumId={albumId} photoId={photoId} />;
    },
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([albumRoute.addChildren([viewerRoute])]),
    history: createMemoryHistory({ initialEntries: [options.initialPath ?? VIEWER_PATH] }),
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

describe('PhotoViewer', () => {
  it('monta una sola estructura fullscreen/modal y enfoca el cierre', async () => {
    useViewerApi();
    renderViewer();

    const viewer = await screen.findByTestId('photo-viewer');

    expect(viewer.className).toContain('fixed');
    expect(viewer.className).toContain('inset-0');
    expect(viewer.className).toContain('md:bg-viewer-bg/95');
    expect(viewer.getAttribute('aria-modal')).toBe('true');

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar el visor' }));
    });
  });

  it('muestra autor, fecha y lugar en el panel de detalles', async () => {
    useViewerApi();
    renderViewer({ initialPath: '/circles/cir_familia/albums/alb_verano/photos/pho_cena' });

    const details = await screen.findByTestId('photo-viewer-details');

    expect(details.textContent).toContain('Sofía Martín');
    expect(details.textContent).toContain('Deià');
    expect(details.textContent).toContain('Subida el');
    expect(details.textContent).toMatch(/2 de agosto de 2026/);
  });

  it('navega con las flechas y anuncia la posición', async () => {
    useViewerApi();
    const { router } = renderViewer();

    expect(await screen.findByText(/1 de 342/)).toBeTruthy();

    fireEvent.keyDown(document, { key: 'ArrowRight' });

    expect(await screen.findByText(/2 de 342/)).toBeTruthy();
    expect(router.state.location.pathname).toBe(
      '/circles/cir_familia/albums/alb_verano/photos/pho_cena',
    );
    expect((await screen.findByTestId('photo-viewer-details')).textContent).toContain('Deià');

    fireEvent.keyDown(document, { key: 'ArrowLeft' });

    expect(await screen.findByText(/1 de 342/)).toBeTruthy();
  });

  it('navega con swipe y ofrece botones anterior/siguiente', async () => {
    useViewerApi();
    const { router } = renderViewer();

    const media = await screen.findByTestId('photo-viewer-media');

    expect(screen.getByRole('button', { name: 'Foto anterior' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Foto siguiente' })).toHaveProperty(
      'disabled',
      false,
    );

    fireEvent.touchStart(media, { touches: [{ clientX: 220, clientY: 120 }] });
    fireEvent.touchEnd(media, { changedTouches: [{ clientX: 120, clientY: 120 }] });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        '/circles/cir_familia/albums/alb_verano/photos/pho_cena',
      );
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Foto anterior' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(VIEWER_PATH);
    });
  });

  it('el primer Escape limpia la selección y el segundo cierra', async () => {
    useViewerApi();
    const clearSelection = vi.fn();
    const unregister = registerPhotoSelectionClear(clearSelection);
    const { router } = renderViewer();

    await screen.findByTestId('photo-viewer');

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar el visor' }));
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(clearSelection).toHaveBeenCalledTimes(1);
    expect(router.state.location.pathname).toBe(VIEWER_PATH);
    expect(screen.getByTestId('photo-viewer')).toBeTruthy();

    unregister();
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles/cir_familia/albums/alb_verano');
    });
    expect(screen.queryByTestId('photo-viewer')).toBeNull();
  });

  it('al cerrar vuelve al álbum y devuelve el foco a la miniatura de origen', async () => {
    useViewerApi();
    rememberViewerOrigin('pho_playa');
    const { router } = renderViewer();

    await screen.findByTestId('photo-viewer');
    expect(screen.getByTestId('album-route')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar el visor' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles/cir_familia/albums/alb_verano');
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Miniatura de origen' }),
      );
    });
  });

  it('muestra «imagen no disponible» si el binario falla y conserva los detalles', async () => {
    useViewerApi();
    renderViewer();

    const image = await screen.findByAltText(/Atardecer en la playa/);

    fireEvent.error(image);

    expect(await screen.findByText('Esta imagen no está disponible')).toBeTruthy();
    expect(screen.getByTestId('photo-viewer-details').textContent).toContain('Sofía Martín');
  });

  it('muestra «foto no disponible» si el detalle responde 404', async () => {
    useViewerApi({ missingPhoto: true });
    renderViewer();

    expect(await screen.findByText('Esta foto ya no está disponible')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ver la siguiente' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Volver al álbum' })).toBeTruthy();
  });

  it('muestra un esqueleto con aria-busy mientras carga el detalle', async () => {
    server.use(
      http.get(ALBUM_URL, () => HttpResponse.json(albumWithPhotos)),
      http.get(ALBUM_PHOTOS_URL, () =>
        HttpResponse.json({ items: galleryPhotos, nextCursor: null }),
      ),
      http.get(PHOTO_URL, async ({ params }) => {
        await delay(200);
        const photo = galleryPhotos.find((item) => item.id === params.photoId);

        return photo === undefined
          ? HttpResponse.json({ code: 'NOT_FOUND' }, { status: 404 })
          : HttpResponse.json(photo);
      }),
    );

    renderViewer();

    expect(await screen.findByText(/Cargando/)).toBeTruthy();
    expect(await screen.findByText(/1 de 342/)).toBeTruthy();

    expect(await screen.findByTestId('photo-viewer-details')).toBeTruthy();
  });
});
