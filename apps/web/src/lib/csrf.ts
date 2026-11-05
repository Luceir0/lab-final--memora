import { csrfResponseSchema } from '@memora/shared';
import type { QueryClient } from '@tanstack/react-query';

import { apiClient } from './api-client';

/**
 * Clave compartida del token CSRF.
 *
 * Todas las mutaciones de la app piden el token justo antes de usarlo con
 * `staleTime: 0`, así que la clave es única para evitar tokens de otros flujos.
 */
export const CSRF_QUERY_KEY = ['csrf'] as const;

/**
 * Pide un token CSRF fresco.
 *
 * La cookie de sesión puede haber rotado entre el render y la mutación; por eso
 * no se reutiliza un token cacheado. Centralizarlo aquí evita que cada feature
 * repita la URL y el esquema.
 */
export async function fetchCsrfToken(queryClient: QueryClient): Promise<string> {
  const { csrfToken } = await queryClient.fetchQuery({
    queryKey: CSRF_QUERY_KEY,
    queryFn: () => apiClient.get('/auth/csrf', { schema: csrfResponseSchema }),
    staleTime: 0,
  });

  return csrfToken;
}
