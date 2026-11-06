import type { CircleDetailDto } from '@memora/shared';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { albumWithPhotos } from '../../test/fixtures/albums-fixtures';
import { renderAlbumsRouter } from '../../test/fixtures/albums-router';
import { circleDetail, circleWithCover, testMeResponse } from '../../test/circles-fixtures';
import { CircleDetailLayout } from '../circles/circle-detail-layout';
import { CircleDetailPage } from '../circles/circle-detail-page';
import { UploadProvider } from '../uploads/upload-provider';

import { AlbumDetailPage } from './album-detail-page';

const server = createAuthTestServer();
const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const DETAIL_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia`;
const ALBUMS_URL = `${DETAIL_URL}/albums`;
const INVITATIONS_URL = `${DETAIL_URL}/invitations`;
const ALBUM_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;

beforeAll(() => {
  startAuthTestServer(server);
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

function memberCircle(membersCanCreateAlbums: boolean): CircleDetailDto {
  return circleDetail({
    ...circleWithCover,
    role: 'member',
    settings: { ...circleWithCover.settings, membersCanCreateAlbums },
  });
}

function useCircleApi(circle: CircleDetailDto = circleDetail(circleWithCover)) {
  server.use(
    http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
    http.get(DETAIL_URL, () => HttpResponse.json(circle)),
    http.get(INVITATIONS_URL, () => HttpResponse.json({ items: [], nextCursor: null })),
    http.get(ALBUMS_URL, () => HttpResponse.json({ items: [albumWithPhotos], nextCursor: null })),
    http.get(ALBUM_URL, () => HttpResponse.json(albumWithPhotos)),
  );
}

describe('F24 · detalle de álbum dentro del layout del círculo', () => {
  it('no pinta héroe ni pestañas, pero sí la página del álbum (D7)', async () => {
    useCircleApi();

    const { container } = renderAlbumsRouter(
      <UploadProvider>
        <CircleDetailLayout circleId="cir_familia">
          <AlbumDetailPage circleId="cir_familia" albumId="alb_verano" />
        </CircleDetailLayout>
      </UploadProvider>,
      '/circles/cir_familia/albums/alb_verano',
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' }),
    ).toBeTruthy();

    // El chrome del círculo no se pinta en el detalle.
    expect(screen.queryByRole('heading', { level: 1, name: 'Familia García' })).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Secciones del círculo' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Invitar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Nuevo álbum' })).toBeNull();

    await expectNoAxeViolations(container);
  });
});

describe('F24 · pestaña Álbumes dentro del layout del círculo', () => {
  it('pinta héroe, pestañas y la rejilla de álbumes', async () => {
    useCircleApi();

    const { container } = renderAlbumsRouter(
      <CircleDetailLayout circleId="cir_familia">
        <CircleDetailPage />
      </CircleDetailLayout>,
      '/circles/cir_familia',
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Familia García' })).toBeTruthy();
    expect(await screen.findByRole('navigation', { name: 'Secciones del círculo' })).toBeTruthy();
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Verano en Mallorca' }),
    ).toBeTruthy();

    await expectNoAxeViolations(container);
  });

  it('el héroe ofrece «Nuevo álbum» al owner', async () => {
    useCircleApi();

    renderAlbumsRouter(
      <CircleDetailLayout circleId="cir_familia">
        <CircleDetailPage />
      </CircleDetailLayout>,
      '/circles/cir_familia',
    );

    expect(await screen.findByRole('button', { name: 'Nuevo álbum' })).toBeTruthy();
  });

  it('el héroe ofrece «Nuevo álbum» al miembro con la flag activa', async () => {
    useCircleApi(memberCircle(true));

    renderAlbumsRouter(
      <CircleDetailLayout circleId="cir_familia">
        <CircleDetailPage />
      </CircleDetailLayout>,
      '/circles/cir_familia',
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Familia García' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Nuevo álbum' })).toBeTruthy();
  });

  it('no muestra «Nuevo álbum» al miembro sin permiso', async () => {
    useCircleApi(memberCircle(false));

    renderAlbumsRouter(
      <CircleDetailLayout circleId="cir_familia">
        <CircleDetailPage />
      </CircleDetailLayout>,
      '/circles/cir_familia',
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Familia García' })).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Nuevo álbum' })).toBeNull();
    });
  });
});

describe('F24 · alta desde el héroe', () => {
  it('crea el álbum, cierra el diálogo y muestra el toast', async () => {
    useCircleApi();
    server.use(
      http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-layout' })),
      http.post(ALBUMS_URL, () =>
        HttpResponse.json({ ...albumWithPhotos, title: 'Verano 2026' }, { status: 201 }),
      ),
    );

    renderAlbumsRouter(
      <CircleDetailLayout circleId="cir_familia">
        <CircleDetailPage />
      </CircleDetailLayout>,
      '/circles/cir_familia',
    );

    const user = userEvent.setup();

    fireEvent.click(await screen.findByRole('button', { name: 'Nuevo álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Nuevo álbum' });

    await user.type(within(dialog).getByLabelText('Título'), 'Verano 2026');
    await user.click(within(dialog).getByRole('button', { name: 'Crear álbum' }));

    expect(await screen.findByText('Álbum creado')).toBeTruthy();
    expect(screen.getByText('«Verano 2026» ya está en Familia García.')).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Nuevo álbum' })).toBeNull();
    });
  });
});
