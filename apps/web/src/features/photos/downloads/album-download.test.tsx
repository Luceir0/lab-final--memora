import type { DownloadJobDto } from '@memora/shared';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../../packages/ui/src/test/axe';
import { AUTH_TEST_API_BASE } from '../../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../../test/auth-server';
import { albumWithPhotos } from '../../../test/fixtures/albums-fixtures';
import { renderAlbumsRouter } from '../../../test/fixtures/albums-router';
import { galleryPhotos } from '../../../test/fixtures/photos-fixtures';
import { circleDetail, circleWithCover, testMeResponse } from '../../../test/circles-fixtures';
import { AlbumDetailPage } from '../../albums/album-detail-page';
import { CircleDetailProvider } from '../../circles/circle-detail-context';
import { defaultMembers } from '../../members/members-fixtures';
import { UploadProvider } from '../../uploads/upload-provider';
import { UploadQueueHost } from '../../uploads/upload-queue-host';

const server = createAuthTestServer();
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const CREATE_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano/downloads`;
const JOB_URL = `${AUTH_TEST_API_BASE}/downloads/:jobId`;

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

function makeJob(overrides: Partial<DownloadJobDto> = {}): DownloadJobDto {
  return {
    id: 'job_album',
    kind: 'album',
    status: 'pending',
    albumId: 'alb_verano',
    progress: null,
    createdAt: '2026-11-07T10:00:00.000Z',
    expiresAt: '2026-11-08T10:00:00.000Z',
    completedAt: null,
    errorMessage: null,
    ...overrides,
  };
}

function renderAlbum(membersCanDownload: boolean) {
  const circle = circleDetail({
    ...circleWithCover,
    role: 'member',
    settings: { ...circleWithCover.settings, membersCanDownload },
  });

  server.use(
    http.get(`${AUTH_TEST_API_BASE}/me`, () => HttpResponse.json(testMeResponse)),
    http.get(`${AUTH_TEST_API_BASE}/circles/cir_familia`, () => HttpResponse.json(circle)),
    http.get(`${AUTH_TEST_API_BASE}/circles/cir_familia/invitations`, () =>
      HttpResponse.json({ items: [], nextCursor: null }),
    ),
    http.get(`${AUTH_TEST_API_BASE}/circles/cir_familia/members`, () =>
      HttpResponse.json({ items: defaultMembers, nextCursor: null }),
    ),
    http.get(`${AUTH_TEST_API_BASE}/circles/cir_familia/albums`, () =>
      HttpResponse.json({ items: [albumWithPhotos], nextCursor: null }),
    ),
    http.get(`${AUTH_TEST_API_BASE}/albums/alb_verano`, () => HttpResponse.json(albumWithPhotos)),
    http.get(`${AUTH_TEST_API_BASE}/albums/alb_verano/photos`, () =>
      HttpResponse.json({ items: galleryPhotos, nextCursor: null }),
    ),
    http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-album' })),
  );

  return renderAlbumsRouter(
    <UploadProvider>
      <UploadQueueHost />
      <CircleDetailProvider circle={circle} openInvite={vi.fn()} focusTitle={vi.fn()}>
        <AlbumDetailPage circleId={circle.id} albumId={albumWithPhotos.id} />
      </CircleDetailProvider>
    </UploadProvider>,
    `/circles/${circle.id}/albums/${albumWithPhotos.id}`,
  );
}

function openAlbumMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Acciones del álbum' }));
}

describe('AlbumDetailPage · descarga del álbum', () => {
  it('crea el job sin photoIds desde el menú y descarga el ZIP al estar listo', async () => {
    const bodies: unknown[] = [];
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    server.use(
      http.post(CREATE_URL, async ({ request }) => {
        bodies.push(await request.json());

        return HttpResponse.json(makeJob(), { status: 202 });
      }),
      http.get(JOB_URL, () => HttpResponse.json(makeJob({ status: 'ready' }))),
    );

    renderAlbum(true);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' }),
    ).toBeTruthy();

    openAlbumMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Descargar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Descargar 342 fotos' });

    // El aviso llega antes de crear el job.
    expect(bodies).toEqual([]);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Generar ZIP' }));

    await waitFor(() => expect(bodies).toEqual([{}]));

    expect(
      await screen.findByText('ZIP listo, descarga iniciada', {}, { timeout: 4000 }),
    ).toBeTruthy();

    const anchors = clickSpy.mock.instances as unknown as HTMLAnchorElement[];

    expect(anchors.at(-1)?.getAttribute('href')).toBe('/api/downloads/job_album/file');
  });

  it('el botón de escritorio abre el aviso sin crear el job y el copy explica tamaño y ubicación (AC-06)', async () => {
    const bodies: unknown[] = [];

    server.use(
      http.post(CREATE_URL, async ({ request }) => {
        bodies.push(await request.json());

        return HttpResponse.json(makeJob(), { status: 202 });
      }),
    );

    renderAlbum(true);

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    fireEvent.click(screen.getByRole('button', { name: 'Descargar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Descargar 342 fotos' });

    expect(bodies).toEqual([]);
    expect(within(dialog).getByText(/100 MB/)).toBeTruthy();
    expect(within(dialog).getByText(/iPhone y Android/)).toBeTruthy();
    expect(within(dialog).getByText(/Archivos o en Descargas/)).toBeTruthy();
    expect(within(dialog).getByText(/seguir usando Memora/)).toBeTruthy();

    await expectNoAxeViolations(dialog);
  });

  it('la acción del menú móvil abre el mismo aviso y no crea el job', async () => {
    const bodies: unknown[] = [];

    server.use(
      http.post(CREATE_URL, async ({ request }) => {
        bodies.push(await request.json());

        return HttpResponse.json(makeJob(), { status: 202 });
      }),
    );

    renderAlbum(true);

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });
    openAlbumMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Descargar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Descargar 342 fotos' });

    expect(bodies).toEqual([]);
    expect(within(dialog).getByText(/100 MB/)).toBeTruthy();
  });

  it('cancelar el aviso no crea ningún job', async () => {
    const bodies: unknown[] = [];

    server.use(
      http.post(CREATE_URL, async ({ request }) => {
        bodies.push(await request.json());

        return HttpResponse.json(makeJob(), { status: 202 });
      }),
    );

    renderAlbum(true);

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    fireEvent.click(screen.getByRole('button', { name: 'Descargar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Descargar 342 fotos' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(bodies).toEqual([]);
  });

  it('el aviso enfoca «Cancelar» y se cierra con Esc sin crear el job', async () => {
    const bodies: unknown[] = [];

    server.use(
      http.post(CREATE_URL, async ({ request }) => {
        bodies.push(await request.json());

        return HttpResponse.json(makeJob(), { status: 202 });
      }),
    );

    renderAlbum(true);

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    fireEvent.click(screen.getByRole('button', { name: 'Descargar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Descargar 342 fotos' });
    const cancel = within(dialog).getByRole('button', { name: 'Cancelar' });

    await waitFor(() => {
      expect(document.activeElement).toBe(cancel);
    });

    fireEvent.keyDown(cancel, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(bodies).toEqual([]);
  });

  it('confirmar crea un único job aunque se pulse dos veces', async () => {
    const bodies: unknown[] = [];

    server.use(
      http.post(CREATE_URL, async ({ request }) => {
        bodies.push(await request.json());

        return HttpResponse.json(makeJob(), { status: 202 });
      }),
    );

    renderAlbum(true);

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    fireEvent.click(screen.getByRole('button', { name: 'Descargar álbum' }));

    const dialog = await screen.findByRole('dialog', { name: 'Descargar 342 fotos' });
    const confirm = within(dialog).getByRole('button', { name: 'Generar ZIP' });

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => expect(bodies).toEqual([{}]));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(bodies).toHaveLength(1);
  });

  it('sin permiso oculta la entrada del menú y deshabilita el botón con motivo', async () => {
    renderAlbum(false);

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    expect(
      (screen.getByRole('button', { name: 'Descargar álbum' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getByText('La descarga está desactivada en este círculo.')).toBeTruthy();

    openAlbumMenu();

    expect(screen.queryByRole('menuitem', { name: 'Descargar álbum' })).toBeNull();
  });
});
