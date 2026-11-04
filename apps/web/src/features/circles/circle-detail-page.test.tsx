import { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { renderWithRouter } from '../../test/circles-harness';
import { circleDetail, circleWithCover, testMeResponse } from '../../test/circles-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';

import { CircleDetailPage } from './circle-detail-page';
import { circleKeys } from './queries';

const server = createAuthTestServer();
const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const CIRCLES_URL = `${AUTH_TEST_API_BASE}/circles`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const LOGOUT_URL = `${AUTH_TEST_API_BASE}/auth/logout`;
const DETAIL_URL = `${CIRCLES_URL}/cir_familia`;

type ObserverCallback = IntersectionObserverCallback;

let observerCallback: ObserverCallback | null = null;

class FakeIntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: readonly number[] = [];

  constructor(callback: ObserverCallback) {
    observerCallback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
  observerCallback = null;
  vi.unstubAllGlobals();
});

afterAll(() => {
  server.close();
});

function useDetail(stats: Parameters<typeof circleDetail>[1] = {}) {
  server.use(http.get(DETAIL_URL, () => HttpResponse.json(circleDetail(circleWithCover, stats))));
}

function useNoAccess() {
  server.use(
    http.get(DETAIL_URL, () =>
      HttpResponse.json(
        { code: 'NOT_FOUND', message: 'No encontramos lo que buscas.', details: null },
        { status: 404 },
      ),
    ),
    http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
  );
}

function useLogout() {
  let csrfHeader: string | null = null;

  server.use(
    http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-logout' })),
    http.post(LOGOUT_URL, ({ request }) => {
      csrfHeader = request.headers.get('x-csrf-token');
      return new HttpResponse(null, { status: 204 });
    }),
  );

  return () => csrfHeader;
}

describe('CircleDetailPage', () => {
  it('anuncia la carga con aria-busy y después pinta el héroe', async () => {
    server.use(
      http.get(DETAIL_URL, async () => {
        await delay(80);
        return HttpResponse.json(circleDetail(circleWithCover));
      }),
    );

    const { container } = renderWithRouter(<CircleDetailPage circleId="cir_familia" />);

    expect(await screen.findByText('Cargando el círculo…')).toBeTruthy();
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 1, name: 'Familia García' })).toBeNull();

    expect(await screen.findByRole('heading', { level: 1, name: 'Familia García' })).toBeTruthy();
  });

  it('muestra nombre, stats, acciones deshabilitadas y pestañas', async () => {
    useDetail({ membersCount: 8, albumsCount: 3, photosCount: 1240 });

    const { container } = renderWithRouter(<CircleDetailPage circleId="cir_familia" />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Familia García' })).toBeTruthy();
    expect(screen.getByText('8 personas · 3 álbumes · 1.240 fotos')).toBeTruthy();
    expect(screen.getByText(/Última subida:/)).toBeTruthy();

    const invite = screen.getByRole('button', { name: /^Invitar/ });
    const newAlbum = screen.getByRole('button', { name: /^Nuevo álbum/ });

    expect((invite as HTMLButtonElement).disabled).toBe(true);
    expect((newAlbum as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByText('Invitar y crear álbumes llegarán en próximas versiones.'),
    ).toBeTruthy();

    const albums = screen.getByRole('tab', { name: /Álbumes/ });
    const people = screen.getByRole('tab', { name: /Personas/ });
    const settings = screen.getByRole('tab', { name: /Ajustes/ });

    expect(albums.getAttribute('aria-selected')).toBe('true');
    expect((people as HTMLButtonElement).disabled).toBe(true);
    expect((settings as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Personas y Ajustes estarán disponibles próximamente.')).toBeTruthy();

    expect(screen.getByText('La lista de álbumes estará disponible próximamente')).toBeTruthy();
    expect(screen.getByText(/Este círculo tiene 3 álbumes/)).toBeTruthy();
    expect(screen.queryByText('Todavía no hay álbumes')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Ruta del círculo' })).toBeTruthy();
    expect(container.textContent).not.toMatch(/F2[248]/);

    await expectNoAxeViolations(container);
  });

  it('muestra el estado vacío real de álbumes', async () => {
    useDetail({ albumsCount: 0 });

    renderWithRouter(<CircleDetailPage circleId="cir_familia" />);

    expect(await screen.findByText('Todavía no hay álbumes')).toBeTruthy();
    expect(
      screen.getByText(
        'Crea el primer álbum del viaje o invita a quienes fueron para que aporten sus fotos.',
      ),
    ).toBeTruthy();

    const create = screen.getByRole('button', { name: /^Crear el primer álbum/ });

    expect((create as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('La creación de álbumes estará disponible próximamente.')).toBeTruthy();
    expect(screen.queryByText(/F2[248]/)).toBeNull();
  });

  it('un 404 no filtra datos cacheados y ofrece cambiar de cuenta', async () => {
    useNoAccess();

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    queryClient.setQueryData(circleKeys.detail('cir_familia'), circleDetail(circleWithCover));

    const { container } = renderWithRouter(
      <CircleDetailPage circleId="cir_familia" />,
      '/circles/cir_familia',
      { queryClient },
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No tienes acceso a este círculo' }),
    ).toBeTruthy();

    expect(screen.queryByText('Familia García')).toBeNull();
    expect(screen.queryByText(/Las fotos de casa/)).toBeNull();
    expect(await screen.findByText('Has entrado como sofia@example.com')).toBeTruthy();

    const back = screen.getByRole('link', { name: 'Ir a mis círculos' });
    expect(back.getAttribute('href')).toBe('/circles');
    expect(screen.getByRole('button', { name: 'Entrar con otra cuenta' })).toBeTruthy();

    await expectNoAxeViolations(container);
  });

  it('cierra sesión con CSRF, limpia la caché y conserva el destino', async () => {
    useNoAccess();
    const csrfHeader = useLogout();

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    const clearSpy = vi.spyOn(queryClient, 'clear');
    const user = userEvent.setup();

    const { router } = renderWithRouter(
      <CircleDetailPage circleId="cir_familia" />,
      '/circles/cir_familia',
      { queryClient },
    );

    await screen.findByText('Has entrado como sofia@example.com');
    await user.click(screen.getByRole('button', { name: 'Entrar con otra cuenta' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });

    expect(csrfHeader()).toBe('csrf-logout');
    expect(clearSpy).toHaveBeenCalled();
    expect(router.state.location.search).toEqual({ redirect: '/circles/cir_familia' });
  });

  it('muestra un error recuperable si el detalle falla con 500', async () => {
    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Fallo interno', details: null },
          { status: 500 },
        ),
      ),
    );

    renderWithRouter(<CircleDetailPage circleId="cir_familia" />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No hemos podido cargar el círculo' }),
    ).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/Código del error: HTTP-500/)).toBeTruthy();

    const help = screen.getByRole('link', { name: 'Ver la ayuda' });
    expect(help.getAttribute('href')).toBe('/help');

    useDetail();

    screen.getByRole('button', { name: 'Reintentar' }).click();

    expect(await screen.findByRole('heading', { level: 1, name: 'Familia García' })).toBeTruthy();
  });

  it('un 401 usa el helper de sesión y vuelve a /login', async () => {
    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json(
          { code: 'UNAUTHENTICATED', message: 'Inicia sesión para continuar.', details: null },
          { status: 401 },
        ),
      ),
    );

    const { router } = renderWithRouter(
      <CircleDetailPage circleId="cir_familia" />,
      '/circles/cir_familia',
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(router.state.location.search).toEqual({ redirect: '/circles/cir_familia' });
  });

  it('muestra el toast de círculo creado y enfoca el h1', async () => {
    const freshCircle = {
      ...circleWithCover,
      createdAt: new Date().toISOString(),
    };
    const onCreatedToastClose = vi.fn();

    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json(
          circleDetail(freshCircle, {
            membersCount: 1,
            albumsCount: 0,
            photosCount: 0,
            lastUploadAt: null,
          }),
        ),
      ),
    );

    renderWithRouter(
      <CircleDetailPage circleId="cir_familia" created onCreatedToastClose={onCreatedToastClose} />,
      '/circles/cir_familia',
    );

    const title = await screen.findByRole('heading', { level: 1, name: 'Familia García' });

    await waitFor(() => {
      expect(document.activeElement).toBe(title);
    });
    expect(screen.getByText('Círculo creado')).toBeTruthy();
    expect(screen.getByText('Ya puedes invitar a tu gente.')).toBeTruthy();
    expect(screen.getByText('Solo tú, de momento · Creado hoy')).toBeTruthy();
    expect(screen.queryByText(/1 persona · 0 álbumes/)).toBeNull();
    expect(screen.queryByText(/Última subida:/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(onCreatedToastClose).toHaveBeenCalledTimes(1);
  });

  it('abre el detalle con la caché del N+1 sin repetir la petición', async () => {
    let detailCalls = 0;

    server.use(
      http.get(DETAIL_URL, () => {
        detailCalls += 1;
        return HttpResponse.json(circleDetail(circleWithCover));
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
    });
    queryClient.setQueryData(circleKeys.detail('cir_familia'), circleDetail(circleWithCover));

    renderWithRouter(<CircleDetailPage circleId="cir_familia" />, '/circles/cir_familia', {
      queryClient,
    });

    expect(await screen.findByRole('heading', { level: 1, name: 'Familia García' })).toBeTruthy();
    expect(detailCalls).toBe(0);
  });

  it('activa la cabecera compacta al salir el héroe y mantiene un solo h1', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    expect(globalThis.IntersectionObserver).toBe(FakeIntersectionObserver);
    useDetail();

    renderWithRouter(<CircleDetailPage circleId="cir_familia" />);

    await screen.findByRole('heading', { level: 1, name: 'Familia García' });
    expect(document.querySelector('[data-circle-compact-header]')).toBeNull();
    await waitFor(() => {
      expect(observerCallback).not.toBeNull();
    });

    act(() => {
      observerCallback?.(
        [{ isIntersecting: false, boundingClientRect: { top: -120 } } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    await waitFor(() => {
      expect(document.querySelector('[data-circle-compact-header]')).not.toBeNull();
    });

    const compactHeader = document.querySelector('[data-circle-compact-header]');
    const title = screen.getByRole('heading', { level: 1 });

    expect(compactHeader?.className).toContain('lg:hidden');
    expect(compactHeader?.firstElementChild?.className).toContain('min-h-16');
    expect(compactHeader?.firstElementChild?.className).toContain('safe-area-inset-left');
    expect(compactHeader?.firstElementChild?.className).toContain('safe-area-inset-right');
    expect(
      ((compactHeader?.compareDocumentPosition(title) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING) !==
        0,
    ).toBe(true);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

    act(() => {
      observerCallback?.(
        [{ isIntersecting: true, boundingClientRect: { top: 80 } } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    await waitFor(() => {
      expect(document.querySelector('[data-circle-compact-header]')).toBeNull();
    });
  });
});
