import type { PhotoDto } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COMPLETED_DISMISS_DELAY_MS } from './completed-dismiss';
import { UploadTransportError } from './errors';
import type { UploadTransport, UploadTransportRequest } from './transport';
import { UploadProvider } from './upload-provider';
import { UploadQueueHost } from './upload-queue-host';
import { useUploadQueue } from './upload-queue-context';

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

const { fetchCsrfTokenMock } = vi.hoisted(() => ({
  fetchCsrfTokenMock: vi.fn(async () => 'csrf-token'),
}));

vi.mock('../../lib/csrf', () => ({ fetchCsrfToken: fetchCsrfTokenMock }));

function createHangingTransport() {
  const upload = vi.fn((_request: UploadTransportRequest) => new Promise<PhotoDto>(() => {}));

  return { upload, transport: { upload } as UploadTransport };
}

function HostHarness() {
  const { enqueue } = useUploadQueue();
  const add = (name: string, type = 'image/jpeg') => {
    enqueue([new File(['x'], name, { type })], {
      albumId: 'album-1',
      albumTitle: 'Verano',
      source: 'desktop',
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          add('foto.jpg');
        }}
      >
        añadir
      </button>
      <button
        type="button"
        onClick={() => {
          add('animado.gif', 'image/gif');
        }}
      >
        añadir inválida
      </button>
      <main id="main-content" tabIndex={-1}>
        Contenido
      </main>
      <UploadQueueHost />
    </>
  );
}

function renderHostWith(transport: UploadTransport) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <UploadProvider transport={transport}>
        <HostHarness />
      </UploadProvider>
    </QueryClientProvider>,
  );
}

function renderHost() {
  const fake = createHangingTransport();
  renderHostWith(fake.transport);
  return fake;
}

async function advanceTimers(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
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

beforeEach(() => {
  fetchCsrfTokenMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('UploadQueueHost', () => {
  it('monta una sola barra y un solo panel, y abre sin mover el foco al encolar', async () => {
    mockDesktop();
    const fake = renderHost();
    const addButton = screen.getByRole('button', { name: 'añadir' });

    addButton.focus();
    fireEvent.click(addButton);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    expect(screen.getAllByRole('button', { name: /Abrir subidas\./ })).toHaveLength(1);
    expect(screen.getAllByRole('complementary', { name: 'Subidas' })).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Subidas' })).toBeTruthy();

    // El autoabrir tras encolar no roba el foco al disparador.
    expect(document.activeElement).toBe(addButton);
  });

  it('abre desde la barra con foco en el panel y lo devuelve a la barra al cerrar', async () => {
    mockDesktop();
    const fake = renderHost();
    const addButton = screen.getByRole('button', { name: 'añadir' });

    addButton.focus();
    fireEvent.click(addButton);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar subidas' }));

    const bar = await screen.findByRole('button', { name: /Abrir subidas\./ });

    await waitFor(() => expect(document.activeElement).toBe(bar));
    expect(bar.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(bar);

    const close = await screen.findByRole('button', { name: 'Cerrar subidas' });

    await waitFor(() => expect(document.activeElement).toBe(close));
    expect(bar.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(close);

    await waitFor(() => expect(document.activeElement).toBe(bar));
  });

  it('abre aunque todos los archivos fallen la validación de cliente', async () => {
    mockDesktop();
    const fake = renderHost();

    fireEvent.click(screen.getByRole('button', { name: 'añadir inválida' }));

    expect(await screen.findByRole('heading', { name: 'Subidas' })).toBeTruthy();
    expect(await screen.findByText('Formato no admitido. Usa JPEG, PNG o WebP.')).toBeTruthy();
    expect(fake.upload).not.toHaveBeenCalled();
  });

  it('publica el panel abierto en el documento solo en escritorio', async () => {
    mockDesktop();
    const fake = renderHost();

    fireEvent.click(screen.getByRole('button', { name: 'añadir' }));
    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    expect(document.documentElement.dataset.uploadPanel).toBe('open');

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar subidas' }));

    await waitFor(() => expect(document.documentElement.dataset.uploadPanel).toBeUndefined());
  });

  it('en móvil no publica el dataset del panel de escritorio', async () => {
    const fake = renderHost();

    fireEvent.click(screen.getByRole('button', { name: 'añadir' }));
    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    expect(screen.getByRole('heading', { name: 'Subidas' })).toBeTruthy();
    expect(document.documentElement.dataset.uploadPanel).toBeUndefined();
  });

  it('auto-cierra los terminados a los 10 s y devuelve el foco a main', async () => {
    vi.useFakeTimers();
    mockDesktop();
    const upload = vi.fn(async () => photo);
    renderHostWith({ upload });
    const main = screen.getByRole('main');

    fireEvent.click(screen.getByRole('button', { name: 'añadir' }));

    await advanceTimers(0);

    expect(screen.getByText('Subidas terminadas · 1 de 1')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar subidas' }));

    await advanceTimers(0);

    expect(screen.getByRole('button', { name: /Abrir subidas\./ })).toBeTruthy();

    await advanceTimers(COMPLETED_DISMISS_DELAY_MS);

    vi.useRealTimers();

    expect(screen.queryByText('Subidas terminadas · 1 de 1')).toBeNull();
    expect(screen.queryByRole('button', { name: /Abrir subidas\./ })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Subidas' })).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(main));
  });

  it('no auto-cierra si queda algún error para reintentar', async () => {
    vi.useFakeTimers();
    mockDesktop();
    const upload = vi.fn(async () => {
      throw new UploadTransportError('FILE_TOO_LARGE', 413);
    });
    renderHostWith({ upload });

    fireEvent.click(screen.getByRole('button', { name: 'añadir' }));

    await advanceTimers(0);

    const bar = screen.getByRole('button', { name: /Abrir subidas\./ });

    expect(bar.getAttribute('aria-label')).toContain('1 con error');

    await advanceTimers(COMPLETED_DISMISS_DELAY_MS);

    const stillThere = screen.getByRole('button', { name: /Abrir subidas\./ });

    expect(stillThere.getAttribute('aria-label')).toContain('1 con error');

    vi.useRealTimers();
  });

  it('la X descarta los terminados y enfoca main sin reabrir el panel', async () => {
    mockDesktop();
    const upload = vi.fn(async () => photo);
    renderHostWith({ upload });
    const main = screen.getByRole('main');

    fireEvent.click(screen.getByRole('button', { name: 'añadir' }));

    await screen.findByText('Subidas terminadas · 1 de 1');

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar subidas' }));

    const dismiss = await screen.findByRole('button', { name: 'Cerrar subidas terminadas' });

    expect(screen.queryByRole('heading', { name: 'Subidas' })).toBeNull();

    fireEvent.click(dismiss);

    expect(screen.queryByRole('button', { name: /Abrir subidas\./ })).toBeNull();
    expect(screen.queryByText('Subidas terminadas · 1 de 1')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Subidas' })).toBeNull();

    await waitFor(() => expect(document.activeElement).toBe(main));
  });
});
