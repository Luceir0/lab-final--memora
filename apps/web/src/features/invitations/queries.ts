import { acceptInvitationResponseSchema, type AcceptInvitationResponse } from '@memora/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../lib/api-client';
import { CSRF_QUERY_KEY, fetchCsrfToken } from '../../lib/csrf';

/**
 * Claves de React Query de invitaciones.
 *
 * `csrf` comparte la clave `['csrf']` con el resto de mutaciones de la app
 * (círculos, sesión): el token se pide una sola vez por petición. Las claves
 * `['circles']`, `['circle', id]` y `['me']` también son las globales, para que
 * aceptar invalide exactamente lo que debe refrescar.
 */
export const invitationKeys = {
  preview: (token: string) => ['invitation', token] as const,
  csrf: CSRF_QUERY_KEY,
  circles: ['circles'] as const,
  circle: (circleId: string) => ['circle', circleId] as const,
  me: ['me'] as const,
};

/**
 * Acepta una invitación.
 *
 * Pide un CSRF fresco justo antes del `POST`, igual que el alta de círculos.
 * Al terminar invalida la lista, el detalle del círculo devuelto y `/me`: la
 * navegación al círculo la decide la ruta con el `circleId` de la respuesta.
 * La API es idempotente; repetir la mutación no duplica la membresía.
 */
export function useAcceptInvitationMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation<AcceptInvitationResponse, unknown, void>({
    mutationFn: async () => {
      const csrfToken = await fetchCsrfToken(queryClient);

      return apiClient.post(`/invitations/${encodeURIComponent(token)}/accept`, undefined, {
        schema: acceptInvitationResponseSchema,
        headers: { 'X-CSRF-Token': csrfToken },
      });
    },
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: invitationKeys.circles });
      void queryClient.invalidateQueries({
        queryKey: invitationKeys.circle(response.circle.id),
      });
      void queryClient.invalidateQueries({ queryKey: invitationKeys.me });
    },
  });
}
