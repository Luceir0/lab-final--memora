import type { PhotoDto } from '@memora/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UploadTransportError } from './errors';
import type { UploadTransport, UploadTransportRequest } from './transport';
import { useUploadQueue } from './upload-queue-context';
import { UploadProvider } from './upload-provider';

/**
 * Riesgos de la cola que no cubre el camino feliz: cancelar un pendiente,
 * eliminar en curso, acciones masivas, aislamiento de errores y lotes
 * rechazados. El transporte es falso y cada promesa se resuelve a mano para
 * controlar la concurrencia sin red.
 */

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

interface FakeTransport {
  readonly requests: UploadTransportRequest[];
  readonly deferreds: Deferred<PhotoDto>[];
  readonly transport: UploadTransport;
  /** Máximo de peticiones vivas a la vez. */
  readonly maxConcurrent: () => number;
}

function createFakeTransport(): FakeTransport {
  const requests: UploadTransportRequest[] = [];
  const deferreds: Deferred<PhotoDto>[] = [];
  let inFlight = 0;
  let maxInFlight = 0;

  const upload: UploadTransport['upload'] = (request) => {
    requests.push(request);
    const pending = deferred<PhotoDto>();
    deferreds.push(pending);

    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);

    const settle = () => {
      inFlight -= 1;
    };

    void pending.promise.then(settle, settle);

    request.signal.addEventListener(
      'abort',
      () => {
        pending.reject(new UploadTransportError('CANCELLED', null));
      },
      { once: true },
    );

    return pending.promise;
  };

  return { requests, deferreds, transport: { upload }, maxConcurrent: () => maxInFlight };
}

function imageFile(name = 'foto.jpg', size?: number): File {
  const file = new File(['contenido'], name, { type: 'image/jpeg' });

  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size });
  }

  return file;
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

function enqueue(result: ReturnType<typeof renderQueue>['result'], files: readonly File[]): void {
  act(() => {
    result.current.enqueue(files, {
      albumId: 'album-1',
      albumTitle: 'Verano',
      source: 'desktop',
    });
  });
}

function itemAt(result: ReturnType<typeof renderQueue>['result'], index: number) {
  const item = result.current.items[index];

  if (item === undefined) {
    throw new Error(`No hay archivo en la posición ${index}`);
  }

  return item;
}

beforeEach(() => {
  fetchCsrfTokenMock.mockClear();
});

describe('useUploadQueue · cancelación y eliminación', () => {
  it('cancelar un pendiente no envía su petición ni aborta las que ya están en curso', async () => {
    const { result, fake } = renderQueue();

    enqueue(
      result,
      Array.from({ length: 5 }, (_, index) => imageFile(`foto-${index}.jpg`)),
    );

    await waitFor(() => expect(fake.requests).toHaveLength(3));

    const queued = itemAt(result, 4);
    const startedSignals = fake.requests.map((request) => request.signal);

    act(() => {
      result.current.cancel(queued.id);
    });

    await waitFor(() => expect(itemAt(result, 4).status).toBe('cancelled'));
    expect(startedSignals.every((signal) => !signal.aborted)).toBe(true);
    expect(result.current.summary).toMatchObject({ cancelled: 1, active: 3, pending: 1 });

    await act(async () => {
      for (const pending of fake.deferreds.slice(0, 3)) {
        pending.resolve(photo);
      }
    });

    await waitFor(() => expect(fake.requests).toHaveLength(4));
    expect(fake.requests.map((request) => request.fields.clientUploadId)).not.toContain(
      queued.clientUploadId,
    );
  });

  it('eliminar un archivo en curso aborta el transporte y no resucita al resolverse', async () => {
    const { result, fake } = renderQueue();

    enqueue(result, [imageFile('playa.jpg')]);
    await waitFor(() => expect(fake.requests).toHaveLength(1));

    const item = itemAt(result, 0);

    act(() => {
      result.current.remove(item.id);
    });

    expect(result.current.items).toHaveLength(0);
    expect(fake.requests[0]?.signal.aborted).toBe(true);

    await act(async () => {
      fake.deferreds[0]?.resolve(photo);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.summary).toMatchObject({ total: 0, completed: 0, active: 0 });
  });

  it('cancelAll cancela pendientes y en curso, y no lanza los pendientes restantes', async () => {
    const { result, fake } = renderQueue();

    enqueue(
      result,
      Array.from({ length: 5 }, (_, index) => imageFile(`foto-${index}.jpg`)),
    );

    await waitFor(() => expect(fake.requests).toHaveLength(3));

    act(() => {
      result.current.cancelAll();
    });

    await waitFor(() => {
      expect(result.current.items.every((item) => item.status === 'cancelled')).toBe(true);
    });
    expect(fake.requests).toHaveLength(3);
    expect(fake.requests.every((request) => request.signal.aborted)).toBe(true);
    expect(result.current.summary).toMatchObject({ cancelled: 5, active: 0, pending: 0 });
    expect(result.current.hasActiveUploads).toBe(false);
  });
});

describe('useUploadQueue · acciones masivas', () => {
  it('retryFailed relanza solo los errores y conserva su clientUploadId', async () => {
    const { result, fake } = renderQueue();

    enqueue(result, [imageFile('foto-1.jpg'), imageFile('foto-2.jpg'), imageFile('foto-3.jpg')]);

    await waitFor(() => expect(fake.requests).toHaveLength(3));

    const firstClientUploadId = itemAt(result, 0).clientUploadId;
    const cancelledItem = itemAt(result, 2);

    await act(async () => {
      fake.deferreds[0]?.reject(new UploadTransportError('INTERNAL_ERROR', 500));
    });
    await waitFor(() => expect(itemAt(result, 0).status).toBe('error'));

    act(() => {
      result.current.cancel(cancelledItem.id);
    });
    await waitFor(() => expect(itemAt(result, 2).status).toBe('cancelled'));

    act(() => {
      result.current.retryFailed();
    });

    await waitFor(() => expect(fake.requests).toHaveLength(4));
    expect(fake.requests[3]?.fields.clientUploadId).toBe(firstClientUploadId);
    expect(itemAt(result, 2).status).toBe('cancelled');
    expect(
      fake.requests.filter(
        (request) => request.fields.clientUploadId === cancelledItem.clientUploadId,
      ),
    ).toHaveLength(1);
  });

  it('clearCompleted elimina completadas y canceladas, y conserva los errores', async () => {
    const { result, fake } = renderQueue();

    enqueue(result, [imageFile('foto-1.jpg'), imageFile('foto-2.jpg'), imageFile('foto-3.jpg')]);

    await waitFor(() => expect(fake.requests).toHaveLength(3));

    await act(async () => {
      fake.deferreds[0]?.resolve(photo);
    });
    await waitFor(() => expect(itemAt(result, 0).status).toBe('done'));

    await act(async () => {
      fake.deferreds[1]?.reject(new UploadTransportError('FILE_TOO_LARGE', 413));
    });
    await waitFor(() => expect(itemAt(result, 1).status).toBe('error'));

    act(() => {
      result.current.cancel(itemAt(result, 2).id);
    });
    await waitFor(() => expect(itemAt(result, 2).status).toBe('cancelled'));

    act(() => {
      result.current.clearCompleted();
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({ status: 'error' });
  });
});

describe('useUploadQueue · aislamiento y resumen (AC-05)', () => {
  it('un error no altera a los demás ni pierde el progreso global', async () => {
    const { result, fake } = renderQueue();

    enqueue(result, [
      imageFile('foto-1.jpg', 100),
      imageFile('foto-2.jpg', 200),
      imageFile('foto-3.jpg', 300),
    ]);

    await waitFor(() => expect(fake.requests).toHaveLength(3));

    act(() => {
      fake.requests[0]?.onProgress(50);
    });
    expect(itemAt(result, 0)).toMatchObject({ status: 'uploading', progress: 50 });

    await act(async () => {
      fake.deferreds[1]?.reject(new UploadTransportError('NETWORK_ERROR', null));
    });
    await waitFor(() => expect(itemAt(result, 1).status).toBe('error'));

    expect(itemAt(result, 0)).toMatchObject({ status: 'uploading', progress: 50 });
    expect(itemAt(result, 2)).toMatchObject({ status: 'uploading', progress: 0 });
    expect(result.current.summary).toEqual({
      total: 3,
      completed: 0,
      failed: 1,
      cancelled: 0,
      active: 2,
      pending: 0,
      progress: 8,
      uploadedBytes: 50,
      totalBytes: 600,
    });

    await act(async () => {
      fake.deferreds[2]?.resolve(photo);
    });
    await waitFor(() => expect(itemAt(result, 2).status).toBe('done'));

    expect(itemAt(result, 0)).toMatchObject({ status: 'uploading', progress: 50 });
    expect(result.current.summary).toMatchObject({
      completed: 1,
      failed: 1,
      active: 1,
      progress: 58,
      uploadedBytes: 350,
      totalBytes: 600,
    });
  });
});

describe('useUploadQueue · validación de lote', () => {
  it('con 22 archivos encola 20 y deja los dos últimos en error sin frenar a los válidos', async () => {
    const { result, fake } = renderQueue();

    enqueue(
      result,
      Array.from({ length: 22 }, (_, index) => imageFile(`foto-${index}.jpg`)),
    );

    expect(result.current.items).toHaveLength(22);

    const rejected = result.current.items.filter((item) => item.status === 'error');

    expect(rejected).toHaveLength(2);
    expect(
      rejected.every((item) => item.status === 'error' && item.error.code === 'VALIDATION_ERROR'),
    ).toBe(true);

    await waitFor(() => expect(fake.requests).toHaveLength(3));

    for (let round = 0; round < 30; round += 1) {
      await act(async () => {
        for (const pending of fake.deferreds) {
          pending.resolve(photo);
        }
      });
      await Promise.resolve();
    }

    await waitFor(() => expect(result.current.summary.completed).toBe(20));
    expect(result.current.summary.failed).toBe(2);
  });

  it('un archivo de más de 25 MB queda en error y los válidos siguen subiéndose', async () => {
    const { result, fake } = renderQueue();

    enqueue(result, [
      imageFile('ok-1.jpg'),
      imageFile('enorme.jpg', 25 * 1024 * 1024 + 1),
      imageFile('ok-2.jpg'),
    ]);

    expect(itemAt(result, 1)).toMatchObject({
      status: 'error',
      error: { code: 'FILE_TOO_LARGE' },
    });

    await waitFor(() => expect(fake.requests).toHaveLength(2));
    expect(fake.requests.map((request) => request.fields.clientUploadId)).not.toContain(
      itemAt(result, 1).clientUploadId,
    );
  });
});

describe('useUploadQueue · concurrencia', () => {
  it('nunca hay más de 3 peticiones vivas aunque se resuelvan en orden inverso', async () => {
    const { result, fake } = renderQueue();

    enqueue(
      result,
      Array.from({ length: 7 }, (_, index) => imageFile(`foto-${index}.jpg`)),
    );

    await waitFor(() => expect(fake.requests).toHaveLength(3));
    expect(fake.maxConcurrent()).toBe(3);

    await act(async () => {
      fake.deferreds[1]?.resolve(photo);
    });
    await waitFor(() => expect(fake.requests).toHaveLength(4));
    expect(fake.maxConcurrent()).toBe(3);

    for (let round = 0; round < 20; round += 1) {
      await act(async () => {
        for (const pending of fake.deferreds) {
          pending.resolve(photo);
        }
      });
      await Promise.resolve();
    }

    await waitFor(() => expect(result.current.summary.completed).toBe(7));
    expect(fake.maxConcurrent()).toBe(3);
    expect(fake.requests).toHaveLength(7);
  });
});
