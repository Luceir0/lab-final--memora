import type { CircleDto } from '@memora/shared';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../../test/auth-server';
import { renderWithRouter } from '../../../test/circles-harness';
import {
  circleDetail,
  circleWithCover,
  circleWithoutCover,
  testMeResponse,
} from '../../../test/circles-fixtures';
import { albumWithPhotos } from '../../../test/fixtures/albums-fixtures';
import { galleryPhotos } from '../../../test/fixtures/photos-fixtures';
import { lucasMember, ownerMember } from '../../members/members-fixtures';

import { MemberSettings } from './member-settings';
import { OwnerSettings } from './owner-settings';

const server = createAuthTestServer();
const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const DETAIL_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia`;
const INVITATIONS_URL = `${DETAIL_URL}/invitations`;
const MEMBERS_URL = `${DETAIL_URL}/members`;
const ALBUMS_URL = `${DETAIL_URL}/albums`;
const PHOTOS_URL = `${AUTH_TEST_API_BASE}/albums/${albumWithPhotos.id}/photos`;

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

function registerBaseData(circle: CircleDto = circleWithCover, role: 'owner' | 'member' = 'owner') {
  server.use(
    http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
    http.get(INVITATIONS_URL, () => HttpResponse.json({ items: [], nextCursor: null })),
    http.get(MEMBERS_URL, () =>
      HttpResponse.json({ items: [ownerMember, lucasMember], nextCursor: null }),
    ),
  );

  return circleDetail(role === 'owner' ? circle : { ...circle, role: 'member' });
}

function registerCoverData() {
  server.use(
    http.get(ALBUMS_URL, () => HttpResponse.json({ items: [albumWithPhotos], nextCursor: null })),
    http.get(PHOTOS_URL, () => HttpResponse.json({ items: galleryPhotos, nextCursor: null })),
  );
}

function renderOwner() {
  const circle = registerBaseData();
  const result = renderWithRouter(
    <OwnerSettings circle={circle} />,
    '/circles/cir_familia/settings',
  );

  return { ...result, circle };
}

function renderMember() {
  const circle = registerBaseData(circleWithCover, 'member');
  const result = renderWithRouter(
    <MemberSettings circle={circle} />,
    '/circles/cir_familia/settings',
  );

  return { ...result, circle };
}

describe('Ajustes del círculo · portada', () => {
  it('el owner ve «Elegir portada» y «Quitar portada»', async () => {
    const { container } = renderOwner();

    expect(await screen.findByRole('button', { name: 'Elegir portada' })).toBeTruthy();

    const remove = screen.getByRole('button', { name: 'Quitar portada' });

    expect((remove as HTMLButtonElement).disabled).toBe(false);
    await expectNoAxeViolations(container);
  });

  it('el member no ve acciones de portada', async () => {
    const { container } = renderMember();

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Solo las personas administradoras pueden cambiar los ajustes',
      }),
    ).toBeTruthy();

    expect(screen.getByText('Portada')).toBeTruthy();
    expect(document.querySelector('img[src="/api/photos/pho_cover_1/thumb"]')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Elegir portada' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Quitar portada' })).toBeNull();
    expect(screen.queryByLabelText('Nombre')).toBeNull();

    await expectNoAxeViolations(container);
  });

  it('navega por los álbumes, elige una foto y la envía al guardar', async () => {
    let body: unknown = null;

    registerCoverData();
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-cover' })),
      http.patch(DETAIL_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({
          ...circleWithCover,
          coverPhoto: {
            id: 'pho_playa',
            thumbUrl: '/api/photos/pho_playa/image?size=thumb',
            width: 1600,
            height: 1200,
          },
        });
      }),
    );

    const { circle } = renderOwner();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Elegir portada' }));

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    await user.click(await within(dialog).findByRole('button', { name: /Verano en Mallorca/ }));
    await user.click(screen.getByRole('checkbox', { name: /Seleccionar foto: Atardecer/ }));
    await user.click(screen.getByRole('button', { name: 'Usar esta foto' }));

    expect(screen.getByText(/1 cambio sin guardar: portada/)).toBeTruthy();
    expect(
      document.querySelector('img[src="/api/photos/pho_playa/image?size=thumb"]'),
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(body).not.toBeNull();
    });
    expect(body).toEqual({ coverPhotoId: 'pho_playa' });
    expect(circle.id).toBe('cir_familia');
    expect(await screen.findByText('Ajustes guardados')).toBeTruthy();
  });

  it('«Quitar portada» deja null en el borrador y lo envía al guardar', async () => {
    let body: unknown = null;

    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-cover' })),
      http.patch(DETAIL_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({ ...circleWithCover, coverPhoto: null });
      }),
    );

    renderOwner();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Quitar portada' }));

    expect(screen.getByText(/1 cambio sin guardar: portada/)).toBeTruthy();
    expect(
      (screen.getByRole('button', { name: 'Quitar portada' }) as HTMLButtonElement).disabled,
    ).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(body).not.toBeNull();
    });
    expect(body).toEqual({ coverPhotoId: null });
  });

  it('un 404 al guardar una foto de portada conserva el borrador, no navega y limpia el aviso al reintentar', async () => {
    let calls = 0;

    registerCoverData();
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-cover' })),
      http.patch(DETAIL_URL, async ({ request }) => {
        calls += 1;

        const body = (await request.json()) as {
          name?: string;
          coverPhotoId?: string | null;
        };

        if (calls === 1) {
          expect(body.coverPhotoId).toBe('pho_playa');

          return HttpResponse.json(
            { code: 'NOT_FOUND', message: 'No encontrado', details: null },
            { status: 404 },
          );
        }

        return HttpResponse.json({
          ...circleWithCover,
          name: body.name ?? circleWithCover.name,
          coverPhoto: {
            id: 'pho_playa',
            thumbUrl: '/api/photos/pho_playa/image?size=thumb',
            width: 1600,
            height: 1200,
          },
        });
      }),
    );

    const { router } = renderOwner();
    const user = userEvent.setup();

    const nameInput = (await screen.findByLabelText('Nombre')) as HTMLInputElement;

    await user.clear(nameInput);
    await user.type(nameInput, 'Familia García nueva');
    await user.click(screen.getByRole('button', { name: 'Elegir portada' }));

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    await user.click(await within(dialog).findByRole('button', { name: /Verano en Mallorca/ }));
    await user.click(await screen.findByRole('checkbox', { name: /Seleccionar foto: Atardecer/ }));
    await user.click(screen.getByRole('button', { name: 'Usar esta foto' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByText(
        'La foto elegida ya no está disponible. Elige otra y vuelve a guardar.',
      ),
    ).toBeTruthy();
    expect(router.state.location.pathname).toBe('/circles/cir_familia/settings');
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe(
      'Familia García nueva',
    );
    expect(screen.getByText(/2 cambios sin guardar: nombre y portada/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Ajustes guardados')).toBeTruthy();
    expect(
      screen.queryByText('La foto elegida ya no está disponible. Elige otra y vuelve a guardar.'),
    ).toBeNull();
  });

  it('un 404 al quitar la portada vuelve a Mis círculos', async () => {
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-cover' })),
      http.patch(DETAIL_URL, () =>
        HttpResponse.json(
          { code: 'NOT_FOUND', message: 'No encontrado', details: null },
          { status: 404 },
        ),
      ),
    );

    const { router } = renderOwner();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Quitar portada' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/circles');
    });
  });

  it('usa el nombre del borrador para las iniciales de la portada', async () => {
    const circle = registerBaseData({ ...circleWithoutCover, role: 'owner' });
    const result = renderWithRouter(
      <OwnerSettings circle={circle} />,
      '/circles/cir_familia/settings',
    );
    const user = userEvent.setup();

    const nameInput = await screen.findByLabelText('Nombre');

    await user.clear(nameInput);
    await user.type(nameInput, 'Nueva Familia');

    expect(screen.getByText('NF')).toBeTruthy();
    expect(result.container.querySelector('img')).toBeNull();
  });

  it('«Descartar» revierte la portada al valor guardado', async () => {
    let patchCalls = 0;

    server.use(
      http.patch(DETAIL_URL, () => {
        patchCalls += 1;
        return HttpResponse.json(circleWithCover);
      }),
    );

    renderOwner();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Quitar portada' }));

    expect(screen.getByText(/1 cambio sin guardar: portada/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Descartar' }));

    expect(screen.queryByText(/cambios? sin guardar/)).toBeNull();
    expect(
      (screen.getByRole('button', { name: 'Quitar portada' }) as HTMLButtonElement).disabled,
    ).toBe(false);
    expect(patchCalls).toBe(0);
  });

  it('el selector de portada pasa axe abierto', async () => {
    registerCoverData();
    renderOwner();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Elegir portada' }));

    const dialog = await screen.findByRole('dialog', { name: 'Elegir portada del círculo' });

    await expectNoAxeViolations(dialog);
  });
});
