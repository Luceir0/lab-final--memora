import type { PhotoDto } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { expectNoAxeViolations } from '../../../../../packages/ui/src/test/axe';
import { UploadTransportError } from './errors';
import type { UploadTransport, UploadTransportRequest } from './transport';
import { UploadProvider } from './upload-provider';
import { UploadQueue } from './upload-queue';
import { UploadQueueBar } from './upload-queue-bar';
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

function createHangingTransport() {
  const upload = vi.fn(
    (_request: UploadTransportRequest) => new Promise<PhotoDto>(() => undefined),
  );

  return { upload, transport: { upload } as UploadTransport };
}

function imageFile(name: string): File {
  return new File(['contenido'], name, { type: 'image/jpeg' });
}

function BarHarness({ files }: { readonly files: readonly File[] }) {
  const { enqueue } = useUploadQueue();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          enqueue(files, {
            albumId: 'album-1',
            albumTitle: 'Verano',
            source: 'gallery',
          });
          setOpen(true);
        }}
      >
        añadir
      </button>
      <UploadQueue
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        panelId="upload-panel"
      />
      <UploadQueueBar
        open={open}
        panelId="upload-panel"
        onOpen={() => {
          setOpen(true);
        }}
      />
    </>
  );
}

function renderBar(files: readonly File[], transport: UploadTransport) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <UploadProvider transport={transport}>
        <BarHarness files={files} />
      </UploadProvider>
    </QueryClientProvider>,
  );

  return view;
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

async function openAndClose(files: readonly File[], transport: UploadTransport) {
  const view = renderBar(files, transport);

  fireEvent.click(screen.getByRole('button', { name: 'añadir' }));

  await waitFor(() => expect(screen.getByRole('heading', { name: 'Subidas' })).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

  return view;
}

async function openAndCloseDesktop(files: readonly File[], transport: UploadTransport) {
  renderBar(files, transport);

  fireEvent.click(screen.getByRole('button', { name: 'añadir' }));

  await waitFor(() => expect(screen.getByRole('complementary', { name: 'Subidas' })).toBeTruthy());

  // Mientras el panel está abierto la barra sigue montada pero inert.
  const hiddenBar = screen.getByRole('button', { name: /Abrir subidas\./ });
  expect(hiddenBar.closest('[inert]')).not.toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Cerrar subidas' }));
}

beforeEach(() => {
  fetchCsrfTokenMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('UploadQueueBar', () => {
  it('no aparece sin items', () => {
    renderBar([], createHangingTransport().transport);

    expect(screen.queryByRole('button', { name: /Abrir subidas/ })).toBeNull();
  });

  it('sin subidas activas informa de que han terminado y reabre la cola', async () => {
    const upload = vi.fn(async () => photo);
    await openAndClose([imageFile('foto-1.jpg')], { upload });

    const bar = await screen.findByRole('button', { name: /Abrir subidas\./ });

    expect(screen.getByText('Subidas terminadas · 1 de 1')).toBeTruthy();
    expect(screen.getByText('100 %')).toBeTruthy();
    expect(bar.getAttribute('aria-label')).toContain('Subidas terminadas · 1 de 1');
    expect(bar.getAttribute('aria-label')).toContain('100 %');
    expect(bar.parentElement?.querySelector('[role="progressbar"]')).toBeTruthy();

    fireEvent.click(bar);

    expect(await screen.findByRole('heading', { name: 'Subidas' })).toBeTruthy();
    expect(bar.closest('[inert]')).not.toBeNull();
  });

  it('con errores no dice «Subiendo» e incluye el número de fallidas', async () => {
    const upload = vi.fn(async () => {
      throw new UploadTransportError('FILE_TOO_LARGE', 413);
    });
    await openAndClose([imageFile('foto-1.jpg')], { upload });

    const bar = await screen.findByRole('button', { name: /Abrir subidas\./ });

    expect(screen.getByText('0 de 1')).toBeTruthy();
    expect(screen.getByText('1 con error')).toBeTruthy();
    expect(bar.getAttribute('aria-label')).toContain('0 de 1');
    expect(bar.getAttribute('aria-label')).toContain('1 con error');
    expect(bar.getAttribute('aria-label')).not.toContain('Subiendo');
  });

  it('mientras hay subidas activas usa «Subiendo» y el porcentaje', async () => {
    const fake = createHangingTransport();
    const view = renderBar([imageFile('foto-1.jpg')], fake.transport);

    fireEvent.click(screen.getByRole('button', { name: 'añadir' }));
    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    const bar = await screen.findByRole('button', { name: /Abrir subidas\./ });

    expect(screen.getByText('Subiendo 0 de 1')).toBeTruthy();
    expect(screen.getByText('0 %')).toBeTruthy();
    expect(bar.getAttribute('aria-label')).toContain('Subiendo 0 de 1');
    expect(bar.getAttribute('aria-label')).toContain('0 %');
    expect(screen.queryByRole('button', { name: 'Cerrar subidas terminadas' })).toBeNull();

    await expectNoAxeViolations(view.container);
  });

  it('la X cierra los terminados al instante y no reabre el panel', async () => {
    const upload = vi.fn(async () => photo);
    const view = await openAndClose([imageFile('foto-1.jpg')], { upload });

    const dismiss = await screen.findByRole('button', { name: 'Cerrar subidas terminadas' });

    expect(screen.getByText('Subidas terminadas · 1 de 1')).toBeTruthy();
    await expectNoAxeViolations(view.container);

    fireEvent.click(dismiss);

    expect(screen.queryByRole('button', { name: /Abrir subidas\./ })).toBeNull();
    expect(screen.queryByText('Subidas terminadas · 1 de 1')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Subidas' })).toBeNull();
  });

  it('publica la altura real de la barra en el documento mientras hay items', async () => {
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

    const fake = createHangingTransport();
    const view = renderBar([imageFile('foto-1.jpg')], fake.transport);

    fireEvent.click(screen.getByRole('button', { name: 'añadir' }));
    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    expect(document.documentElement.dataset.uploadBar).toBe('visible');

    const barButton = await screen.findByRole('button', { name: /Abrir subidas\./ });
    const bar = barButton.parentElement;

    if (bar === null) {
      throw new Error('La barra de subidas debería tener un contenedor');
    }

    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({
      height: 72,
      width: 360,
      top: 0,
      bottom: 72,
      left: 0,
      right: 360,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    act(() => {
      observerCallback?.([], {} as ResizeObserver);
    });

    expect(document.documentElement.style.getPropertyValue('--upload-queue-bar-height')).toBe(
      '72px',
    );

    view.unmount();

    expect(document.documentElement.dataset.uploadBar).toBeUndefined();
    expect(document.documentElement.style.getPropertyValue('--upload-queue-bar-height')).toBe('');
  });

  it('en escritorio aparece al cerrar el panel y lo reabre', async () => {
    mockDesktop();
    const fake = createHangingTransport();

    await openAndCloseDesktop([imageFile('foto-1.jpg')], fake.transport);

    const bar = await screen.findByRole('button', { name: /Abrir subidas\./ });

    expect(bar.getAttribute('aria-controls')).toBeNull();

    fireEvent.click(bar);

    const panel = await screen.findByRole('complementary', { name: 'Subidas' });

    expect(bar.getAttribute('aria-controls')).toBe(panel.id);
  });
});
