import type { PhotoDto } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UploadTransportError } from './errors';
import type { UploadTransport, UploadTransportRequest } from './transport';
import { useUploadQueue } from './upload-queue-context';
import { UploadProvider } from './upload-provider';

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

function imageFile(name = 'foto.jpg', type = 'image/jpeg'): File {
  return new File(['contenido'], name, { type });
}

function renderQueue() {
  const fake = createFakeTransport();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });

  function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <UploadProvider transport={fake.transport}>{children}</UploadProvider>
      </QueryClientProvider>
    );
  }

  const view = renderHook(() => useUploadQueue(), { wrapper: Wrapper });

  return { ...view, fake, queryClient };
}

beforeEach(() => {
  fetchCsrfTokenMock.mockClear();
});

describe('useUploadQueue', () => {
  it('lanza como máximo 3 subidas y arranca pendientes al liberarse hueco', async () => {
    const { result, fake } = renderQueue();
    const files = Array.from({ length: 5 }, (_, index) => imageFile(`foto-${index}.jpg`));

    act(() => {
      result.current.enqueue(files, {
        albumId: 'album-1',
        albumTitle: 'Verano',
        source: 'desktop',
      });
    });

    expect(result.current.items).toHaveLength(5);

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(3));
    expect(result.current.summary).toMatchObject({ total: 5, active: 3, pending: 2 });
    expect(result.current.hasActiveUploads).toBe(true);

    await act(async () => {
      fake.deferreds[0]?.resolve(photo);
    });

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(4));
    expect(result.current.summary).toMatchObject({ completed: 1, active: 3, pending: 1 });

    // Resuelve primero las que ya están en vuelo y después las que arrancan.
    await act(async () => {
      for (const pending of fake.deferreds) {
        pending.resolve(photo);
      }
    });
    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(5));
    await act(async () => {
      for (const pending of fake.deferreds) {
        pending.resolve(photo);
      }
    });

    await waitFor(() => expect(result.current.summary.completed).toBe(5));
    expect(result.current.hasActiveUploads).toBe(false);

    // Un token CSRF por lote, reutilizado por los cinco archivos.
    expect(fetchCsrfTokenMock).toHaveBeenCalledTimes(1);
  });

  it('retry reutiliza el clientUploadId y relanza la petición', async () => {
    const { result, fake } = renderQueue();

    act(() => {
      result.current.enqueue([imageFile()], {
        albumId: 'album-1',
        albumTitle: 'Verano',
        source: 'gallery',
      });
    });

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));
    const firstClientUploadId = fake.requests[0]?.fields.clientUploadId;

    await act(async () => {
      fake.deferreds[0]?.reject(new UploadTransportError('INTERNAL_ERROR', 500));
    });

    await waitFor(() => expect(result.current.items[0]?.status).toBe('error'));

    const itemId = result.current.items[0]?.id;

    if (itemId === undefined) {
      throw new Error('El item no está en la cola');
    }

    act(() => {
      result.current.retry(itemId);
    });

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(2));
    expect(fake.requests[1]?.fields.clientUploadId).toBe(firstClientUploadId);
  });

  it('cancelar aborta la petición y deja el archivo en cancelled', async () => {
    const { result, fake } = renderQueue();

    act(() => {
      result.current.enqueue([imageFile()], {
        albumId: 'album-1',
        albumTitle: 'Verano',
        source: 'camera',
      });
    });

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    const itemId = result.current.items[0]?.id;

    if (itemId === undefined) {
      throw new Error('El item no está en la cola');
    }

    act(() => {
      result.current.cancel(itemId);
    });

    await waitFor(() => expect(result.current.items[0]?.status).toBe('cancelled'));
    expect(fake.requests[0]?.signal.aborted).toBe(true);
    expect(result.current.summary).toMatchObject({ cancelled: 1, active: 0 });
  });

  it('refresca el token una vez y reintenta el mismo archivo ante un fallo CSRF', async () => {
    const { result, fake } = renderQueue();

    act(() => {
      result.current.enqueue([imageFile()], {
        albumId: 'album-1',
        albumTitle: 'Verano',
        source: 'desktop',
      });
    });

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));
    const firstClientUploadId = fake.requests[0]?.fields.clientUploadId;
    expect(fetchCsrfTokenMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      fake.deferreds[0]?.reject(new UploadTransportError('FORBIDDEN', 403, 'Token CSRF inválido.'));
    });

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(2));
    expect(fetchCsrfTokenMock).toHaveBeenCalledTimes(2);
    expect(fake.requests[1]?.fields.clientUploadId).toBe(firstClientUploadId);

    await act(async () => {
      fake.deferreds[1]?.resolve(photo);
    });

    await waitFor(() => expect(result.current.summary.completed).toBe(1));
  });

  it('los archivos inválidos entran en error sin bloquear a los válidos', async () => {
    const { result, fake } = renderQueue();

    act(() => {
      result.current.enqueue([imageFile('ok.jpg'), imageFile('animado.gif', 'image/gif')], {
        albumId: 'album-1',
        albumTitle: 'Verano',
        source: 'desktop',
      });
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[1]).toMatchObject({
      status: 'error',
      progress: 0,
      error: { code: 'UNSUPPORTED_MEDIA_TYPE' },
    });

    await waitFor(() => expect(fake.upload).toHaveBeenCalledTimes(1));

    await act(async () => {
      fake.deferreds[0]?.resolve(photo);
    });

    await waitFor(() => expect(result.current.summary.completed).toBe(1));
    expect(result.current.summary.failed).toBe(1);
  });
});
