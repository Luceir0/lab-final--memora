import type { CircleDto, InvitationDto } from '@memora/shared';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../packages/ui/src/test/axe';
import { CircleDetailLayout } from '../features/circles/circle-detail-layout';
import { CircleSidebarNav } from '../features/circles/circle-sidebar-nav';
import { circleKeys } from '../features/circles/queries';
import { CircleSettingsPage } from '../features/circles/settings/circle-settings-page';
import { sectionNavigationState } from '../features/circles/use-section-focus';
import { emailInvitation, lucasMember, ownerMember } from '../features/members/members-fixtures';
import { AUTH_TEST_API_BASE } from '../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../test/auth-server';
import { renderWithRouter } from '../test/circles-harness';
import { circleDetail, circleWithCover, defaultCircles } from '../test/circles-fixtures';

import { Route } from './_app.circles.$circleId.settings';

const server = createAuthTestServer();
const DETAIL_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia`;
const INVITATIONS_URL = `${DETAIL_URL}/invitations`;
const MEMBERS_URL = `${DETAIL_URL}/members`;
const CIRCLES_URL = `${AUTH_TEST_API_BASE}/circles`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;

const memberCircle: CircleDto = {
  ...circleWithCover,
  role: 'member',
  settings: { ...circleWithCover.settings, membersCanDownload: false },
};

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.uploadBar;
  delete document.documentElement.dataset.saveBar;
  document.documentElement.style.removeProperty('--settings-save-bar-height');
});

afterAll(() => {
  server.close();
});

async function headTitle(): Promise<string> {
  const head = Route.options.head;

  if (typeof head !== 'function') {
    throw new Error('La ruta de ajustes no define head');
  }

  const result = (await head({} as never)) as { meta?: Array<{ title?: string }> } | undefined;

  return result?.meta?.find((meta) => meta.title !== undefined)?.title ?? '';
}

function useCsrf() {
  server.use(http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-settings' })));
}

interface RenderSettingsOptions {
  readonly invitations?: readonly InvitationDto[];
  /** Retardo del `GET /circles/:id` para probar la carga. */
  readonly detailDelay?: number;
  /** Se llama en cada `GET /circles/:id` para detectar refetch tras borrar. */
  readonly onDetailRequest?: () => void;
}

function registerSettingsData(role: 'owner' | 'member', options: RenderSettingsOptions = {}) {
  const circle = circleDetail(role === 'owner' ? circleWithCover : memberCircle);

  server.use(
    http.get(DETAIL_URL, async () => {
      options.onDetailRequest?.();

      if (options.detailDelay !== undefined) {
        await delay(options.detailDelay);
      }

      return HttpResponse.json(circle);
    }),
    http.get(INVITATIONS_URL, () =>
      HttpResponse.json({ items: options.invitations ?? [], nextCursor: null }),
    ),
    http.get(MEMBERS_URL, () =>
      HttpResponse.json({ items: [ownerMember, lucasMember], nextCursor: null }),
    ),
  );

  return circle;
}

function renderSettings(role: 'owner' | 'member' = 'owner', options: RenderSettingsOptions = {}) {
  registerSettingsData(role, options);

  return renderWithRouter(
    <CircleDetailLayout circleId="cir_familia">
      <CircleSettingsPage />
    </CircleDetailLayout>,
    '/circles/cir_familia/settings',
  );
}

function useCirclesList() {
  server.use(
    http.get(CIRCLES_URL, () => HttpResponse.json({ items: defaultCircles, nextCursor: null })),
  );
}

describe('ruta /circles/$circleId/settings', () => {
  it('declara el título de Ajustes', async () => {
    expect(await headTitle()).toBe('Ajustes · Memora');
  });

  it('el owner ve el formulario, la portada de solo lectura y los cuatro permisos', async () => {
    const { container } = renderSettings('owner');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ajustes de Familia García' }),
    ).toBeTruthy();

    const crumbs = screen.getByRole('navigation', { name: 'Ruta del círculo' });
    expect(within(crumbs).getByText('Ajustes')).toBeTruthy();

    const sections = screen.getByRole('navigation', { name: 'Secciones del círculo' });
    const settings = within(sections).getByRole('link', { name: /Ajustes/ });

    expect(settings.getAttribute('href')).toBe('/circles/cir_familia/settings');
    expect(settings.getAttribute('aria-current')).toBe('page');

    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('Familia García');
    expect((screen.getByLabelText('Descripción (opcional)') as HTMLTextAreaElement).value).toBe(
      'Las fotos de casa, los veranos en Mallorca y todo lo que no queremos olvidar.',
    );

    // La portada se muestra sin acción de cambio.
    expect(screen.queryByRole('button', { name: /Cambiar portada/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /Cambiar portada/ })).toBeNull();

    for (const name of [
      'Crear álbumes',
      'Subir fotos',
      'Etiquetar personas',
      'Descargar originales',
    ]) {
      expect((screen.getByRole('switch', { name }) as HTMLInputElement).checked).toBe(true);
    }

    expect(screen.getByRole('button', { name: 'Eliminar círculo…' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Salir del círculo' })).toBeNull();

    await expectNoAxeViolations(container);
  });

  it('mueve el foco de sección al h1 de Ajustes', async () => {
    const { router } = renderSettings('owner');

    const title = await screen.findByRole('heading', {
      level: 1,
      name: 'Ajustes de Familia García',
    });

    await act(async () => {
      await router.navigate({
        href: '/circles/cir_familia/settings',
        state: sectionNavigationState,
      });
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(title);
    });
  });

  it('acumula los cambios, resume el lote y guarda un único PATCH con settings completo', async () => {
    useCsrf();
    let patchBody: unknown = null;
    let csrfHeader: string | null = null;

    server.use(
      http.patch(DETAIL_URL, async ({ request }) => {
        patchBody = await request.json();
        csrfHeader = request.headers.get('x-csrf-token');

        return HttpResponse.json({
          ...circleWithCover,
          name: 'Familia García actualizada',
          settings: { ...circleWithCover.settings, membersCanDownload: false },
        });
      }),
    );

    const { queryClient } = renderSettings('owner');
    const user = userEvent.setup();

    const nameInput = await screen.findByLabelText('Nombre');
    await user.clear(nameInput);
    await user.type(nameInput, 'Familia García actualizada');

    const download = screen.getByRole('switch', { name: 'Descargar originales' });
    await user.click(download);

    expect(screen.getByText(/2 cambios sin guardar: nombre y descarga de originales/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(patchBody).not.toBeNull();
    });

    expect(csrfHeader).toBe('csrf-settings');
    expect(patchBody).toEqual({
      name: 'Familia García actualizada',
      settings: {
        membersCanCreateAlbums: true,
        membersCanUpload: true,
        membersCanTag: true,
        membersCanDownload: false,
      },
    });

    expect(await screen.findByText('Ajustes guardados')).toBeTruthy();
    expect(screen.queryByText(/cambios sin guardar/)).toBeNull();

    const cached = queryClient.getQueryData(circleKeys.detail('cir_familia')) as
      { name: string; stats: { photosCount: number } } | undefined;

    expect(cached?.name).toBe('Familia García actualizada');
    expect(cached?.stats.photosCount).toBe(1240);
  });

  it('«Descartar» vuelve a los valores guardados y limpia la barra', async () => {
    renderSettings('owner');
    const user = userEvent.setup();

    const nameInput = await screen.findByLabelText('Nombre');
    await user.type(nameInput, ' y algo más');

    expect(screen.getByRole('button', { name: 'Descartar' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Descartar' }));

    expect((nameInput as HTMLInputElement).value).toBe('Familia García');
    expect(screen.queryByRole('button', { name: 'Descartar' })).toBeNull();
  });

  it('valida el nombre antes de enviar y no pierde lo escrito', async () => {
    let patchCalls = 0;
    server.use(
      http.patch(DETAIL_URL, () => {
        patchCalls += 1;
        return HttpResponse.json(circleWithCover);
      }),
    );

    renderSettings('owner');
    const user = userEvent.setup();

    const nameInput = await screen.findByLabelText('Nombre');
    await user.clear(nameInput);
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('El nombre es obligatorio.')).toBeTruthy();
    expect(document.activeElement).toBe(nameInput);
    expect(patchCalls).toBe(0);
  });

  it('muestra los errores 400 por campo y de settings sin cerrar el formulario', async () => {
    useCsrf();
    server.use(
      http.patch(DETAIL_URL, () =>
        HttpResponse.json(
          {
            code: 'VALIDATION_ERROR',
            message: 'Revisa los datos.',
            details: [
              { field: 'name', message: 'Ese nombre no vale.' },
              { field: 'settings', message: 'Los permisos no son válidos.' },
            ],
          },
          { status: 400 },
        ),
      ),
    );

    renderSettings('owner');
    const user = userEvent.setup();

    const nameInput = await screen.findByLabelText('Nombre');
    await user.type(nameInput, ' ampliado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Ese nombre no vale.')).toBeTruthy();
    expect(screen.getByText('Los permisos no son válidos.')).toBeTruthy();
    expect((nameInput as HTMLInputElement).value).toBe('Familia García ampliado');
  });

  it('un 403 explica que solo la persona administradora puede cambiar los ajustes', async () => {
    useCsrf();
    server.use(
      http.patch(DETAIL_URL, () =>
        HttpResponse.json(
          { code: 'FORBIDDEN', message: 'Sin permiso.', details: null },
          { status: 403 },
        ),
      ),
    );

    renderSettings('owner');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Nombre'), ' ampliado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByText(/Solo la persona administradora puede cambiar los ajustes/),
    ).toBeTruthy();
  });

  it('borrar exige escribir ELIMINAR, envía DELETE con CSRF y vuelve a Mis círculos', async () => {
    useCsrf();
    let deleteCsrf: string | null = null;
    let deleteCalls = 0;

    server.use(
      http.delete(DETAIL_URL, ({ request }) => {
        deleteCalls += 1;
        deleteCsrf = request.headers.get('x-csrf-token');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { router } = renderSettings('owner');
    const user = userEvent.setup();

    const trigger = await screen.findByRole('button', { name: 'Eliminar círculo…' });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: '¿Eliminar Familia García?' });
    const confirm = within(dialog).getByRole('button', { name: 'Eliminar para siempre' });

    expect((confirm as HTMLButtonElement).disabled).toBe(true);

    const phrase = within(dialog).getByLabelText('Escribe «ELIMINAR» para confirmar');
    await user.type(phrase, 'ELIMINAR');

    expect((confirm as HTMLButtonElement).disabled).toBe(false);
    await user.click(confirm);

    await waitFor(() => {
      expect(deleteCalls).toBe(1);
    });

    expect(deleteCsrf).toBe('csrf-settings');
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles');
    });
  });

  it('devolver el foco al disparador al cerrar el diálogo de borrado', async () => {
    renderSettings('owner');
    const user = userEvent.setup();

    const trigger = await screen.findByRole('button', { name: 'Eliminar círculo…' });
    await user.click(trigger);

    await screen.findByRole('dialog', { name: '¿Eliminar Familia García?' });
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('mantiene el diálogo abierto y muestra el error si el borrado falla', async () => {
    useCsrf();
    server.use(
      http.delete(DETAIL_URL, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Fallo interno', details: null },
          { status: 500 },
        ),
      ),
    );

    renderSettings('owner');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Eliminar círculo…' }));

    const dialog = await screen.findByRole('dialog', { name: '¿Eliminar Familia García?' });
    await user.type(within(dialog).getByLabelText('Escribe «ELIMINAR» para confirmar'), 'ELIMINAR');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar para siempre' }));

    expect(await screen.findByText('No hemos podido eliminar el círculo')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: '¿Eliminar Familia García?' })).toBeTruthy();
  });

  it('el member ve solo lectura, los permisos efectivos y el nombre del owner', async () => {
    const { container } = renderSettings('member');

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Solo las personas administradoras pueden cambiar los ajustes',
      }),
    ).toBeTruthy();
    expect(
      await screen.findByText('Si quieres cambiar algo, pídeselo a Sofía Martín.'),
    ).toBeTruthy();

    expect(screen.queryByLabelText('Nombre')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Eliminar círculo…' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Salir del círculo' })).toBeTruthy();

    expect(screen.getAllByText('Permitido')).toHaveLength(3);
    expect(screen.getByText('No permitido')).toBeTruthy();

    await expectNoAxeViolations(container);
  });

  it('el member sale del círculo con confirmación, CSRF y aviso en Mis círculos', async () => {
    useCsrf();
    let leaveCsrf: string | null = null;
    let leaveCalls = 0;

    server.use(
      http.post(`${DETAIL_URL}/leave`, ({ request }) => {
        leaveCalls += 1;
        leaveCsrf = request.headers.get('x-csrf-token');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { router } = renderSettings('member');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Salir del círculo' }));

    const dialog = await screen.findByRole('dialog', { name: 'Salir de Familia García' });
    await user.click(within(dialog).getByRole('button', { name: 'Salir del círculo' }));

    await waitFor(() => {
      expect(leaveCalls).toBe(1);
    });

    expect(leaveCsrf).toBe('csrf-settings');
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles');
    });
    expect(router.state.location.search).toMatchObject({ left: true });
  });

  it('reserva la altura real de la barra y la limpia al descartar (B1/M1)', async () => {
    let observerCallback: ResizeObserverCallback | null = null;

    class FakeResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        observerCallback = callback;
      }

      observe() {}

      unobserve() {}

      disconnect() {
        observerCallback = null;
      }
    }

    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    renderSettings('owner');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Nombre'), ' y algo');

    const bar = document.querySelector<HTMLElement>('[data-settings-save-bar]');

    if (bar === null) {
      throw new Error('La barra de guardado debería estar montada');
    }

    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({
      height: 505,
      width: 360,
      top: 0,
      bottom: 505,
      left: 0,
      right: 360,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    await waitFor(() => {
      expect(document.documentElement.dataset.saveBar).toBe('visible');
    });

    act(() => {
      observerCallback?.([], {} as ResizeObserver);
    });

    expect(document.documentElement.style.getPropertyValue('--settings-save-bar-height')).toBe(
      '505px',
    );

    const spacer = bar.previousElementSibling as HTMLElement | null;

    expect(spacer?.getAttribute('aria-hidden')).toBe('true');
    expect(spacer?.style.height).toBe('calc(var(--settings-save-bar-height) + 0.5rem)');

    await user.click(screen.getByRole('button', { name: 'Descartar' }));

    expect(document.documentElement.dataset.saveBar).toBeUndefined();
    expect(document.documentElement.style.getPropertyValue('--settings-save-bar-height')).toBe('');
  });

  it('desplaza la barra de guardado cuando la cola de subidas está visible (B2)', async () => {
    renderSettings('owner');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Nombre'), ' y algo');

    const bar = document.querySelector<HTMLElement>('[data-settings-save-bar]');

    if (bar === null) {
      throw new Error('La barra de guardado debería estar montada');
    }

    expect(bar.style.bottom).toBe('var(--settings-save-bar-bottom)');
    expect(bar.style.right).toBe('var(--settings-save-bar-right)');

    act(() => {
      document.documentElement.dataset.uploadBar = 'visible';
    });

    await waitFor(() => {
      expect(bar.style.bottom).toBe('var(--settings-save-bar-bottom-with-upload)');
    });
  });

  it('mantiene el resumen sr-only en móvil y los botones en fila (1.4.4/B1-r/D3/D7)', async () => {
    renderSettings('owner');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Nombre'), ' y algo');

    const bar = document.querySelector<HTMLElement>('[data-settings-save-bar]');

    if (bar === null) {
      throw new Error('La barra de guardado debería estar montada');
    }

    const summary = within(bar).getByText(/1 cambio sin guardar: nombre/);
    const discard = within(bar).getByRole('button', { name: 'Descartar' });
    const save = within(bar).getByRole('button', { name: 'Guardar cambios' });
    const content = summary.parentElement;
    const actions = discard.parentElement;

    expect(summary.className).toContain('min-w-0');
    expect(summary.className).toContain('flex-1');
    expect(summary.className).toContain('truncate');
    expect(summary.className).toContain('max-sm:sr-only');
    expect(content?.className).toContain('flex-wrap');
    expect(actions?.className).toContain('flex-wrap');
    expect(actions?.className).toContain('w-full');
    expect(actions?.className).toContain('sm:w-auto');
    expect(actions?.contains(save)).toBe(true);
    expect(discard.className).toContain('min-w-fit');
    expect(save.className).toContain('min-w-fit');
    expect(discard.className).toContain('flex-1');
    expect(save.className).toContain('flex-1');
    expect(discard.className).toContain('sm:flex-none');
    expect(save.className).toContain('sm:flex-none');
    expect(discard.className).toContain('h-auto!');
    expect(save.className).toContain('whitespace-normal');
    expect(discard.className).toContain('px-3');
    expect(save.className).toContain('py-2');

    act(() => {
      document.documentElement.dataset.uploadBar = 'visible';
    });

    await waitFor(() => {
      expect(summary.className).toBe('sr-only');
    });
    expect(actions?.className).toContain('flex-wrap');
  });

  it('mueve el foco al aviso superior y deja la barra compacta (M2/N-D/B1-r)', async () => {
    useCsrf();
    server.use(
      http.patch(DETAIL_URL, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Fallo interno', details: null },
          { status: 500 },
        ),
      ),
    );

    const { container } = renderSettings('owner');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Nombre'), ' ampliado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    const alert = await screen.findByRole('alert');

    await waitFor(() => {
      expect(document.activeElement).toBe(alert);
    });

    expect(alert.getAttribute('title') ?? '').toContain('No hemos podido guardar los ajustes');
    expect(alert.className).toContain('scroll-mt-[var(--app-circle-scroll-offset)]');
    expect(within(alert).getByText(/No hemos podido guardar los ajustes/)).toBeTruthy();
    expect(within(alert).getByText(/Parece un problema del servidor/)).toBeTruthy();
    expect(screen.getAllByRole('alert')).toHaveLength(1);

    const bar = document.querySelector<HTMLElement>('[data-settings-save-bar]');

    if (bar === null) {
      throw new Error('La barra de guardado debería estar montada');
    }

    expect(within(bar).queryByText(/No se pudo guardar/)).toBeNull();
    expect(within(bar).queryByRole('alert')).toBeNull();
    expect(bar.textContent).not.toContain('Parece un problema del servidor');

    await expectNoAxeViolations(container);
  });

  it('expone el contador de descripción, el heading de permisos y el resumen (m1/m2/m5)', async () => {
    renderSettings('owner');
    const user = userEvent.setup();

    const description = await screen.findByLabelText('Descripción (opcional)');
    const counter = screen.getByText(/^\d+\/200$/);

    expect(counter.getAttribute('aria-live')).toBe('polite');
    expect(counter.getAttribute('aria-hidden')).toBeNull();
    expect(description.getAttribute('aria-describedby')).toContain(counter.id);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Permisos de los miembros' }),
    ).toBeTruthy();

    await user.type(await screen.findByLabelText('Nombre'), ' y algo');

    expect(screen.getByText(/1 cambio sin guardar: nombre/).getAttribute('aria-live')).toBe(
      'polite',
    );
  });

  it('concuerda en singular la invitación pendiente (n1)', async () => {
    renderSettings('owner', { invitations: [emailInvitation] });
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Eliminar círculo…' }));

    expect(await screen.findByText('1 invitación pendiente dejará de funcionar.')).toBeTruthy();
  });

  it('el enlace Ajustes del sidebar marca la navegación para mover el foco al h1 (M-02)', async () => {
    useCirclesList();
    registerSettingsData('owner');

    const { router } = renderWithRouter(
      <>
        <div data-testid="circle-sidebar">
          <CircleSidebarNav currentPath="/circles/cir_familia/people" />
        </div>
        <CircleDetailLayout circleId="cir_familia">
          <CircleSettingsPage />
        </CircleDetailLayout>
      </>,
      '/circles/cir_familia/people',
    );
    const user = userEvent.setup();

    await screen.findByRole('heading', { level: 1, name: 'Familia García' });

    const link = within(screen.getByTestId('circle-sidebar')).getByRole('link', {
      name: /^Ajustes/,
    });

    await user.click(link);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles/cir_familia/settings');
    });

    /*
     * La marca es la que consume `useSectionFocusRequest` en el layout (ver
     * «mueve el foco de sección al h1 de Ajustes»). En el harness cada ruta
     * monta su propio árbol, así que aquí se comprueba el contrato del enlace:
     * sin esta marca el sidebar navegaba sin mover el foco.
     */
    const state = router.state.location.state as { focusSection?: unknown };

    expect(typeof state.focusSection).toBe('string');
  });

  it('no vuelve a pedir el detalle después de borrar (m-03)', async () => {
    useCsrf();

    let detailRequests = 0;

    server.use(http.delete(DETAIL_URL, () => new HttpResponse(null, { status: 204 })));

    const { router } = renderSettings('owner', {
      onDetailRequest: () => {
        detailRequests += 1;
      },
    });
    const user = userEvent.setup();

    await screen.findByRole('heading', { level: 1, name: 'Ajustes de Familia García' });
    expect(detailRequests).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Eliminar círculo…' }));

    const dialog = await screen.findByRole('dialog', { name: '¿Eliminar Familia García?' });

    await user.type(within(dialog).getByLabelText('Escribe «ELIMINAR» para confirmar'), 'ELIMINAR');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar para siempre' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles');
    });
    expect(router.state.location.search).toMatchObject({ deleted: true });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(detailRequests).toBe(1);
  });

  it('redirige a entrar si el guardado devuelve 401', async () => {
    useCsrf();
    server.use(
      http.patch(DETAIL_URL, () =>
        HttpResponse.json(
          { code: 'UNAUTHORIZED', message: 'Sesión caducada', details: null },
          { status: 401 },
        ),
      ),
    );

    const { router } = renderSettings('owner');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Nombre'), ' ampliado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login');
    });
  });

  it('vuelve a Mis círculos si el guardado devuelve 404', async () => {
    useCsrf();
    server.use(
      http.patch(DETAIL_URL, () =>
        HttpResponse.json(
          { code: 'NOT_FOUND', message: 'No encontramos el círculo', details: null },
          { status: 404 },
        ),
      ),
    );

    const { router } = renderSettings('owner');
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText('Nombre'), ' ampliado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles');
    });
  });

  it('explica el 429 y el error de red sin perder lo escrito', async () => {
    useCsrf();
    server.use(
      http.patch(
        DETAIL_URL,
        () =>
          HttpResponse.json(
            { code: 'RATE_LIMITED', message: 'Demasiadas peticiones', details: null },
            { status: 429 },
          ),
        { once: true },
      ),
    );

    renderSettings('owner');
    const user = userEvent.setup();
    const nameInput = await screen.findByLabelText('Nombre');

    await user.type(nameInput, ' ampliado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText(/Demasiadas peticiones/)).toBeTruthy();
    expect((nameInput as HTMLInputElement).value).toBe('Familia García ampliado');

    server.use(http.patch(DETAIL_URL, () => HttpResponse.error()));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByText(
        /Se ha perdido la conexión\. No has perdido nada de lo que has escrito/,
      ),
    ).toBeTruthy();
  });

  it('anuncia «Guardando…», bloquea el formulario y pasa axe (m-04/m-09)', async () => {
    useCsrf();
    const gate: { release?: () => void } = {};
    const patchGate = new Promise<void>((resolve) => {
      gate.release = resolve;
    });

    server.use(
      http.patch(DETAIL_URL, async () => {
        await patchGate;
        return HttpResponse.json({ ...circleWithCover, name: 'Familia García actualizada' });
      }),
    );

    const { container } = renderSettings('owner');
    const user = userEvent.setup();
    const nameInput = await screen.findByLabelText('Nombre');

    await user.type(nameInput, ' actualizada');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    const saving = await screen.findByRole('button', { name: 'Guardando…' });

    expect(saving.getAttribute('aria-busy')).toBe('true');
    expect(container.querySelector('form')?.getAttribute('aria-busy')).toBe('true');
    expect((nameInput as HTMLInputElement).disabled).toBe(true);
    expect(
      (screen.getByRole('switch', { name: 'Crear álbumes' }) as HTMLInputElement).disabled,
    ).toBe(true);
    expect(screen.getByText(/Guardando 1 cambio: nombre/)).toBeTruthy();

    await expectNoAxeViolations(container);

    gate.release?.();

    expect(await screen.findByText('Ajustes guardados')).toBeTruthy();
    expect((nameInput as HTMLInputElement).disabled).toBe(false);
  });

  it('anuncia la carga del círculo antes de montar los ajustes', async () => {
    renderSettings('owner', { detailDelay: 60 });

    expect(await screen.findByText('Cargando el círculo…')).toBeTruthy();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ajustes de Familia García' }),
    ).toBeTruthy();
  });

  it('los diálogos de borrado y salida pasan axe (m-09)', async () => {
    const ownerView = renderSettings('owner');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Eliminar círculo…' }));
    const deleteDialog = await screen.findByRole('dialog', { name: '¿Eliminar Familia García?' });

    await expectNoAxeViolations(deleteDialog);
    ownerView.unmount();

    renderSettings('member');
    await user.click(await screen.findByRole('button', { name: 'Salir del círculo' }));
    const leaveDialog = await screen.findByRole('dialog', { name: 'Salir de Familia García' });

    await expectNoAxeViolations(leaveDialog);
  });

  it.each([
    [401, '/login'],
    [404, '/circles'],
  ] as const)('el borrado con %i navega a %s', async (status, path) => {
    useCsrf();
    server.use(
      http.delete(DETAIL_URL, () =>
        HttpResponse.json({ code: 'ERROR', message: 'Fallo al borrar', details: null }, { status }),
      ),
    );

    const { router } = renderSettings('owner');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Eliminar círculo…' }));

    const dialog = await screen.findByRole('dialog', { name: '¿Eliminar Familia García?' });

    await user.type(within(dialog).getByLabelText('Escribe «ELIMINAR» para confirmar'), 'ELIMINAR');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar para siempre' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(path);
    });
  });

  it('muestra el 429 y el error de red al borrar sin cerrar el diálogo', async () => {
    useCsrf();
    server.use(
      http.delete(
        DETAIL_URL,
        () =>
          HttpResponse.json(
            { code: 'RATE_LIMITED', message: 'Demasiadas peticiones', details: null },
            { status: 429 },
          ),
        { once: true },
      ),
    );

    renderSettings('owner');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Eliminar círculo…' }));

    const dialog = await screen.findByRole('dialog', { name: '¿Eliminar Familia García?' });

    await user.type(within(dialog).getByLabelText('Escribe «ELIMINAR» para confirmar'), 'ELIMINAR');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar para siempre' }));

    expect(await within(dialog).findByText('Demasiadas peticiones')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: '¿Eliminar Familia García?' })).toBeTruthy();

    server.use(http.delete(DETAIL_URL, () => HttpResponse.error()));
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar para siempre' }));

    expect(
      await within(dialog).findByText(
        'Parece un problema de conexión. Tus fotos siguen a salvo: vuelve a intentarlo en unos segundos.',
      ),
    ).toBeTruthy();
  });

  it.each([
    [401, '/login'],
    [404, '/circles'],
  ] as const)('la salida con %i navega a %s', async (status, path) => {
    useCsrf();
    server.use(
      http.post(`${DETAIL_URL}/leave`, () =>
        HttpResponse.json({ code: 'ERROR', message: 'Fallo al salir', details: null }, { status }),
      ),
    );

    const { router } = renderSettings('member');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Salir del círculo' }));

    const dialog = await screen.findByRole('dialog', { name: 'Salir de Familia García' });
    await user.click(within(dialog).getByRole('button', { name: 'Salir del círculo' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(path);
    });
  });

  it('muestra el 429 y el error de red al salir sin cerrar el diálogo', async () => {
    useCsrf();
    server.use(
      http.post(
        `${DETAIL_URL}/leave`,
        () =>
          HttpResponse.json(
            { code: 'RATE_LIMITED', message: 'Demasiadas peticiones', details: null },
            { status: 429 },
          ),
        { once: true },
      ),
    );

    renderSettings('member');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Salir del círculo' }));

    const dialog = await screen.findByRole('dialog', { name: 'Salir de Familia García' });
    await user.click(within(dialog).getByRole('button', { name: 'Salir del círculo' }));

    expect(await within(dialog).findByText('Demasiadas peticiones')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Salir de Familia García' })).toBeTruthy();

    server.use(http.post(`${DETAIL_URL}/leave`, () => HttpResponse.error()));
    await user.click(within(dialog).getByRole('button', { name: 'Salir del círculo' }));

    expect(
      await within(dialog).findByText(
        'Parece un problema de conexión. Tus fotos siguen a salvo: vuelve a intentarlo en unos segundos.',
      ),
    ).toBeTruthy();
  });

  it('no vuelve a pedir el detalle después de salir (m-03)', async () => {
    useCsrf();
    let detailRequests = 0;

    server.use(http.post(`${DETAIL_URL}/leave`, () => new HttpResponse(null, { status: 204 })));

    const { router } = renderSettings('member', {
      onDetailRequest: () => {
        detailRequests += 1;
      },
    });
    const user = userEvent.setup();

    await screen.findByRole('heading', {
      level: 2,
      name: 'Solo las personas administradoras pueden cambiar los ajustes',
    });
    expect(detailRequests).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Salir del círculo' }));

    const dialog = await screen.findByRole('dialog', { name: 'Salir de Familia García' });
    await user.click(within(dialog).getByRole('button', { name: 'Salir del círculo' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles');
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(detailRequests).toBe(1);
  });
});
