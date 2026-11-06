import type {
  EnqueueUploadEntry,
  UploadAction,
  UploadItem,
  UploadQueueState,
  UploadQueueSummary,
} from './types';

export const INITIAL_UPLOAD_QUEUE_STATE: UploadQueueState = { items: [] };

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function toUploadItem(entry: EnqueueUploadEntry): UploadItem {
  const { error, ...base } = entry;

  if (error !== undefined) {
    return { ...base, status: 'error', progress: 0, attempts: 0, error };
  }

  return { ...base, status: 'pending', progress: 0, attempts: 0 };
}

/**
 * Aplica una transición a un único item. Devuelve `null` si el estado actual
 * no permite la transición, para no crear objetos nuevos sin necesidad.
 */
function mapItem(
  items: readonly UploadItem[],
  id: string,
  update: (item: UploadItem) => UploadItem | null,
): readonly UploadItem[] {
  let changed = false;

  const next = items.map((item) => {
    if (item.id !== id) {
      return item;
    }

    const updated = update(item);

    if (updated === null) {
      return item;
    }

    changed = true;
    return updated;
  });

  return changed ? next : items;
}

function toPendingItem(item: UploadItem): UploadItem {
  if (item.status === 'error') {
    const { error: _error, ...rest } = item;

    return { ...rest, status: 'pending', progress: 0 };
  }

  return { ...item, status: 'pending', progress: 0 };
}

/**
 * Reducer puro de la cola.
 *
 * Las transiciones solo avanzan desde el estado esperado: una respuesta tardía
 * de un archivo cancelado no puede resucitarlo ni pisar su estado.
 */
export function uploadQueueReducer(
  state: UploadQueueState,
  action: UploadAction,
): UploadQueueState {
  switch (action.type) {
    case 'enqueue': {
      if (action.entries.length === 0) {
        return state;
      }

      return { items: [...state.items, ...action.entries.map(toUploadItem)] };
    }

    case 'start': {
      const items = mapItem(state.items, action.id, (item) =>
        item.status === 'pending'
          ? {
              ...item,
              status: 'uploading',
              progress: 0,
              attempts: item.attempts + 1,
            }
          : null,
      );

      return items === state.items ? state : { items };
    }

    case 'progress': {
      const items = mapItem(state.items, action.id, (item) => {
        if (item.status !== 'uploading') {
          return null;
        }

        const progress = clampProgress(action.progress);

        return progress === item.progress ? null : { ...item, progress };
      });

      return items === state.items ? state : { items };
    }

    case 'success': {
      const items = mapItem(state.items, action.id, (item) =>
        item.status === 'uploading'
          ? { ...item, status: 'done', progress: 100, photoId: action.photoId }
          : null,
      );

      return items === state.items ? state : { items };
    }

    case 'failure': {
      const items = mapItem(state.items, action.id, (item) => {
        if (item.status !== 'uploading' && item.status !== 'pending') {
          return null;
        }

        return { ...item, status: 'error', error: action.error };
      });

      return items === state.items ? state : { items };
    }

    case 'cancel': {
      const items = mapItem(state.items, action.id, (item) =>
        item.status === 'pending' || item.status === 'uploading'
          ? { ...item, status: 'cancelled' }
          : null,
      );

      return items === state.items ? state : { items };
    }

    case 'retry': {
      const items = mapItem(state.items, action.id, (item) =>
        item.status === 'error' || item.status === 'cancelled' ? toPendingItem(item) : null,
      );

      return items === state.items ? state : { items };
    }

    case 'cancelAll': {
      const hasCancellable = state.items.some(
        (item) => item.status === 'pending' || item.status === 'uploading',
      );

      if (!hasCancellable) {
        return state;
      }

      return {
        items: state.items.map((item) =>
          item.status === 'pending' || item.status === 'uploading'
            ? { ...item, status: 'cancelled' }
            : item,
        ),
      };
    }

    case 'retryFailed': {
      const hasFailed = state.items.some((item) => item.status === 'error');

      if (!hasFailed) {
        return state;
      }

      return {
        items: state.items.map((item) => (item.status === 'error' ? toPendingItem(item) : item)),
      };
    }

    case 'remove': {
      const items = state.items.filter((item) => item.id !== action.id);

      return items.length === state.items.length ? state : { items };
    }

    case 'clearCompleted': {
      const items = state.items.filter(
        (item) => item.status !== 'done' && item.status !== 'cancelled',
      );

      return items.length === state.items.length ? state : { items };
    }
  }
}

/**
 * Resumen derivado. El porcentaje global se pondera por bytes para que un
 * archivo grande no avance lo mismo que uno pequeño.
 */
export function summarizeUploadQueue(items: readonly UploadItem[]): UploadQueueSummary {
  let completed = 0;
  let failed = 0;
  let cancelled = 0;
  let active = 0;
  let pending = 0;
  let uploadedBytes = 0;
  let totalBytes = 0;

  for (const item of items) {
    totalBytes += item.size;
    uploadedBytes += Math.round((item.size * item.progress) / 100);

    switch (item.status) {
      case 'done':
        completed += 1;
        break;
      case 'error':
        failed += 1;
        break;
      case 'cancelled':
        cancelled += 1;
        break;
      case 'uploading':
        active += 1;
        break;
      case 'pending':
        pending += 1;
        break;
    }
  }

  return {
    total: items.length,
    completed,
    failed,
    cancelled,
    active,
    pending,
    progress: totalBytes === 0 ? 0 : Math.round((uploadedBytes / totalBytes) * 100),
    uploadedBytes,
    totalBytes,
  };
}
