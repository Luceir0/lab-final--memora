import { isApiError, isApiTransportError } from '@memora/api-client';
import { QueryClient } from '@tanstack/react-query';

/**
 * Tiempo que un dato se considera fresco. Corto a propósito: la zona privada
 * cambia con frecuencia y F09 no implementa todavía actualizaciones optimistas.
 */
export const QUERY_STALE_TIME_MS = 30_000;

/** Reintentos máximos de una query (2 reintentos = 3 intentos en total). */
export const MAX_QUERY_RETRIES = 2;

/**
 * Contexto que el router entrega a todas las rutas.
 *
 * Se crea uno por petición en servidor (dentro de `getRouter`) y uno por
 * navegador, así que no hay caché compartida entre peticiones de usuarios
 * distintos.
 */
export interface RouterContext {
  readonly queryClient: QueryClient;
}

/**
 * Decide si una query debe reintentarse.
 *
 * - `ApiError` 4xx: no. Es un error de la petición (sesión, permisos, datos);
 *   repetirla no cambia el resultado y multiplica la carga.
 * - `ApiError` 5xx: sí, hasta `MAX_QUERY_RETRIES`.
 * - `ApiTransportError` de red: sí, hasta `MAX_QUERY_RETRIES`.
 * - Cualquier otro fallo (JSON inválido, contrato incumplido, excepción
 *   inesperada): no. Reintentar no arregla un contrato roto.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isApiError(error)) {
    return error.status >= 500 && failureCount < MAX_QUERY_RETRIES;
  }

  if (isApiTransportError(error)) {
    return error.kind === 'network' && failureCount < MAX_QUERY_RETRIES;
  }

  return false;
}

/**
 * Crea un `QueryClient` aislado.
 *
 * Debe llamarse una vez por petición en servidor y una vez por navegador.
 * Nunca se comparte a nivel de módulo en el servidor: filtraría datos entre
 * usuarios.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME_MS,
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
      },
    },
  });
}
