import type { DownloadJobDto, DownloadStatus } from '@memora/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  useCreateDownloadJobMutation,
  useDownloadJobQuery,
  type CreateDownloadVars,
} from './queries';
import { downloadJobFileUrl, triggerBrowserDownload } from './paths';

export type DownloadUiStatus = 'idle' | DownloadStatus | 'creating';

export interface DownloadJobController {
  readonly status: DownloadUiStatus;
  readonly job: DownloadJobDto | null;
  readonly error: unknown;
  /** Hay un job en creación o procesándose: bloquea nuevas descargas. */
  readonly isGenerating: boolean;
  /** Crea un job. Sin `photoIds`, descarga el álbum completo. */
  readonly start: (vars?: CreateDownloadVars) => void;
  /** Crea otro job con la última petición (error o enlace caducado). */
  readonly retry: () => void;
  /** Abandona el seguimiento del job actual. */
  readonly reset: () => void;
  /** Vuelve a descargar el ZIP de un job ya listo. */
  readonly downloadAgain: () => void;
}

export interface UseDownloadJobControllerOptions {
  readonly albumId: string;
}

/**
 * Único dueño del job de descarga de una pantalla.
 *
 * Crea el job con CSRF, lo sondea cada 2 s y dispara la descarga una sola vez
 * al pasar a `ready`. Un ref bloquea dobles clics de forma síncrona: el estado
 * de React llega un render tarde y no evita la segunda petición.
 *
 * El llamador decide dónde pintar el estado con `DownloadJobToast`; así una
 * misma pantalla comparte un solo job entre la cabecera y la selección.
 */
export function useDownloadJobController({
  albumId,
}: UseDownloadJobControllerOptions): DownloadJobController {
  const createMutation = useCreateDownloadJobMutation(albumId);
  const [jobId, setJobId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<unknown>(null);
  const jobQuery = useDownloadJobQuery(jobId);
  const job = jobQuery.data ?? null;
  const activeRef = useRef(false);
  const lastRequestRef = useRef<CreateDownloadVars>({});
  const downloadedJobRef = useRef<string | null>(null);

  const start = useCallback(
    (vars: CreateDownloadVars = {}) => {
      if (activeRef.current) {
        return;
      }

      // El bloqueo es síncrono: dos clics en el mismo tick solo crean un job.
      activeRef.current = true;
      lastRequestRef.current = vars;
      setCreateError(null);
      setJobId(null);

      createMutation.mutate(vars, {
        onSuccess: (created) => {
          downloadedJobRef.current = null;
          setJobId(created.id);
        },
        onError: (error) => {
          activeRef.current = false;
          setCreateError(error);
        },
      });
    },
    [createMutation],
  );

  const reset = useCallback(() => {
    activeRef.current = false;
    downloadedJobRef.current = null;
    lastRequestRef.current = {};
    setJobId(null);
    setCreateError(null);
    createMutation.reset();
  }, [createMutation]);

  const retry = useCallback(() => {
    start(lastRequestRef.current);
  }, [start]);

  const downloadAgain = useCallback(() => {
    if (job?.status === 'ready') {
      triggerBrowserDownload(downloadJobFileUrl(job.id));
    }
  }, [job]);

  useEffect(() => {
    if (job === null) {
      return;
    }

    if (job.status === 'ready') {
      if (downloadedJobRef.current !== job.id) {
        downloadedJobRef.current = job.id;
        triggerBrowserDownload(downloadJobFileUrl(job.id));
      }

      activeRef.current = false;
      return;
    }

    if (job.status === 'error' || job.status === 'expired') {
      activeRef.current = false;
    }
  }, [job]);

  let status: DownloadUiStatus = 'idle';

  if (createMutation.isPending) {
    status = 'creating';
  } else if (createError !== null) {
    status = 'error';
  } else if (jobQuery.isError && job !== null) {
    status = 'error';
  } else if (job !== null) {
    status = job.status;
  }

  return {
    status,
    job,
    error: createError ?? jobQuery.error,
    isGenerating: status === 'creating' || status === 'pending' || status === 'processing',
    start,
    retry,
    reset,
    downloadAgain,
  };
}
