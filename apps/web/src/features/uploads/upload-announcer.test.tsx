import type { PhotoDto } from '@memora/shared';
import { BottomSheet } from '@memora/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UploadItem } from './types';
import { UploadTransportError } from './errors';
import type { UploadTransport, UploadTransportRequest } from './transport';
import { UploadAnnouncer } from './upload-announcer';
import { UploadProvider } from './upload-provider';
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

function AnnouncerHarness() {
  const { enqueue } = useUploadQueue();

  return (
    <button
      type="button"
      onClick={() => {
        enqueue([new File(['x'], 'foto-1.jpg', { type: 'image/jpeg' })], {
          albumId: 'album-1',
          albumTitle: 'Verano',
          source: 'gallery',
        });
      }}
    >
      añadir
    </button>
  );
}

function renderAnnouncer() {
  const fake = createFakeTransport();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <UploadProvider transport={fake.transport}>
        <AnnouncerHarness />
      </UploadProvider>
    </QueryClientProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: 'añadir' }));

  return fake;
}

function OverlayHarness() {
  const { enqueue } = useUploadQueue();

  return (
    <BottomSheet open onClose={vi.fn()} title="Hoja de prueba">
      <button
        type="button"
        onClick={() => {
          enqueue([new File(['x'], 'foto-1.jpg', { type: 'image/jpeg' })], {
            albumId: 'album-1',
            albumTitle: 'Verano',
            source: 'gallery',
          });
        }}
      >
        añadir en la hoja
      </button>
    </BottomSheet>
  );
}

function liveRegion(): HTMLElement {
  const region = document.querySelector<HTMLElement>('[aria-live="polite"]');

  if (region === null) {
    throw new Error('No hay región aria-live');
  }

  return region;
}

function item(status: UploadItem['status']): UploadItem {
  const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
  const base = {
    id: 'item-1',
    file,
    albumId: 'album-1',
    albumTitle: 'Verano',
    source: 'gallery' as const,
    previewUrl: '',
    originalName: file.name,
    clientUploadId: 'client-1',
    size: file.size,
    attempts: 1,
  };

  switch (status) {
    case 'done':
      return { ...base, status, progress: 100, photoId: 'photo-1' };
    case 'error':
      return {
        ...base,
        status,
        progress: 0,
        error: { code: 'FILE_TOO_LARGE', status: 413, message: 'x' },
      };
    case 'uploading':
      return { ...base, status, progress: 0 };
    case 'cancelled':
      return { ...base, status, progress: 0 };
    case 'pending':
      return { ...base, status, progress: 0 };
  }
}

beforeEach(() => {
  fetchCsrfTokenMock.mockClear();
});

describe('UploadAnnouncer', () => {
  it('anuncia añadida y completada con la cola cerrada, sin porcentajes', async () => {
    const fake = renderAnnouncer();

    expect(await screen.findByText('Se ha añadido foto-1.jpg a la cola.')).toBeTruthy();

    act(() => {
      fake.requests[0]?.onProgress(40);
    });

    expect(liveRegion().textContent).toContain('Se ha añadido foto-1.jpg a la cola.');
    expect(liveRegion().textContent).not.toContain('40 %');

    await act(async () => {
      fake.deferreds[0]?.resolve(photo);
    });

    expect(await screen.findByText('foto-1.jpg se ha subido.')).toBeTruthy();
  });

  it('anuncia el error con el motivo de la UI', async () => {
    const fake = renderAnnouncer();

    expect(await screen.findByText('Se ha añadido foto-1.jpg a la cola.')).toBeTruthy();

    await act(async () => {
      fake.deferreds[0]?.reject(new UploadTransportError('FILE_TOO_LARGE', 413));
    });

    expect(
      await screen.findByText('No se pudo subir foto-1.jpg. El archivo supera los 25 MB.'),
    ).toBeTruthy();
  });

  it('con un overlay abierto se porta al root superior y no queda inerte', async () => {
    const fake = createFakeTransport();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <UploadProvider transport={fake.transport}>
          <OverlayHarness />
        </UploadProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Hoja de prueba' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'añadir en la hoja' }));

    expect(await screen.findByText('Se ha añadido foto-1.jpg a la cola.')).toBeTruthy();

    const regions = document.querySelectorAll<HTMLElement>('[data-memora-live-region]');

    expect(regions).toHaveLength(1);

    const region = regions[0];

    if (region === undefined) {
      throw new Error('No hay región viva');
    }

    expect(region.closest('[data-memora-overlay-root]')).not.toBeNull();
    expect(region.closest('[inert]')).toBeNull();
  });

  it('limpia el mensaje para poder repetir uno idéntico', () => {
    vi.useFakeTimers();

    try {
      const { rerender } = render(<UploadAnnouncer items={[item('pending')]} />);

      rerender(<UploadAnnouncer items={[item('done')]} />);
      expect(liveRegion().textContent).toBe('foto.jpg se ha subido.');

      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(liveRegion().textContent).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });
});
