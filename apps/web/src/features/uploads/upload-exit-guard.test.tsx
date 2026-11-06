import type { PhotoDto } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UploadTransportError } from './errors';
import type { UploadTransport, UploadTransportRequest } from './transport';
import { UploadExitGuard } from './upload-exit-guard';
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

function createHangingTransport() {
  const upload = vi.fn((request: UploadTransportRequest) => {
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<PhotoDto>((_resolve, rejectPromise) => {
      reject = rejectPromise;
    });

    request.signal.addEventListener(
      'abort',
      () => reject(new UploadTransportError('CANCELLED', null)),
      {
        once: true,
      },
    );

    return promise;
  });

  return { upload, transport: { upload } as UploadTransport };
}

function Harness() {
  const { enqueue, items, cancel } = useUploadQueue();
  const item = items[0];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          enqueue([new File(['x'], 'foto.jpg', { type: 'image/jpeg' })], {
            albumId: 'album-1',
            albumTitle: 'Verano',
            source: 'desktop',
          });
        }}
      >
        añadir
      </button>
      <button
        type="button"
        onClick={() => {
          if (item !== undefined) {
            cancel(item.id);
          }
        }}
      >
        cancelar
      </button>
      <p>Estado: {item?.status ?? 'vacía'}</p>
      <UploadExitGuard />
    </>
  );
}

function renderGuard(transport?: UploadTransport) {
  const fake = createHangingTransport();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <UploadProvider transport={transport ?? fake.transport}>
        <Harness />
      </UploadProvider>
    </QueryClientProvider>,
  );

  return fake;
}

function dispatchBeforeUnload(): Event {
  const event = new Event('beforeunload', { cancelable: true });

  act(() => {
    window.dispatchEvent(event);
  });

  return event;
}

beforeEach(() => {
  fetchCsrfTokenMock.mockClear();
});

describe('UploadExitGuard', () => {
  it('no previene la salida con la cola vacía', () => {
    renderGuard();

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it('previene la recarga o el cierre mientras hay subidas activas', async () => {
    const fake = renderGuard();

    fireEvent.click(screen.getByRole('button', { name: 'añadir' }));

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).toBeNull();

    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);
  });

  it('no previene con la cola en done', async () => {
    const upload = vi.fn(async () => photo);

    renderGuard({ upload });

    fireEvent.click(screen.getByRole('button', { name: 'añadir' }));

    expect(await screen.findByText('Estado: done')).toBeTruthy();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it('no previene con la cola en error', async () => {
    const upload = vi.fn(async () => {
      throw new UploadTransportError('FILE_TOO_LARGE', 413);
    });

    renderGuard({ upload });

    fireEvent.click(screen.getByRole('button', { name: 'añadir' }));

    expect(await screen.findByText('Estado: error')).toBeTruthy();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it('no previene con la cola en cancelled', async () => {
    const fake = renderGuard();

    fireEvent.click(screen.getByRole('button', { name: 'añadir' }));
    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'cancelar' }));

    expect(await screen.findByText('Estado: cancelled')).toBeTruthy();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });
});
