import type { UploadError } from './errors';

/** Origen del archivo: define el copy de la UI, no el contrato. */
export type UploadSource = 'gallery' | 'camera' | 'desktop';

/**
 * Datos estables de un elemento de la cola.
 *
 * `clientUploadId` es la clave de idempotencia del contrato: se genera al
 * encolar y **nunca** cambia, tampoco al reintentar.
 */
export interface UploadQueueEntry {
  readonly id: string;
  readonly file: File;
  readonly albumId: string;
  /** Título del álbum al encolar; no cambia en los reintentos. */
  readonly albumTitle: string;
  readonly source: UploadSource;
  readonly previewUrl: string;
  readonly originalName: string;
  readonly clientUploadId: string;
  readonly size: number;
  readonly takenAt?: string;
  readonly description?: string;
}

/** Entrada de `enqueue`: los archivos rechazados en cliente nacen en `error`. */
export interface EnqueueUploadEntry extends UploadQueueEntry {
  readonly error?: UploadError;
}

interface UploadItemBase extends UploadQueueEntry {
  readonly attempts: number;
}

export interface PendingUploadItem extends UploadItemBase {
  readonly status: 'pending';
  /** 0–100. */
  readonly progress: number;
}

export interface UploadingUploadItem extends UploadItemBase {
  readonly status: 'uploading';
  /** 0–100. */
  readonly progress: number;
}

export interface DoneUploadItem extends UploadItemBase {
  readonly status: 'done';
  readonly progress: 100;
  readonly photoId: string;
}

export interface ErrorUploadItem extends UploadItemBase {
  readonly status: 'error';
  /** 0–100. Conserva el último progreso conocido. */
  readonly progress: number;
  readonly error: UploadError;
}

export interface CancelledUploadItem extends UploadItemBase {
  readonly status: 'cancelled';
  /** 0–100. Conserva el último progreso conocido. */
  readonly progress: number;
}

/**
 * Unión discriminada por `status`. No hay estados intermedios fuera de estos
 * cinco: cualquier combinación imposible se rechaza en el reducer.
 */
export type UploadItem =
  PendingUploadItem | UploadingUploadItem | DoneUploadItem | ErrorUploadItem | CancelledUploadItem;

export type UploadItemStatus = UploadItem['status'];

export interface UploadQueueState {
  readonly items: readonly UploadItem[];
}

export interface UploadEnqueueOptions {
  readonly albumId: string;
  readonly albumTitle: string;
  readonly source: UploadSource;
  readonly takenAt?: string;
  readonly description?: string;
}

/** Resumen derivado; nunca se persiste en el estado. */
export interface UploadQueueSummary {
  readonly total: number;
  readonly completed: number;
  readonly failed: number;
  readonly cancelled: number;
  /** Archivos con petición en curso. */
  readonly active: number;
  /** Archivos en cola que aún no han empezado. */
  readonly pending: number;
  /** 0–100, ponderado por bytes. */
  readonly progress: number;
  readonly uploadedBytes: number;
  readonly totalBytes: number;
}

export type UploadAction =
  | { readonly type: 'enqueue'; readonly entries: readonly EnqueueUploadEntry[] }
  | { readonly type: 'start'; readonly id: string }
  | { readonly type: 'progress'; readonly id: string; readonly progress: number }
  | { readonly type: 'success'; readonly id: string; readonly photoId: string }
  | { readonly type: 'failure'; readonly id: string; readonly error: UploadError }
  | { readonly type: 'cancel'; readonly id: string }
  | { readonly type: 'retry'; readonly id: string }
  | { readonly type: 'cancelAll' }
  | { readonly type: 'retryFailed' }
  | { readonly type: 'remove'; readonly id: string }
  | { readonly type: 'clearCompleted' };
