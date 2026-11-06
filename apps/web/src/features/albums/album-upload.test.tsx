import type { AlbumDto, CircleDetailDto, PhotoDto } from '@memora/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AUTH_TEST_API_BASE, testUser } from '../../test/auth-fixtures';
import { createAuthTestServer, startAuthTestServer } from '../../test/auth-server';
import { albumWithPhotos } from '../../test/fixtures/albums-fixtures';
import { renderAlbumsRouter } from '../../test/fixtures/albums-router';
import { circleDetail, circleWithCover, testMeResponse } from '../../test/circles-fixtures';
import { CircleDetailProvider } from '../circles/circle-detail-context';
import type { UploadTransport, UploadTransportRequest } from '../uploads/transport';
import { UploadProvider } from '../uploads/upload-provider';
import { UploadQueueHost } from '../uploads/upload-queue-host';

import { AlbumDetailPage } from './album-detail-page';

/**
 * Integración de la cola en el álbum: soltar archivos, encolarlos para el
 * álbum abierto y refrescar su detalle al completar. También comprueba que sin
 * permiso de subida el dropzone no se activa.
 */

const server = createAuthTestServer();

const ME_URL = `${AUTH_TEST_API_BASE}/me`;
const CSRF_URL = `${AUTH_TEST_API_BASE}/auth/csrf`;
const CIRCLE_URL = `${AUTH_TEST_API_BASE}/circles/cir_familia`;
const ALBUMS_URL = `${CIRCLE_URL}/albums`;
const INVITATIONS_URL = `${CIRCLE_URL}/invitations`;
const ALBUM_URL = `${AUTH_TEST_API_BASE}/albums/alb_verano`;

const photo: PhotoDto = {
  id: 'photo-1',
  circleId: 'cir_familia',
  albumId: 'alb_verano',
  uploader: { id: testUser.id, name: testUser.name, avatarUrl: null },
  clientUploadId: null,
  description: null,
  takenAt: null,
  placeName: null,
  mimeType: 'image/jpeg',
  size: 10,
  width: 100,
  height: 100,
  thumbUrl: '/api/photos/photo-1/image?size=thumb',
  displayUrl: '/api/photos/photo-1/image?size=display',
  tags: [],
  createdAt: '2026-11-05T10:00:00.000Z',
  updatedAt: '2026-11-05T10:00:00.000Z',
};

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

function dataTransfer(files: readonly File[]): DataTransfer {
  return {
    files,
    items: files.map((file) => ({
      kind: 'file',
      type: file.type,
      getAsFile: () => file,
    })),
    types: ['Files'],
    dropEffect: 'none',
  } as unknown as DataTransfer;
}

function imageFile(name = 'playa.jpg'): File {
  return new File(['contenido'], name, { type: 'image/jpeg' });
}

function memberWithoutUpload(): CircleDetailDto {
  return circleDetail({
    ...circleWithCover,
    role: 'member',
    settings: { ...circleWithCover.settings, membersCanUpload: false },
  });
}

interface RenderAlbumOptions {
  readonly transport: UploadTransport;
  readonly circle?: CircleDetailDto;
  readonly onAlbumRequest?: () => void;
}

function renderAlbum({
  transport,
  circle = circleDetail(circleWithCover),
  onAlbumRequest,
}: RenderAlbumOptions) {
  const album: AlbumDto = albumWithPhotos;

  server.use(
    http.get(ME_URL, () => HttpResponse.json(testMeResponse)),
    http.get(CIRCLE_URL, () => HttpResponse.json(circle)),
    http.get(INVITATIONS_URL, () => HttpResponse.json({ items: [], nextCursor: null })),
    http.get(ALBUMS_URL, () => HttpResponse.json({ items: [album], nextCursor: null })),
    http.get(ALBUM_URL, () => {
      onAlbumRequest?.();
      return HttpResponse.json(album);
    }),
    http.get(CSRF_URL, () => HttpResponse.json({ csrfToken: 'csrf-detail' })),
  );

  return renderAlbumsRouter(
    <UploadProvider transport={transport}>
      <UploadQueueHost />
      <CircleDetailProvider
        circle={circle}
        openInvite={vi.fn()}
        focusTitle={vi.fn()}
        canCreateAlbum
      >
        <main id="main-content" tabIndex={-1}>
          <AlbumDetailPage circleId={circle.id} albumId={album.id} />
        </main>
      </CircleDetailProvider>
    </UploadProvider>,
    `/circles/${circle.id}/albums/${album.id}`,
  );
}

function hangingTransport() {
  const requests: UploadTransportRequest[] = [];
  const upload: UploadTransport['upload'] = (request) => {
    requests.push(request);

    return new Promise<PhotoDto>(() => {});
  };

  return { requests, transport: { upload } };
}

function galleryInputs(): HTMLInputElement[] {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>('input[aria-label="Elegir fotos de la galería"]'),
  );
}

function mockDesktop(): void {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query.includes('min-width: 1024px'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

describe('AlbumDetailPage · integración de subidas', () => {
  it('soltar archivos los encola para el álbum abierto y abre la cola', async () => {
    const fake = hangingTransport();
    renderAlbum({ transport: fake.transport });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    const transfer = dataTransfer([imageFile()]);

    fireEvent.dragEnter(window, { dataTransfer: transfer });

    expect(screen.getByText('Suelta para subir 1 foto')).toBeTruthy();

    fireEvent.drop(window, { dataTransfer: transfer });

    await waitFor(() => expect(fake.requests).toHaveLength(1));

    expect(fake.requests[0]).toMatchObject({ albumId: 'alb_verano' });
    expect(fake.requests[0]?.fields.clientUploadId.length).toBeGreaterThan(0);
    expect(fake.requests[0]?.file.name).toBe('playa.jpg');

    expect(await screen.findByRole('heading', { name: 'Subidas' })).toBeTruthy();
    expect(screen.getByText('playa.jpg')).toBeTruthy();
  });

  it('al completar la subida se invalida y se vuelve a pedir el detalle del álbum', async () => {
    let albumRequests = 0;
    const upload: UploadTransport['upload'] = async () => photo;

    renderAlbum({
      transport: { upload },
      onAlbumRequest: () => {
        albumRequests += 1;
      },
    });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    const initialRequests = albumRequests;

    expect(initialRequests).toBeGreaterThanOrEqual(1);

    const galleryInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[aria-label="Elegir fotos de la galería"]'),
    );
    const firstInput = galleryInputs[0];

    if (firstInput === undefined) {
      throw new Error('No se ha montado el selector de galería');
    }

    await userEvent.upload(firstInput, imageFile('recuerdo.jpg'));

    await waitFor(() => expect(albumRequests).toBeGreaterThan(initialRequests), {
      timeout: 3000,
    });
    expect(await screen.findByRole('heading', { name: 'Subidas' })).toBeTruthy();
  });

  it('monta la entrada de cabecera y el FAB con el mismo texto, ambas habilitadas', async () => {
    renderAlbum({ transport: hangingTransport().transport });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    const uploadButtons = screen.getAllByRole('button', { name: 'Subir fotos' });

    expect(uploadButtons).toHaveLength(2);

    for (const button of uploadButtons) {
      expect((button as HTMLButtonElement).disabled).toBe(false);
    }
  });

  it('al cerrar la hoja con Esc devuelve el foco a la barra de subidas', async () => {
    const fake = hangingTransport();
    renderAlbum({ transport: fake.transport });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    const firstInput = galleryInputs()[0];

    if (firstInput === undefined) {
      throw new Error('No se ha montado el selector de galería');
    }

    await userEvent.upload(firstInput, imageFile('foco.jpg'));

    await waitFor(() => expect(fake.requests).toHaveLength(1));
    await screen.findByRole('heading', { name: 'Subidas' });

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    const bar = await screen.findByRole('button', { name: /Abrir subidas\./ });

    fireEvent.click(bar);
    await screen.findByRole('heading', { name: 'Subidas' });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(document.activeElement).toBe(bar));
  });

  it('al cerrar con la cola vacía enfoca el contenido principal y no deja el foco en body', async () => {
    const upload = vi.fn(async () => photo);
    renderAlbum({ transport: { upload } });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    const firstInput = galleryInputs()[0];

    if (firstInput === undefined) {
      throw new Error('No se ha montado el selector de galería');
    }

    await userEvent.upload(firstInput, imageFile('foco-vacio.jpg'));

    expect(await screen.findByText('Completada')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar terminadas' }));

    expect(await screen.findByText('Todavía no hay subidas.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    await waitFor(() =>
      expect(document.activeElement).toBe(document.getElementById('main-content')),
    );
    expect(document.activeElement).not.toBe(document.body);
  });

  it('muestra el copy de sesión si falla el prefetch de CSRF', async () => {
    const fake = hangingTransport();
    renderAlbum({ transport: fake.transport });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    server.use(
      http.get(CSRF_URL, () =>
        HttpResponse.json(
          {
            code: 'UNAUTHENTICATED',
            message: 'Inicia sesión para continuar.',
            details: null,
          },
          { status: 401 },
        ),
      ),
    );

    const firstInput = galleryInputs()[0];

    if (firstInput === undefined) {
      throw new Error('No se ha montado el selector de galería');
    }

    await userEvent.upload(firstInput, imageFile('csrf.jpg'));

    expect(await screen.findByText('Tu sesión ha caducado. Vuelve a entrar.')).toBeTruthy();
    expect(
      screen.queryByText('Algo ha fallado en el servidor. Reintenta en unos segundos.'),
    ).toBeNull();
  });

  it('al abrir desde la barra en escritorio enfoca el panel; el autoabrir no roba el foco', async () => {
    mockDesktop();
    const fake = hangingTransport();
    renderAlbum({ transport: fake.transport });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    const firstInput = galleryInputs()[0];

    if (firstInput === undefined) {
      throw new Error('No se ha montado el selector de galería');
    }

    await userEvent.upload(firstInput, imageFile('panel.jpg'));

    await waitFor(() => expect(fake.requests).toHaveLength(1));

    const autoClose = await screen.findByRole('button', { name: 'Cerrar subidas' });

    // El autoabrir tras encolar no mueve el foco al panel.
    expect(document.activeElement).not.toBe(autoClose);

    fireEvent.click(autoClose);

    const bar = await screen.findByRole('button', { name: /Abrir subidas\./ });

    expect(bar.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(bar);

    const close = await screen.findByRole('button', { name: 'Cerrar subidas' });
    const controls = bar.getAttribute('aria-controls');

    expect(bar.getAttribute('aria-expanded')).toBe('true');
    expect(controls).not.toBeNull();
    expect(document.getElementById(controls ?? '')).toBe(
      screen.getByRole('complementary', { name: 'Subidas' }),
    );
    await waitFor(() => expect(document.activeElement).toBe(close));
  });

  it('sin membersCanUpload el dropzone no captura archivos ni encola nada', async () => {
    const fake = hangingTransport();
    renderAlbum({ transport: fake.transport, circle: memberWithoutUpload() });

    await screen.findByRole('heading', { level: 1, name: 'Verano en Mallorca' });

    expect(screen.queryByRole('button', { name: 'Subir fotos' })).toBeNull();

    const transfer = dataTransfer([imageFile()]);

    fireEvent.dragEnter(window, { dataTransfer: transfer });
    expect(screen.queryByText(/Suelta para subir/)).toBeNull();

    fireEvent.drop(window, { dataTransfer: transfer });

    await new Promise((resolve) => {
      window.setTimeout(resolve, 20);
    });

    expect(fake.requests).toHaveLength(0);
    expect(screen.queryByRole('heading', { name: 'Subidas' })).toBeNull();
  });
});
