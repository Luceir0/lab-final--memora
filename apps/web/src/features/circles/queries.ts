import {
  circleDetailResponseSchema,
  circleResponseSchema,
  csrfResponseSchema,
  listCirclesResponseSchema,
  logoutResponseSchema,
  meResponseSchema,
  type CircleDetailDto,
  type CircleDto,
  type CircleStats,
  type CreateCircleRequest,
} from '@memora/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiClient } from '../../lib/api-client';

/** Tamaño de página pedido a `GET /circles`. */
export const CIRCLE_LIST_PAGE_LIMIT = 24;

/**
 * Claves compartidas de React Query.
 *
 * El detalle usa `['circle', id]` para que la lista pueda pedir sus stats con
 * N+1 y la futura página de detalle reutilice exactamente la misma caché.
 */
export const circleKeys = {
  list: ['circles', 'list'] as const,
  detail: (circleId: string) => ['circle', circleId] as const,
  me: ['me'] as const,
  csrf: ['csrf'] as const,
};

function fetchCirclePage(cursor: string | null, signal: AbortSignal) {
  return apiClient.get('/circles', {
    schema: listCirclesResponseSchema,
    query: { limit: CIRCLE_LIST_PAGE_LIMIT, cursor },
    signal,
  });
}

export interface CircleListQueryOptions {
  readonly enabled?: boolean;
}

/** Lista paginada con keyset. El botón «Cargar más» usa `fetchNextPage`. */
export function useCircleListQuery(options: CircleListQueryOptions = {}) {
  return useInfiniteQuery({
    queryKey: circleKeys.list,
    queryFn: ({ pageParam, signal }) => fetchCirclePage(pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: options.enabled ?? true,
  });
}

/** Persona autenticada. La clave `['me']` se comparte con el resto del shell. */
export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: circleKeys.me,
    queryFn: () => apiClient.get('/me', { schema: meResponseSchema }),
    enabled,
  });
}

export interface CircleListItems {
  readonly circles: readonly CircleDto[];
}

/** Aplana todas las páginas cargadas en una sola lista estable. */
export function flattenCirclePages(
  pages: readonly { readonly items: readonly CircleDto[] }[],
): CircleListItems {
  return { circles: pages.flatMap((page) => page.items) };
}

export interface CircleStatsResult {
  readonly statsById: ReadonlyMap<string, CircleStats>;
  readonly error: unknown;
}

/**
 * Stats de la lista con una petición por círculo.
 *
 * Es el N+1 decidido en F18: el contrato de `GET /circles` no incluye stats y
 * no se cambia. La clave de cada consulta es la del detalle, así que abrir un
 * círculo después no repite la petición.
 */
export function useCircleStats(circleIds: readonly string[]): CircleStatsResult {
  const results = useQueries({
    queries: circleIds.map((circleId) => ({
      queryKey: circleKeys.detail(circleId),
      queryFn: ({ signal }) =>
        apiClient.get(`/circles/${encodeURIComponent(circleId)}`, {
          schema: circleDetailResponseSchema,
          signal,
        }),
    })),
  });

  const statsById = new Map<string, CircleStats>();
  let error: unknown = null;

  results.forEach((result, index) => {
    const circleId = circleIds[index];

    if (circleId === undefined) {
      return;
    }

    if (result.data !== undefined) {
      statsById.set(circleId, result.data.stats);
    }

    if (error === null && result.error !== null) {
      error = result.error;
    }
  });

  return { statsById, error };
}

/** Detalle completo de un círculo. Comparte clave con el N+1 de la lista. */
export function useCircleDetailQuery(circleId: string, enabled = true) {
  return useQuery<CircleDetailDto>({
    queryKey: circleKeys.detail(circleId),
    queryFn: () =>
      apiClient.get(`/circles/${encodeURIComponent(circleId)}`, {
        schema: circleDetailResponseSchema,
      }),
    enabled,
  });
}

/**
 * Alta de círculo.
 *
 * Pide el token CSRF justo antes del `POST` (la cookie de sesión puede haber
 * rotado) y lo envía en `X-CSRF-Token`. Al terminar invalida la lista para que
 * el círculo aparezca sin recargar.
 */
export function useCreateCircleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCircleRequest): Promise<CircleDto> => {
      const { csrfToken } = await queryClient.fetchQuery({
        queryKey: circleKeys.csrf,
        queryFn: () => apiClient.get('/auth/csrf', { schema: csrfResponseSchema }),
        staleTime: 0,
      });

      return apiClient.post('/circles', input, {
        schema: circleResponseSchema,
        headers: { 'X-CSRF-Token': csrfToken },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: circleKeys.list });
    },
  });
}

/**
 * Cierre de sesión desde el estado «sin acceso».
 *
 * `POST /auth/logout` exige sesión, `Origin`/`Referer` y `X-CSRF-Token`; el
 * token se pide justo antes. La limpieza de caché y la navegación las hace el
 * consumidor, porque dependen de la ruta actual que se quiere conservar.
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { csrfToken } = await queryClient.fetchQuery({
        queryKey: circleKeys.csrf,
        queryFn: () => apiClient.get('/auth/csrf', { schema: csrfResponseSchema }),
        staleTime: 0,
      });

      await apiClient.post('/auth/logout', undefined, {
        schema: logoutResponseSchema,
        headers: { 'X-CSRF-Token': csrfToken },
      });
    },
  });
}
