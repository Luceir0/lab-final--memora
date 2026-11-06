import type { PhotoDto } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UploadTransportError } from './errors';
import type { UploadTransport, UploadTransportRequest } from './transport';
import { UploadProvider } from './upload-provider';
import { UploadQueue } from './upload-queue';
import { useUploadQueue } from './upload-queue-context';

const { fetchCsrfTokenMock } = vi.hoisted(() => ({
  fetchCsrfTokenMock: vi.fn(async () => 'csrf-token'),
}));

vi.mock('../../lib/csrf', () => ({ fetchCsrfToken: fetchCsrfTokenMock }));

const photo: PhotoDto = {
  id: 'photo-1',
  circleId: 'circle-1',
  albumId: 'album-1',
  uploader: { id: 'user-1', name: 'Lucía', avatarUrl: null },
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

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function createFakeTransport() {
  const requests: UploadTransportRequest[] = [];
  const deferreds: Deferred<PhotoDto>[] = [];
  const upload = vi.fn((request: UploadTransportRequest) => {
    requests.push(request);
    const pending = deferred<PhotoDto>();
    deferreds.push(pending);

    request.signal.addEventListener(
      'abort',
      () => pending.reject(new UploadTransportError('CANCELLED', null)),
      { once: true },
    );

    return pending.promise;
  });

  return { upload, requests, deferreds, transport: { upload } as UploadTransport };
}

function imageFile(name: string): File {
  return new File(['contenido'], name, { type: 'image/jpeg' });
}

function QueueHarness({ files }: { readonly files: readonly File[] }) {
  const { enqueue } = useUploadQueue();
  const [open, setOpen] = useState(true);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          enqueue(files, {
            albumId: 'album-1',
            albumTitle: 'Verano en Mallorca',
            source: 'gallery',
          });
        }}
      >
        añadir
      </button>
      <button
        type="button"
        onClick={() => {
          enqueue([imageFile('otra.jpg')], {
            albumId: 'album-2',
            albumTitle: 'Invierno',
            source: 'gallery',
          });
        }}
      >
        añadir otro
      </button>
      <UploadQueue
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        panelId="upload-panel"
      />
    </>
  );
}

function renderQueue(files: readonly File[]) {
  const fake = createFakeTransport();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <UploadProvider transport={fake.transport}>
        <QueueHarness files={files} />
      </UploadProvider>
    </QueryClientProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'añadir' }));

  return { fake, queryClient };
}

beforeEach(() => {
  fetchCsrfTokenMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

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

describe('UploadQueue', () => {
  it('pinta estados, progreso global y progreso por archivo', async () => {
    const files = ['foto-1.jpg', 'foto-2.jpg', 'foto-3.jpg', 'foto-4.jpg'].map(imageFile);
    const { fake } = renderQueue(files);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(3));

    expect(screen.getByRole('heading', { name: 'Subidas' })).toBeTruthy();
    expect(screen.getByText('0 de 4 subidas')).toBeTruthy();
    expect(screen.getAllByText('Subiendo · 0 %')).toHaveLength(3);
    expect(screen.getByText('En cola')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Archivos en la cola' })).toBeTruthy();
    expect(screen.getByText('Puedes seguir usando Memora mientras se suben.')).toBeTruthy();

    const globalProgress = screen.getByRole('progressbar', {
      name: 'Progreso de las subidas',
    });
    expect(globalProgress.getAttribute('aria-valuenow')).toBe('0');

    act(() => {
      fake.requests[0]?.onProgress(40);
    });

    expect(screen.getByText('Subiendo · 40 %')).toBeTruthy();
    expect(
      screen
        .getByRole('progressbar', { name: 'Subida de foto-1.jpg' })
        .getAttribute('aria-valuenow'),
    ).toBe('40');

    await act(async () => {
      fake.deferreds[0]?.resolve(photo);
    });

    await waitFor(() => expect(screen.getByText('Completada')).toBeTruthy());
    expect(screen.getByText('1 de 4 subidas')).toBeTruthy();
  });

  it('muestra el error de un archivo sin ocultar los demás y permite reintentar', async () => {
    const files = ['foto-1.jpg', 'foto-2.jpg'].map(imageFile);
    const { fake } = renderQueue(files);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(2));
    const firstClientUploadId = fake.requests[0]?.fields.clientUploadId;

    await act(async () => {
      fake.deferreds[0]?.reject(new UploadTransportError('FILE_TOO_LARGE', 413));
    });

    expect(await screen.findByText('El archivo supera los 25 MB.')).toBeTruthy();
    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText('1 con error')).toBeTruthy();
    expect(screen.getByText('foto-2.jpg')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reintentar fallidas (1)' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar foto-1.jpg' }));

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(3));
    expect(fake.requests[2]?.fields.clientUploadId).toBe(firstClientUploadId);
  });

  it('descarta una fallida sin tocar a los demás archivos', async () => {
    const files = ['foto-1.jpg', 'foto-2.jpg'].map(imageFile);
    const { fake } = renderQueue(files);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(2));

    await act(async () => {
      fake.deferreds[0]?.reject(new UploadTransportError('FILE_TOO_LARGE', 413));
    });

    expect(await screen.findByText('Error')).toBeTruthy();
    expect(screen.getByText('foto-2.jpg')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Descartar foto-1.jpg' }));

    expect(screen.queryByText('foto-1.jpg')).toBeNull();
    expect(screen.getByText('foto-2.jpg')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Descartar fallidas/ })).toBeNull();
  });

  it('descarta todas las fallidas desde el pie', async () => {
    const files = ['foto-1.jpg', 'foto-2.jpg'].map(imageFile);
    const { fake } = renderQueue(files);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(2));

    await act(async () => {
      fake.deferreds[0]?.reject(new UploadTransportError('FILE_TOO_LARGE', 413));
      fake.deferreds[1]?.reject(new UploadTransportError('UNSUPPORTED_MEDIA_TYPE', 415));
    });

    expect(await screen.findByRole('button', { name: 'Descartar fallidas (2)' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Descartar fallidas (2)' }));

    expect(await screen.findByText('Todavía no hay subidas.')).toBeTruthy();
    expect(screen.queryByText('foto-1.jpg')).toBeNull();
    expect(screen.queryByText('foto-2.jpg')).toBeNull();
  });

  it('cancela un archivo, cancela todo y limpia las completadas', async () => {
    const files = ['foto-1.jpg', 'foto-2.jpg'].map(imageFile);
    const { fake } = renderQueue(files);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar foto-1.jpg' }));

    await waitFor(() => expect(screen.getByText('Cancelada')).toBeTruthy());
    expect(fake.requests[0]?.signal.aborted).toBe(true);
    expect(screen.getByRole('button', { name: 'Reintentar foto-1.jpg' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar todo' }));

    await waitFor(() => expect(screen.getAllByText('Cancelada')).toHaveLength(2));
    expect(screen.getByText('2 canceladas')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Limpiar terminadas' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar terminadas' }));

    expect(await screen.findByText('Todavía no hay subidas.')).toBeTruthy();
    expect(screen.queryByText('0 de 0 subidas')).toBeNull();
  });

  it('no muestra contadores en cero en el pie', async () => {
    renderQueue([imageFile('foto-1.jpg')]);

    await waitFor(() => expect(screen.getByText('Subiendo · 0 %')).toBeTruthy());

    expect(screen.queryByRole('button', { name: /Reintentar fallidas/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Descartar fallidas/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Limpiar terminadas' })).toBeNull();
  });

  it('en escritorio usa un panel no modal anclado, sin diálogo ni fondo', async () => {
    mockDesktop();
    const { fake } = renderQueue([imageFile('foto-1.jpg')]);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    expect(screen.getByRole('complementary', { name: 'Subidas' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('[data-overlay-backdrop]')).toBeNull();
  });

  it('en escritorio, Esc cierra el panel no modal', async () => {
    mockDesktop();
    const { fake } = renderQueue([imageFile('foto-1.jpg')]);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByRole('complementary', { name: 'Subidas' })).toBeNull(),
    );
  });

  it('con un solo álbum no repite su nombre en cada archivo', async () => {
    const { fake } = renderQueue([imageFile('foto-1.jpg')]);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    expect(screen.queryByText('Verano en Mallorca')).toBeNull();
  });

  it('muestra el álbum por archivo solo cuando la cola mezcla álbumes', async () => {
    const { fake } = renderQueue([imageFile('foto-1.jpg')]);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'añadir otro' }));

    expect(await screen.findByText('Verano en Mallorca')).toBeTruthy();
    expect(screen.getByText('Invierno')).toBeTruthy();
  });

  it('tras cancelar mantiene el foco dentro del diálogo, no en body', async () => {
    const { fake } = renderQueue([imageFile('foto-1.jpg')]);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar foto-1.jpg' }));

    const body = screen.getByRole('group', { name: 'Subidas' });

    await waitFor(() => expect(document.activeElement).toBe(body));
    expect(body.closest('[role="dialog"]')).not.toBeNull();
    expect(document.activeElement).not.toBe(document.body);
  });

  it('tras reintentar mantiene el foco dentro del diálogo, no en body', async () => {
    const { fake } = renderQueue([imageFile('foto-1.jpg')]);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    await act(async () => {
      fake.deferreds[0]?.reject(new UploadTransportError('FILE_TOO_LARGE', 413));
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar foto-1.jpg' }));

    const body = screen.getByRole('group', { name: 'Subidas' });

    await waitFor(() => expect(document.activeElement).toBe(body));
    expect(body.closest('[role="dialog"]')).not.toBeNull();
  });

  it('tras descartar una fila mantiene el foco dentro del diálogo, no en body', async () => {
    const { fake } = renderQueue([imageFile('foto-1.jpg')]);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    await act(async () => {
      fake.deferreds[0]?.reject(new UploadTransportError('FILE_TOO_LARGE', 413));
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Descartar foto-1.jpg' }));

    const body = screen.getByRole('group', { name: 'Subidas' });

    await waitFor(() => expect(document.activeElement).toBe(body));
    expect(screen.getByText('Todavía no hay subidas.')).toBeTruthy();
    expect(body.closest('[role="dialog"]')).not.toBeNull();
  });

  it('tras limpiar terminadas mantiene el foco dentro del diálogo, no en body', async () => {
    const { fake } = renderQueue([imageFile('foto-1.jpg')]);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    await act(async () => {
      fake.deferreds[0]?.resolve(photo);
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Limpiar terminadas' }));

    const body = screen.getByRole('group', { name: 'Subidas' });

    await waitFor(() => expect(document.activeElement).toBe(body));
    expect(screen.getByText('Todavía no hay subidas.')).toBeTruthy();
    expect(body.closest('[role="dialog"]')).not.toBeNull();
  });

  it('en escritorio el foco tras cancelar queda dentro del panel, no en body', async () => {
    mockDesktop();
    const { fake } = renderQueue([imageFile('foto-1.jpg')]);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar foto-1.jpg' }));

    const panel = screen.getByRole('complementary', { name: 'Subidas' });
    const body = screen.getByRole('group', { name: 'Subidas' });

    await waitFor(() => expect(document.activeElement).toBe(body));
    expect(panel.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(document.body);
  });
});
