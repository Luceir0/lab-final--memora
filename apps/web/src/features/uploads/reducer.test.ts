import { describe, expect, it } from 'vitest';

import type { UploadError } from './errors';
import { INITIAL_UPLOAD_QUEUE_STATE, summarizeUploadQueue, uploadQueueReducer } from './reducer';
import type { EnqueueUploadEntry, UploadAction, UploadQueueState } from './types';

function makeEntry(index: number, overrides: Partial<EnqueueUploadEntry> = {}): EnqueueUploadEntry {
  const file = new File(['contenido'], `foto-${index}.jpg`, { type: 'image/jpeg' });

  return {
    id: `item-${index}`,
    file,
    albumId: 'album-1',
    albumTitle: 'Verano',
    source: 'desktop',
    previewUrl: `blob:preview-${index}`,
    originalName: file.name,
    clientUploadId: `client-${index}`,
    size: 100,
    ...overrides,
  };
}

function reduce(state: UploadQueueState, ...actions: readonly UploadAction[]): UploadQueueState {
  return actions.reduce(uploadQueueReducer, state);
}

function enqueued(...entries: readonly EnqueueUploadEntry[]): UploadQueueState {
  return uploadQueueReducer(INITIAL_UPLOAD_QUEUE_STATE, { type: 'enqueue', entries });
}

const interrupted: UploadError = {
  code: 'NETWORK_ERROR',
  status: null,
  message: 'Se ha perdido la conexión.',
};

describe('uploadQueueReducer', () => {
  it('encola los archivos en pending con progreso 0 y sin intentos', () => {
    const state = enqueued(makeEntry(1), makeEntry(2));

    expect(state.items).toHaveLength(2);
    expect(state.items[0]).toMatchObject({
      id: 'item-1',
      status: 'pending',
      progress: 0,
      attempts: 0,
      clientUploadId: 'client-1',
      originalName: 'foto-1.jpg',
    });
  });

  it('un archivo rechazado en cliente nace en error sin afectar a los válidos', () => {
    const state = enqueued(makeEntry(1), makeEntry(2, { error: interrupted }));

    expect(state.items[0]?.status).toBe('pending');
    expect(state.items[1]).toMatchObject({ status: 'error', error: interrupted, attempts: 0 });
  });

  it('start pasa de pending a uploading y cuenta el intento', () => {
    const state = reduce(enqueued(makeEntry(1)), { type: 'start', id: 'item-1' });

    expect(state.items[0]).toMatchObject({ status: 'uploading', progress: 0, attempts: 1 });
  });

  it('start no reabre un item que ya no está pendiente', () => {
    const started = reduce(enqueued(makeEntry(1)), { type: 'start', id: 'item-1' });
    const again = reduce(started, { type: 'start', id: 'item-1' });

    expect(again).toBe(started);
  });

  it('progress acota a 0–100 y solo aplica a uploading', () => {
    const pending = enqueued(makeEntry(1));
    expect(reduce(pending, { type: 'progress', id: 'item-1', progress: 40 })).toBe(pending);

    const uploading = reduce(pending, { type: 'start', id: 'item-1' });
    expect(
      reduce(uploading, { type: 'progress', id: 'item-1', progress: 150 }).items[0]?.progress,
    ).toBe(100);
    expect(
      reduce(uploading, { type: 'progress', id: 'item-1', progress: -10 }).items[0]?.progress,
    ).toBe(0);
    expect(
      reduce(uploading, { type: 'progress', id: 'item-1', progress: Number.NaN }).items[0]
        ?.progress,
    ).toBe(0);
  });

  it('success deja done con photoId y progreso 100', () => {
    const state = reduce(
      enqueued(makeEntry(1)),
      { type: 'start', id: 'item-1' },
      { type: 'progress', id: 'item-1', progress: 60 },
      { type: 'success', id: 'item-1', photoId: 'photo-1' },
    );

    expect(state.items[0]).toMatchObject({
      status: 'done',
      progress: 100,
      photoId: 'photo-1',
      attempts: 1,
    });
  });

  it('un error no altera los demás items (AC-05)', () => {
    const state = reduce(
      enqueued(makeEntry(1), makeEntry(2)),
      { type: 'start', id: 'item-1' },
      { type: 'start', id: 'item-2' },
      { type: 'failure', id: 'item-1', error: interrupted },
    );

    expect(state.items[0]).toMatchObject({ status: 'error', error: interrupted });
    expect(state.items[1]).toMatchObject({ status: 'uploading' });
    expect(state.items).toHaveLength(2);
  });

  it('retry reutiliza el MISMO clientUploadId y vuelve a pending', () => {
    const failed = reduce(
      enqueued(makeEntry(1)),
      { type: 'start', id: 'item-1' },
      { type: 'failure', id: 'item-1', error: interrupted },
    );
    const retried = reduce(failed, { type: 'retry', id: 'item-1' });

    expect(retried.items[0]).toMatchObject({
      status: 'pending',
      progress: 0,
      attempts: 1,
      clientUploadId: 'client-1',
    });
    expect(retried.items[0]).not.toHaveProperty('error');
  });

  it('cancel pasa pending y uploading a cancelled', () => {
    const state = reduce(
      enqueued(makeEntry(1), makeEntry(2)),
      { type: 'start', id: 'item-2' },
      { type: 'cancel', id: 'item-1' },
      { type: 'cancel', id: 'item-2' },
    );

    expect(state.items.map((item) => item.status)).toEqual(['cancelled', 'cancelled']);
  });

  it('una respuesta tardía tras cancelar no resucita el item', () => {
    const cancelled = reduce(
      enqueued(makeEntry(1)),
      { type: 'start', id: 'item-1' },
      { type: 'cancel', id: 'item-1' },
      { type: 'success', id: 'item-1', photoId: 'photo-1' },
      { type: 'failure', id: 'item-1', error: interrupted },
    );

    expect(cancelled.items[0]).toMatchObject({ status: 'cancelled' });
  });

  it('cancelAll cancela solo pending y uploading', () => {
    const state = reduce(
      enqueued(makeEntry(1), makeEntry(2), makeEntry(3)),
      { type: 'start', id: 'item-1' },
      { type: 'success', id: 'item-1', photoId: 'photo-1' },
      { type: 'start', id: 'item-2' },
      { type: 'failure', id: 'item-2', error: interrupted },
      { type: 'cancelAll' },
    );

    expect(state.items.map((item) => item.status)).toEqual(['done', 'error', 'cancelled']);
  });

  it('retryFailed devuelve solo los error a pending', () => {
    const state = reduce(
      enqueued(makeEntry(1), makeEntry(2)),
      { type: 'start', id: 'item-1' },
      { type: 'failure', id: 'item-1', error: interrupted },
      { type: 'cancel', id: 'item-2' },
      { type: 'retryFailed' },
    );

    expect(state.items.map((item) => item.status)).toEqual(['pending', 'cancelled']);
  });

  it('remove elimina un item y clearCompleted limpia done y cancelled', () => {
    const state = reduce(
      enqueued(makeEntry(1), makeEntry(2), makeEntry(3)),
      { type: 'start', id: 'item-1' },
      { type: 'success', id: 'item-1', photoId: 'photo-1' },
      { type: 'cancel', id: 'item-2' },
      { type: 'start', id: 'item-3' },
      { type: 'remove', id: 'item-3' },
    );

    expect(state.items.map((item) => item.id)).toEqual(['item-1', 'item-2']);
    expect(reduce(state, { type: 'clearCompleted' }).items).toHaveLength(0);
  });

  it('devuelve el mismo estado cuando la acción no cambia nada', () => {
    const state = enqueued(makeEntry(1));

    expect(reduce(state, { type: 'cancel', id: 'no-existe' })).toBe(state);
    expect(reduce(state, { type: 'success', id: 'item-1', photoId: 'photo' })).toBe(state);
    expect(reduce(state, { type: 'clearCompleted' })).toBe(state);
  });
});

describe('summarizeUploadQueue', () => {
  it('resume estados, porcentaje ponderado por bytes y bytes subidos', () => {
    const state = reduce(
      enqueued(
        makeEntry(1, { size: 100 }),
        makeEntry(2, { size: 300 }),
        makeEntry(3, { size: 200 }),
      ),
      { type: 'start', id: 'item-1' },
      { type: 'success', id: 'item-1', photoId: 'photo-1' },
      { type: 'start', id: 'item-2' },
      { type: 'progress', id: 'item-2', progress: 50 },
      { type: 'cancel', id: 'item-3' },
    );

    expect(summarizeUploadQueue(state.items)).toEqual({
      total: 3,
      completed: 1,
      failed: 0,
      cancelled: 1,
      active: 1,
      pending: 0,
      progress: 42,
      uploadedBytes: 250,
      totalBytes: 600,
    });
  });

  it('un error cuenta como fallido pero conserva su progreso parcial', () => {
    const state = reduce(
      enqueued(makeEntry(1, { size: 100 })),
      { type: 'start', id: 'item-1' },
      { type: 'progress', id: 'item-1', progress: 40 },
      { type: 'failure', id: 'item-1', error: interrupted },
    );

    expect(summarizeUploadQueue(state.items)).toMatchObject({
      total: 1,
      failed: 1,
      progress: 40,
      uploadedBytes: 40,
      totalBytes: 100,
    });
  });

  it('un estado vacío tiene resumen neutro', () => {
    expect(summarizeUploadQueue([])).toEqual({
      total: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      active: 0,
      pending: 0,
      progress: 0,
      uploadedBytes: 0,
      totalBytes: 0,
    });
  });
});
