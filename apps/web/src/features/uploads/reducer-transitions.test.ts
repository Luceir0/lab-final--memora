import { describe, expect, it } from 'vitest';

import type { UploadError } from './errors';
import { uploadQueueReducer } from './reducer';
import type { EnqueueUploadEntry, UploadAction, UploadQueueState } from './types';

/**
 * Transiciones que el reducer debe rechazar.
 *
 * La suite base cubre el camino feliz; aquí se fija la frontera para que una
 * respuesta tardía de red no pueda resucitar un archivo ya terminado ni
 * reabrir uno en curso.
 */

type TerminalState = 'pending' | 'uploading' | 'done' | 'error' | 'cancelled';

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

function stateWith(status: TerminalState): UploadQueueState {
  const pending = uploadQueueReducer({ items: [] }, { type: 'enqueue', entries: [makeEntry(1)] });

  switch (status) {
    case 'pending':
      return pending;
    case 'uploading':
      return uploadQueueReducer(pending, { type: 'start', id: 'item-1' });
    case 'done':
      return uploadQueueReducer(uploadQueueReducer(pending, { type: 'start', id: 'item-1' }), {
        type: 'success',
        id: 'item-1',
        photoId: 'photo-1',
      });
    case 'error':
      return uploadQueueReducer(uploadQueueReducer(pending, { type: 'start', id: 'item-1' }), {
        type: 'failure',
        id: 'item-1',
        error: interrupted,
      });
    case 'cancelled':
      return uploadQueueReducer(pending, { type: 'cancel', id: 'item-1' });
  }
}

function apply(state: UploadQueueState, action: UploadAction): UploadQueueState {
  return uploadQueueReducer(state, action);
}

const interrupted: UploadError = {
  code: 'NETWORK_ERROR',
  status: null,
  message: 'Se ha perdido la conexión.',
};

describe('uploadQueueReducer · transiciones rechazadas', () => {
  it('success solo se acepta desde uploading', () => {
    for (const status of ['pending', 'done', 'error', 'cancelled'] as const) {
      const state = stateWith(status);

      expect(apply(state, { type: 'success', id: 'item-1', photoId: 'photo-1' })).toBe(state);
    }

    const uploading = stateWith('uploading');

    expect(
      apply(uploading, { type: 'success', id: 'item-1', photoId: 'photo-1' }).items[0],
    ).toMatchObject({ status: 'done', photoId: 'photo-1' });
  });

  it('failure solo se acepta desde pending o uploading', () => {
    for (const status of ['done', 'error', 'cancelled'] as const) {
      const state = stateWith(status);

      expect(apply(state, { type: 'failure', id: 'item-1', error: interrupted })).toBe(state);
    }

    expect(
      apply(stateWith('pending'), { type: 'failure', id: 'item-1', error: interrupted }),
    ).toMatchObject({ items: [{ status: 'error' }] });
    expect(
      apply(stateWith('uploading'), { type: 'failure', id: 'item-1', error: interrupted }),
    ).toMatchObject({ items: [{ status: 'error' }] });
  });

  it('cancel no toca estados terminales', () => {
    for (const status of ['done', 'error', 'cancelled'] as const) {
      const state = stateWith(status);

      expect(apply(state, { type: 'cancel', id: 'item-1' })).toBe(state);
    }
  });

  it('retry solo se acepta desde error o cancelled', () => {
    for (const status of ['pending', 'uploading', 'done'] as const) {
      const state = stateWith(status);

      expect(apply(state, { type: 'retry', id: 'item-1' })).toBe(state);
    }

    expect(apply(stateWith('error'), { type: 'retry', id: 'item-1' })).toMatchObject({
      items: [{ status: 'pending', progress: 0 }],
    });
    expect(apply(stateWith('cancelled'), { type: 'retry', id: 'item-1' })).toMatchObject({
      items: [{ status: 'pending', progress: 0 }],
    });
  });

  it('progress solo modifica un archivo en subida', () => {
    for (const status of ['pending', 'done', 'error', 'cancelled'] as const) {
      const state = stateWith(status);

      expect(apply(state, { type: 'progress', id: 'item-1', progress: 50 })).toBe(state);
    }
  });

  it('las acciones globales sin objetivo no crean un estado nuevo', () => {
    const empty = { items: [] };
    const done = stateWith('done');
    const cancelled = stateWith('cancelled');
    const pending = stateWith('pending');

    expect(apply(empty, { type: 'enqueue', entries: [] })).toBe(empty);
    expect(apply(done, { type: 'cancelAll' })).toBe(done);
    expect(apply(cancelled, { type: 'retryFailed' })).toBe(cancelled);
    expect(apply(pending, { type: 'remove', id: 'fantasma' })).toBe(pending);
    expect(apply(pending, { type: 'clearCompleted' })).toBe(pending);
  });
});

describe('uploadQueueReducer · unión discriminada', () => {
  it('cada archivo termina en exactamente uno de los cinco estados', () => {
    const entries = [1, 2, 3, 4, 5].map((index) => makeEntry(index));

    const state = [
      { type: 'enqueue', entries } as const,
      { type: 'start', id: 'item-1' } as const,
      { type: 'success', id: 'item-1', photoId: 'photo-1' } as const,
      { type: 'start', id: 'item-2' } as const,
      { type: 'failure', id: 'item-2', error: interrupted } as const,
      { type: 'start', id: 'item-3' } as const,
      { type: 'cancel', id: 'item-3' } as const,
      { type: 'start', id: 'item-5' } as const,
      { type: 'progress', id: 'item-5', progress: 40 } as const,
    ].reduce(uploadQueueReducer, { items: [] } as UploadQueueState);

    expect(state.items.map((item) => item.status)).toEqual([
      'done',
      'error',
      'cancelled',
      'pending',
      'uploading',
    ]);

    for (const item of state.items) {
      expect(item.progress).toBeGreaterThanOrEqual(0);
      expect(item.progress).toBeLessThanOrEqual(100);
    }

    const [done, error, cancelled, pending, uploading] = state.items;

    if (done?.status !== 'done') {
      throw new Error('El primer archivo debería estar completado');
    }

    if (error?.status !== 'error') {
      throw new Error('El segundo archivo debería estar en error');
    }

    if (cancelled?.status !== 'cancelled') {
      throw new Error('El tercer archivo debería estar cancelado');
    }

    expect(done.photoId).toBe('photo-1');
    expect(error.error).toEqual(interrupted);
    expect(pending?.status).toBe('pending');
    expect(uploading?.status).toBe('uploading');

    if (uploading?.status !== 'uploading') {
      throw new Error('El quinto archivo debería estar subiendo');
    }

    expect(uploading.progress).toBe(40);
  });
});
