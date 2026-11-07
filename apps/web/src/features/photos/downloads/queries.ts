import {
  createDownloadResponseSchema,
  downloadJobResponseSchema,
  type DownloadJobDto,
  type DownloadStatus,
} from '@memora/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api-client';
import { fetchCsrfToken } from '../../../lib/csrf';

/** Intervalo de sondeo mientras el job sigue en cola o procesándose. */
export const DOWNLOAD_POLL_INTERVAL_MS = 2000;

export const downloadKeys = {
  job: (jobId: string) => ['downloads', 'job', jobId] as const,
};

export interface CreateDownloadVars {
  /** Sin `photoIds`, el job descarga el álbum completo. */
  readonly photoIds?: readonly string[];
}

export interface CreateDownloadRequest extends CreateDownloadVars {
  readonly albumId: string;
  readonly csrfToken: string;
}

function isPollable(status: DownloadStatus | undefined): boolean {
  return status === 'pending' || status === 'processing';
}

/**
 * `POST /albums/:albumId/downloads`.
 *
 * La API responde `202` con el job recién encolado. El token CSRF se pide justo
 * antes de la mutación, igual que en el resto de escrituras.
 */
export function createDownloadRequest({
  albumId,
  csrfToken,
  photoIds,
}: CreateDownloadRequest): Promise<DownloadJobDto> {
  const body = photoIds === undefined ? {} : { photoIds: [...photoIds] };

  return apiClient.post(`/albums/${encodeURIComponent(albumId)}/downloads`, body, {
    schema: createDownloadResponseSchema,
    headers: { 'X-CSRF-Token': csrfToken },
  });
}

/** Crea un job de descarga con CSRF y deja su estado inicial en caché. */
export function useCreateDownloadJobMutation(albumId: string) {
  const queryClient = useQueryClient();

  return useMutation<DownloadJobDto, unknown, CreateDownloadVars>({
    mutationFn: async (vars) => {
      const csrfToken = await fetchCsrfToken(queryClient);

      return createDownloadRequest({ albumId, csrfToken, ...vars });
    },
    onSuccess: (job) => {
      queryClient.setQueryData(downloadKeys.job(job.id), job);
    },
  });
}

/**
 * `GET /downloads/:jobId` con sondeo.
 *
 * Sondea cada 2 s solo mientras el job está `pending` o `processing`; en
 * `ready`, `error` y `expired` se detiene. `progress` no se anuncia: la región
 * viva solo comunica los estados.
 */
export function useDownloadJobQuery(jobId: string | null) {
  return useQuery({
    queryKey: downloadKeys.job(jobId ?? 'none'),
    queryFn: ({ signal }) =>
      apiClient.get(`/downloads/${encodeURIComponent(jobId ?? '')}`, {
        schema: downloadJobResponseSchema,
        signal,
      }),
    enabled: jobId !== null,
    staleTime: 0,
    refetchInterval: (query) =>
      isPollable(query.state.data?.status) ? DOWNLOAD_POLL_INTERVAL_MS : false,
  });
}
