import { createContext, useContext } from 'react';

import type { UploadEnqueueOptions, UploadItem, UploadQueueSummary } from './types';

export interface UploadQueueOpenOptions {
  /** Mueve el foco al panel al abrirlo (solo escritorio). */
  readonly focus?: boolean;
}

export interface UploadQueueApi {
  readonly items: readonly UploadItem[];
  readonly summary: UploadQueueSummary;
  readonly enqueue: (files: ArrayLike<File>, options: UploadEnqueueOptions) => void;
  readonly isPanelOpen: boolean;
  readonly focusOnOpen: boolean;
  readonly openPanel: (options?: UploadQueueOpenOptions) => void;
  readonly closePanel: () => void;
  readonly retry: (id: string) => void;
  readonly cancel: (id: string) => void;
  readonly cancelAll: () => void;
  readonly retryFailed: () => void;
  readonly remove: (id: string) => void;
  readonly clearCompleted: () => void;
  readonly hasActiveUploads: boolean;
}

export const UploadQueueContext = createContext<UploadQueueApi | null>(null);

/**
 * Acceso a la cola global.
 *
 * El provider vive en `_app.tsx`, por encima de las pantallas, para que la cola
 * sobreviva a la navegación. Fuera de él es un error de composición, no un
 * caso recuperable.
 */
export function useUploadQueue(): UploadQueueApi {
  const context = useContext(UploadQueueContext);

  if (context === null) {
    throw new Error('useUploadQueue debe usarse dentro de UploadProvider.');
  }

  return context;
}
