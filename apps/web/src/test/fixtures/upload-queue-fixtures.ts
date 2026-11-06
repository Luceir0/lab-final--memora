import { vi } from 'vitest';

import type { UploadError } from '../../features/uploads/errors';
import { summarizeUploadQueue } from '../../features/uploads/reducer';
import type { UploadQueueApi } from '../../features/uploads/upload-queue-context';
import type {
  CancelledUploadItem,
  DoneUploadItem,
  ErrorUploadItem,
  PendingUploadItem,
  UploadItem,
  UploadQueueEntry,
  UploadingUploadItem,
} from '../../features/uploads/types';

function baseEntry(id: string, originalName: string, albumTitle: string): UploadQueueEntry {
  return {
    id,
    file: new File(['contenido'], originalName, { type: 'image/jpeg' }),
    albumId: 'alb_costa',
    albumTitle,
    source: 'gallery',
    previewUrl: '',
    originalName,
    clientUploadId: `client-${id}`,
    size: 2048,
  };
}

export interface UploadItemOptions {
  readonly id?: string;
  readonly originalName?: string;
  readonly albumTitle?: string;
  readonly progress?: number;
  readonly error?: UploadError;
}

export function pendingUploadItem(options: UploadItemOptions = {}): PendingUploadItem {
  return {
    ...baseEntry(
      options.id ?? 'upl_pending',
      options.originalName ?? 'foto-pendiente.jpg',
      options.albumTitle ?? 'Costa Brava',
    ),
    status: 'pending',
    progress: options.progress ?? 0,
    attempts: 0,
  };
}

export function uploadingUploadItem(options: UploadItemOptions = {}): UploadingUploadItem {
  return {
    ...baseEntry(
      options.id ?? 'upl_uploading',
      options.originalName ?? 'foto-subiendo.jpg',
      options.albumTitle ?? 'Costa Brava',
    ),
    status: 'uploading',
    progress: options.progress ?? 40,
    attempts: 1,
  };
}

export function errorUploadItem(options: UploadItemOptions = {}): ErrorUploadItem {
  return {
    ...baseEntry(
      options.id ?? 'upl_error',
      options.originalName ?? 'foto-error.jpg',
      options.albumTitle ?? 'Costa Brava',
    ),
    status: 'error',
    progress: options.progress ?? 0,
    attempts: 1,
    error: options.error ?? {
      code: 'FILE_TOO_LARGE',
      status: 413,
      message: 'El archivo supera los 25 MB.',
    },
  };
}

export function doneUploadItem(options: UploadItemOptions = {}): DoneUploadItem {
  return {
    ...baseEntry(
      options.id ?? 'upl_done',
      options.originalName ?? 'foto-completada.jpg',
      options.albumTitle ?? 'Costa Brava',
    ),
    status: 'done',
    progress: 100,
    attempts: 1,
    photoId: 'ph_done',
  };
}

export function cancelledUploadItem(options: UploadItemOptions = {}): CancelledUploadItem {
  return {
    ...baseEntry(
      options.id ?? 'upl_cancelled',
      options.originalName ?? 'foto-cancelada.jpg',
      options.albumTitle ?? 'Costa Brava',
    ),
    status: 'cancelled',
    progress: 0,
    attempts: 1,
  };
}

/**
 * API falsa de la cola para probar componentes que solo leen el contexto.
 *
 * `items` y `summary` se derivan de la cola real para que el contador y el
 * bloque «En curso» se comporten como en producción sin montar el provider.
 */
export function createFakeUploadQueue(
  items: readonly UploadItem[] = [],
  overrides: Partial<UploadQueueApi> = {},
): UploadQueueApi {
  const summary = summarizeUploadQueue(items);

  return {
    items,
    summary,
    enqueue: vi.fn(),
    isPanelOpen: false,
    focusOnOpen: false,
    openPanel: vi.fn(),
    closePanel: vi.fn(),
    retry: vi.fn(),
    cancel: vi.fn(),
    cancelAll: vi.fn(),
    retryFailed: vi.fn(),
    remove: vi.fn(),
    clearCompleted: vi.fn(),
    hasActiveUploads: summary.pending > 0 || summary.active > 0,
    ...overrides,
  };
}
