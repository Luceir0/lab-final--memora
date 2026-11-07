import { meResponseSchema, type MeResponse, type UpdateMeRequest } from '@memora/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../lib/api-client';
import { fetchCsrfToken } from '../../lib/csrf';
import { circleKeys } from '../circles/queries';

/**
 * Guarda los datos editables del perfil (`PATCH /api/me`).
 *
 * - Pide un CSRF fresco justo antes: la cookie de sesión puede haber rotado.
 * - Refresca `['me']`, la clave que comparten el shell, el sidebar y esta
 *   pantalla, para que el nombre nuevo aparezca sin recargar.
 * - El email y el avatar no viajan en el contrato: no se envían.
 */
export function useUpdateMeMutation() {
  const queryClient = useQueryClient();

  return useMutation<MeResponse, unknown, UpdateMeRequest>({
    mutationFn: async (input) => {
      const csrfToken = await fetchCsrfToken(queryClient);

      return apiClient.patch('/me', input, {
        schema: meResponseSchema,
        headers: { 'X-CSRF-Token': csrfToken },
      });
    },
    onSuccess: (response) => {
      queryClient.setQueryData(circleKeys.me, response);
    },
  });
}
