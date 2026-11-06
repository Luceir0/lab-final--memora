import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { fetchCsrfToken } from '../../lib/csrf';
import { invalidateAlbumAfterUpload } from './album-refresh';
import { isCsrfFailure, isUploadCancelledError, toUploadError } from './errors';
import { createClientUploadId, createUploadItemId } from './ids';
import { createPreviewUrl, revokePreviewUrl } from './preview';
import { INITIAL_UPLOAD_QUEUE_STATE, summarizeUploadQueue, uploadQueueReducer } from './reducer';
import {
  createXhrUploadTransport,
  type UploadTransport,
  type UploadTransportRequest,
} from './transport';
import type {
  EnqueueUploadEntry,
  UploadEnqueueOptions,
  UploadItem,
  UploadQueueSummary,
} from './types';
import { UploadAnnouncer } from './upload-announcer';
import {
  UploadQueueContext,
  type UploadQueueApi,
  type UploadQueueOpenOptions,
} from './upload-queue-context';
import { MAX_CONCURRENT_UPLOADS, validateUploadBatch } from './validation';

export interface UploadProviderProps {
  readonly children: ReactNode;
  /** Transporte inyectable; en producción se usa XHR. */
  readonly transport?: UploadTransport;
}

function toTransportFields(item: UploadItem): UploadTransportRequest['fields'] {
  return {
    clientUploadId: item.clientUploadId,
    ...(item.takenAt === undefined ? {} : { takenAt: item.takenAt }),
    ...(item.description === undefined ? {} : { description: item.description }),
  };
}

/**
 * Provider global de la cola de subida.
 *
 * No toca `window`, `localStorage` ni `crypto` durante el render: el estado
 * inicial es siempre una cola vacía, idéntica en servidor y cliente. Las
 * subidas solo arrancan en un efecto de cliente.
 */
export function UploadProvider({ children, transport }: UploadProviderProps) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(uploadQueueReducer, INITIAL_UPLOAD_QUEUE_STATE);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [focusOnOpen, setFocusOnOpen] = useState(false);
  const [uploadTransport] = useState<UploadTransport>(
    () => transport ?? createXhrUploadTransport(),
  );

  const controllersRef = useRef(new Map<string, AbortController>());
  const inFlightRef = useRef(new Set<string>());
  const itemsRef = useRef<readonly UploadItem[]>(state.items);
  const tokenPromiseRef = useRef<Promise<string> | null>(null);

  itemsRef.current = state.items;

  const requestToken = useCallback((): Promise<string> => {
    if (tokenPromiseRef.current === null) {
      tokenPromiseRef.current = fetchCsrfToken(queryClient).catch((error: unknown) => {
        tokenPromiseRef.current = null;
        throw error;
      });
    }

    return tokenPromiseRef.current;
  }, [queryClient]);

  const refreshToken = useCallback((): Promise<string> => {
    const promise = fetchCsrfToken(queryClient).catch((error: unknown) => {
      tokenPromiseRef.current = null;
      throw error;
    });

    tokenPromiseRef.current = promise;

    return promise;
  }, [queryClient]);

  const startUpload = useCallback(
    async (item: UploadItem): Promise<void> => {
      const controller = new AbortController();
      controllersRef.current.set(item.id, controller);

      dispatch({ type: 'start', id: item.id });

      const fields = toTransportFields(item);

      const send = (csrfToken: string) =>
        uploadTransport.upload({
          albumId: item.albumId,
          file: item.file,
          fields,
          csrfToken,
          signal: controller.signal,
          onProgress: (progress) => {
            dispatch({ type: 'progress', id: item.id, progress });
          },
        });

      try {
        let photo;

        try {
          photo = await send(await requestToken());
        } catch (error) {
          if (!isCsrfFailure(error)) {
            throw error;
          }

          // Un token por lote; si la sesión rotó, se refresca UNA vez.
          photo = await send(await refreshToken());
        }

        invalidateAlbumAfterUpload(queryClient, item.albumId);

        if (controller.signal.aborted) {
          return;
        }

        dispatch({ type: 'success', id: item.id, photoId: photo.id });
      } catch (error) {
        if (isUploadCancelledError(error) || controller.signal.aborted) {
          return;
        }

        dispatch({ type: 'failure', id: item.id, error: toUploadError(error) });
      } finally {
        controllersRef.current.delete(item.id);
        inFlightRef.current.delete(item.id);
      }
    },
    [queryClient, requestToken, refreshToken, uploadTransport],
  );

  // Arranca pendientes al liberarse hueco: 3 peticiones simultáneas como máximo.
  useEffect(() => {
    const active = state.items.filter((item) => item.status === 'uploading').length;
    let freeSlots = MAX_CONCURRENT_UPLOADS - active;

    if (freeSlots <= 0) {
      return;
    }

    for (const item of state.items) {
      if (freeSlots === 0) {
        break;
      }

      if (item.status !== 'pending' || inFlightRef.current.has(item.id)) {
        continue;
      }

      inFlightRef.current.add(item.id);
      freeSlots -= 1;
      void startUpload(item);
    }
  }, [state.items, startUpload]);

  // Al desmontar: aborta peticiones y libera previews. No hay subidas en
  // segundo plano (fuera del alcance de F26).
  useEffect(() => {
    const controllers = controllersRef.current;

    return () => {
      for (const controller of controllers.values()) {
        controller.abort();
      }

      for (const item of itemsRef.current) {
        revokePreviewUrl(item.previewUrl);
      }
    };
  }, []);

  const enqueue = useCallback((files: ArrayLike<File>, options: UploadEnqueueOptions): void => {
    if (files.length === 0) {
      return;
    }

    const validation = validateUploadBatch(files);
    const entries: EnqueueUploadEntry[] = validation.files.map(({ file, error }) => ({
      id: createUploadItemId(),
      file,
      albumId: options.albumId,
      albumTitle: options.albumTitle,
      source: options.source,
      previewUrl: createPreviewUrl(file),
      originalName: file.name,
      clientUploadId: createClientUploadId(),
      size: file.size,
      ...(options.takenAt === undefined ? {} : { takenAt: options.takenAt }),
      ...(options.description === undefined ? {} : { description: options.description }),
      ...(error === null ? {} : { error }),
    }));

    tokenPromiseRef.current = null;
    dispatch({ type: 'enqueue', entries });

    // Abrir tras encolar, sin mover el foco: también si todos los archivos
    // fallaron la validación de cliente, para que el usuario vea el motivo.
    setFocusOnOpen(false);
    setIsPanelOpen(true);
  }, []);

  const openPanel = useCallback((options?: UploadQueueOpenOptions): void => {
    setFocusOnOpen(options?.focus === true);
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback((): void => {
    setIsPanelOpen(false);
    setFocusOnOpen(false);
  }, []);

  const cancel = useCallback((id: string): void => {
    controllersRef.current.get(id)?.abort();
    dispatch({ type: 'cancel', id });
  }, []);

  const cancelAll = useCallback((): void => {
    for (const controller of controllersRef.current.values()) {
      controller.abort();
    }

    dispatch({ type: 'cancelAll' });
  }, []);

  const retry = useCallback((id: string): void => {
    dispatch({ type: 'retry', id });
  }, []);

  const retryFailed = useCallback((): void => {
    dispatch({ type: 'retryFailed' });
  }, []);

  const remove = useCallback((id: string): void => {
    const item = itemsRef.current.find((candidate) => candidate.id === id);

    controllersRef.current.get(id)?.abort();

    if (item !== undefined) {
      revokePreviewUrl(item.previewUrl);
    }

    dispatch({ type: 'remove', id });
  }, []);

  const clearCompleted = useCallback((): void => {
    for (const item of itemsRef.current) {
      if (item.status === 'done' || item.status === 'cancelled') {
        revokePreviewUrl(item.previewUrl);
      }
    }

    dispatch({ type: 'clearCompleted' });
  }, []);

  const summary: UploadQueueSummary = useMemo(
    () => summarizeUploadQueue(state.items),
    [state.items],
  );

  const value = useMemo<UploadQueueApi>(
    () => ({
      items: state.items,
      summary,
      enqueue,
      isPanelOpen,
      focusOnOpen,
      openPanel,
      closePanel,
      retry,
      cancel,
      cancelAll,
      retryFailed,
      remove,
      clearCompleted,
      hasActiveUploads: summary.pending > 0 || summary.active > 0,
    }),
    [
      state.items,
      summary,
      enqueue,
      isPanelOpen,
      focusOnOpen,
      openPanel,
      closePanel,
      retry,
      cancel,
      cancelAll,
      retryFailed,
      remove,
      clearCompleted,
    ],
  );

  return (
    <UploadQueueContext.Provider value={value}>
      {children}
      <UploadAnnouncer items={state.items} />
    </UploadQueueContext.Provider>
  );
}
