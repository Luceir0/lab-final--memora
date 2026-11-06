import type { PhotoDto } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { albumWithPhotos } from '../../test/fixtures/albums-fixtures';
import { circleDetail, circleWithCover, testMeResponse } from '../../test/circles-fixtures';
import { CircleDetailProvider } from '../circles/circle-detail-context';
import { UploadExitGuard } from '../uploads/upload-exit-guard';
import { UploadQueueHost } from '../uploads/upload-queue-host';
import type { UploadTransport, UploadTransportRequest } from '../uploads/transport';
import { UploadProvider } from '../uploads/upload-provider';

import { AlbumDetailPage } from './album-detail-page';

/**
 * Navegación real con el router de TanStack y el host global de la cola.
 *
 * Estar subiendo no bloquea la navegación interna: no hay diálogo de salida,
 * la cola sigue viva y el panel/barra siguen montados al cambiar de ruta.
 * Recargar o cerrar la pestaña se cubre con `beforeunload` en
 * `upload-exit-guard.test.tsx`; jsdom no dispara el diálogo nativo.
 */

const server = createAuthTestServer();

const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const CIRCLE_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia`;
const ALBUMS_URL = `${CIRCLE_URL}/albums`;
const INVITATIONS_URL = `${CIRCLE_URL}/invitations`;
const ALBUM_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano`;
const ALBUM_PATH = '/circles/cir_familia/albums/alb_verano';

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

interface HangingTransport {
  readonly requests: UploadTransportRequest[];
  readonly transport: UploadTransport;
}

function hangingTransport(): HangingTransport {
  const requests: UploadTransportRequest[] = [];

  const upload: UploadTransport['upload'] = (request) => {
    requests.push(request);

    return new Promise<PhotoDto>(() => {});
  };

  return { requests, transport: { upload } };
}

function useAlbumApi(): void {
  const circle = circleDetail(circleWithCover);

  server.use(
    http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
    http.get(CIRCLE_URL, () => HttpResponse.json(circle)),
    http.get(INVITATIONS_URL, () => HttpResponse.json({ items: [], nextCursor: null })),
    http.get(ALBUMS_URL, () => HttpResponse.json({ items: [albumWithPhotos], nextCursor: null })),
    http.get(ALBUM_URL, () => HttpResponse.json(albumWithPhotos)),
    http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-exit' })),
  );
}

function renderWithGlobalQueue(transport: UploadTransport) {
  const circle = circleDetail(circleWithCover);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, refetchOnWindowFocus: false },
    },
  });

  const rootRoute = createRootRoute({
    component: function Root() {
      return (
        <UploadProvider transport={transport}>
          <UploadExitGuard />
          <UploadQueueHost />
          <Outlet />
        </UploadProvider>
      );
    },
  });

  const circlesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles',
    component: function CirclesRoute() {
      return <h1>Mis círculos</h1>;
    },
  });

  const albumRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/circles/$circleId/albums/$albumId',
    component: function AlbumRoute() {
      return (
        <CircleDetailProvider
          circle={circle}
          openInvite={vi.fn()}
          focusTitle={vi.fn()}
          canCreateAlbum
        >
          <main id="main-content" tabIndex={-1}>
            <AlbumDetailPage circleId={circle.id} albumId="alb_verano" />
          </main>
        </CircleDetailProvider>
      );
    },
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([circlesRoute, albumRoute]),
    history: createMemoryHistory({ initialEntries: [ALBUM_PATH] }),
    context: { queryClient },
    scrollRestoration: false,
  });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { ...view, router };
}

async function startUpload(fake: HangingTransport): Promise<void> {
  await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

  const galleryInputs = screen.getAllByLabelText('Elegir fotos de la galería');
  const firstInput = galleryInputs[0];

  if (firstInput === undefined) {
    throw new Error('No se ha montado el selector de galería');
  }

  await userEvent.upload(firstInput, new File(['contenido'], 'playa.jpg', { type: 'image/jpeg' }));

  await waitFor(() => expect(fake.requests).toHaveLength(1));
}

async function navigateToCircles(
  router: ReturnType<typeof renderWithGlobalQueue>['router'],
): Promise<void> {
  await act(async () => {
    await router.navigate({ to: '/circles' });
  });
}

describe('UploadExitGuard · navegación real sin bloqueo', () => {
  it('navega con el panel abierto sin diálogo y mantiene cola, panel y barra', async () => {
    useAlbumApi();
    const fake = hangingTransport();
    const { router } = renderWithGlobalQueue(fake.transport);

    await startUpload(fake);

    expect(await screen.findByRole('heading', { name: 'Subidas' })).toBeTruthy();

    await navigateToCircles(router);

    expect(router.state.location.pathname).toBe('/circles');
    expect(screen.getByRole('heading', { level: 1, name: 'Mis círculos' })).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'Hay subidas en curso' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Subidas' })).toBeTruthy();
    expect(fake.requests[0]?.signal.aborted).toBe(false);

    const bar = screen.getByRole('button', { name: /Abrir subidas\./ });

    expect(bar.closest('[inert]')).not.toBeNull();
  });

  it('con el panel cerrado la barra sigue visible y usable en la nueva ruta', async () => {
    useAlbumApi();
    const fake = hangingTransport();
    const { router } = renderWithGlobalQueue(fake.transport);

    await startUpload(fake);

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar' }));

    const bar = await screen.findByRole('button', { name: /Abrir subidas\./ });

    await navigateToCircles(router);

    expect(router.state.location.pathname).toBe('/circles');
    expect(screen.queryByRole('dialog', { name: 'Hay subidas en curso' })).toBeNull();
    expect(bar.isConnected).toBe(true);
    expect(bar.closest('[inert]')).toBeNull();
    expect(bar.getAttribute('aria-expanded')).toBe('false');
    expect(fake.requests[0]?.signal.aborted).toBe(false);
  });

  it('sin subidas activas la navegación no muestra ningún diálogo', async () => {
    useAlbumApi();
    const fake = hangingTransport();
    const { router } = renderWithGlobalQueue(fake.transport);

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });
    expect(fake.requests).toHaveLength(0);

    await navigateToCircles(router);

    expect(router.state.location.pathname).toBe('/circles');
    expect(screen.queryByRole('dialog', { name: 'Hay subidas en curso' })).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Mis círculos' })).toBeTruthy();
  });
});
