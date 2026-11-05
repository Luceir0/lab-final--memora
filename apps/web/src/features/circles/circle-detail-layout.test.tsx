import type { InvitationDto } from '@memora/shared';
import { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { renderWithRouter } from '../../test/circles-harness';
import {
  circleDetail,
  circleWithCover,
  circleWithoutCover,
  testMeResponse,
} from '../../test/circles-fixtures';
import { defaultInvitations } from '../members/members-fixtures';

import { CircleDetailLayout } from './circle-detail-layout';
import { circleKeys } from './queries';

const server = createAuthTestServer();
const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const CIRCLES_URL = `${AUTH_TEST_API_BASE}/circles`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const LOGOUT_URL = `${AUTH_TEST_API_BASE}/auth/logout`;
const DETAIL_URL = `${CIRCLES_URL}/cir_familia`;
const INVITATIONS_URL = `${DETAIL_URL}/invitations`;

const CHILD_TEXT = 'Contenido de la sección';

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
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

interface LayoutOptions {
  readonly invitations?: readonly InvitationDto[];
  readonly nextCursor?: string | null;
  readonly onInvitationsRequest?: () => void;
}

function renderLayout(
  children = <p>{CHILD_TEXT}</p>,
  queryClient?: QueryClient,
  options: LayoutOptions = {},
) {
  server.use(
    http.get(INVITATIONS_URL, () => {
      options.onInvitationsRequest?.();

      return HttpResponse.json({
        items: options.invitations ?? [],
        nextCursor: options.nextCursor ?? null,
      });
    }),
  );

  return renderWithRouter(
    <CircleDetailLayout circleId="cir_familia">{children}</CircleDetailLayout>,
    '/circles/cir_familia',
    queryClient === undefined ? {} : { queryClient },
  );
}

describe('CircleDetailLayout', () => {
  it('anuncia la carga con aria-busy y no monta la sección hasta tener datos', async () => {
    server.use(
      http.get(DETAIL_URL, async () => {
        await delay(80);
        return HttpResponse.json(circleDetail(circleWithCover));
      }),
    );

    const { container } = renderLayout();

    expect(await screen.findByText('Cargando el círculo…')).toBeTruthy();
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(screen.queryByText(CHILD_TEXT)).toBeNull();

    expect(await screen.findByText(CHILD_TEXT)).toBeTruthy();
  });

  it('monta el chrome y la sección con los datos del círculo', async () => {
    useDetail();

    renderLayout();

    expect(await screen.findByText(CHILD_TEXT)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Familia García' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Secciones del círculo' })).toBeTruthy();

    const crumbs = screen.getByRole('navigation', { name: 'Ruta del círculo' });

    expect(within(crumbs).getByText('Mis círculos')).toBeTruthy();
    expect(within(crumbs).getByText('Familia García')).toBeTruthy();
    expect(within(crumbs).getByText('Álbumes')).toBeTruthy();
  });

  it('mantiene el héroe al cambiar de pestaña y actualiza aria-current', async () => {
    useDetail();

    const { router } = renderLayout();

    await screen.findByText(CHILD_TEXT);

    await act(async () => {
      await router.navigate({ href: '/circles/cir_familia/people' });
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Familia García' })).toBeTruthy();

    const sections = screen.getByRole('navigation', { name: 'Secciones del círculo' });
    const albums = within(sections).getByRole('link', { name: /Álbumes/ });
    const people = within(sections).getByRole('link', { name: /Personas/ });

    expect(albums.getAttribute('aria-current')).toBeNull();
    expect(people.getAttribute('aria-current')).toBe('page');

    const crumbs = screen.getByRole('navigation', { name: 'Ruta del círculo' });

    expect(within(crumbs).getByText('Personas')).toBeTruthy();
    expect(within(crumbs).queryByText('Álbumes')).toBeNull();
  });

  it('muestra las invitaciones pendientes del owner junto a la última subida', async () => {
    useDetail();

    renderLayout(undefined, undefined, { invitations: defaultInvitations });

    expect(await screen.findByText(/2 invitaciones pendientes/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Invitar' })).toBeTruthy();
  });

  it('sin portada omite el scrim y deja el texto del héroe en tono normal', async () => {
    server.use(http.get(DETAIL_URL, () => HttpResponse.json(circleDetail(circleWithoutCover))));

    renderLayout();

    await screen.findByText(CHILD_TEXT);

    expect(screen.queryByTestId('hero-scrim')).toBeNull();

    const title = screen.getByRole('heading', { level: 1, name: 'Lisboa 2026' });

    expect(title.className).toContain('lg:text-text');
    expect(title.className).not.toContain('lg:text-on-primary');
  });

  it('retira el scrim si la portada configurada no carga', async () => {
    useDetail();

    const { container } = renderLayout();

    await screen.findByText(CHILD_TEXT);

    const image = container.querySelector<HTMLImageElement>('section img');

    if (image === null) {
      throw new Error('El héroe debería renderizar la portada');
    }

    expect(screen.getByTestId('hero-scrim')).toBeTruthy();

    fireEvent.error(image);

    await waitFor(() => {
      expect(screen.queryByTestId('hero-scrim')).toBeNull();
    });

    const title = screen.getByRole('heading', { level: 1, name: 'Familia García' });

    expect(title.className).toContain('lg:text-text');
  });

  it('un member no ve Invitar, ni pendientes, ni pide invitaciones', async () => {
    let invitationRequests = 0;

    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json(circleDetail({ ...circleWithCover, role: 'member' })),
      ),
    );

    renderLayout(undefined, undefined, {
      onInvitationsRequest: () => {
        invitationRequests += 1;
      },
    });

    await screen.findByText(CHILD_TEXT);

    expect(screen.queryByRole('button', { name: 'Invitar' })).toBeNull();
    expect(screen.queryByText(/invitaciones pendientes/)).toBeNull();
    expect(invitationRequests).toBe(0);
  });

  it('abre el diálogo compartido desde Invitar del héroe', async () => {
    useDetail();

    renderLayout();

    await screen.findByText(CHILD_TEXT);
    fireEvent.click(screen.getByRole('button', { name: 'Invitar' }));

    expect(await screen.findByRole('dialog', { name: 'Invitar a alguien' })).toBeTruthy();
    expect(screen.getByLabelText('Correo electrónico (opcional)')).toBeTruthy();
  });

  it('activa la cabecera compacta al salir el héroe y mantiene un solo h1', async () => {
    let observerCallback: IntersectionObserverCallback | null = null;

    class FakeIntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds: readonly number[] = [];

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }

    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    useDetail();
    renderLayout();

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

  it('un 401 usa el helper de sesión y vuelve a /login', async () => {
    server.use(
      http.get(DETAIL_URL, () =>
        HttpResponse.json(
          { code: 'UNAUTHENTICATED', message: 'Inicia sesión para continuar.', details: null },
          { status: 401 },
        ),
      ),
    );

    const { router } = renderLayout();

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
    expect(router.state.location.search).toEqual({ redirect: '/circles/cir_familia' });
  });

  it('un 404 no filtra datos cacheados y ofrece cambiar de cuenta', async () => {
    useNoAccess();

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    queryClient.setQueryData(circleKeys.detail('cir_familia'), circleDetail(circleWithCover));

    const { container } = renderLayout(undefined, queryClient);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No tienes acceso a este círculo' }),
    ).toBeTruthy();

    expect(screen.queryByText('Familia García')).toBeNull();
    expect(screen.queryByText(CHILD_TEXT)).toBeNull();
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

    const { router } = renderLayout(undefined, queryClient);

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

    renderLayout();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'No hemos podido cargar el círculo' }),
    ).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/Código del error: HTTP-500/)).toBeTruthy();
    expect(screen.queryByText(CHILD_TEXT)).toBeNull();

    const help = screen.getByRole('link', { name: 'Ver la ayuda' });
    expect(help.getAttribute('href')).toBe('/help');

    useDetail();

    screen.getByRole('button', { name: 'Reintentar' }).click();

    expect(await screen.findByText(CHILD_TEXT)).toBeTruthy();
  });

  it('reutiliza la caché del N+1 sin repetir la petición', async () => {
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

    renderLayout(undefined, queryClient);

    expect(await screen.findByText(CHILD_TEXT)).toBeTruthy();
    expect(detailCalls).toBe(0);
  });
});
