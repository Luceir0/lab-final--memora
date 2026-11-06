import {
  createInvitationResponseSchema,
  leaveCircleResponseSchema,
  listInvitationsResponseSchema,
  listMembersResponseSchema,
  removeMemberResponseSchema,
  revokeInvitationResponseSchema,
  type CreatedInvitationDto,
  type InvitationDto,
  type MemberDto,
} from '@memora/shared';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../lib/api-client';
import { fetchCsrfToken } from '../../lib/csrf';
import { circleKeys } from '../circles/queries';

/** Tamaño de página de miembros: el de la lista de círculos. */
export const MEMBER_PAGE_LIMIT = 24;

/** Máximo del contrato: la sección de pendientes pide todo de una vez. */
export const INVITATION_PAGE_LIMIT = 100;

export const memberKeys = {
  list: (circleId: string) => ['circle', circleId, 'members'] as const,
  invitations: (circleId: string) => ['circle', circleId, 'invitations'] as const,
};

function memberPath(circleId: string): string {
  return `/circles/${encodeURIComponent(circleId)}/members`;
}

function invitationPath(circleId: string): string {
  return `/circles/${encodeURIComponent(circleId)}/invitations`;
}

/** Miembros del círculo con keyset. «Cargar más» usa `fetchNextPage`. */
export function useMembersQuery(circleId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: memberKeys.list(circleId),
    queryFn: ({ pageParam, signal }) =>
      apiClient.get(memberPath(circleId), {
        schema: listMembersResponseSchema,
        query: { limit: MEMBER_PAGE_LIMIT, cursor: pageParam },
        signal,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

/** Aplana las páginas cargadas conservando el orden del servidor. */
export function flattenMemberPages(
  pages: readonly { readonly items: readonly MemberDto[] }[],
): readonly MemberDto[] {
  return pages.flatMap((page) => page.items);
}

/** Aplana las páginas de invitaciones. */
export function flattenInvitationPages(
  pages: readonly { readonly items: readonly InvitationDto[] }[],
): readonly InvitationDto[] {
  return pages.flatMap((page) => page.items);
}

/**
 * Invitaciones pendientes, solo para el owner.
 *
 * Un `member` nunca debe pedirlas: `enabled: false` evita la petición y el
 * servidor sigue siendo la defensa real.
 */
export function useInvitationsQuery(circleId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: memberKeys.invitations(circleId),
    queryFn: ({ pageParam, signal }) =>
      apiClient.get(invitationPath(circleId), {
        schema: listInvitationsResponseSchema,
        query: { limit: INVITATION_PAGE_LIMIT, cursor: pageParam },
        signal,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}

export interface CreateInvitationInput {
  readonly invitedEmail?: string;
}

/**
 * Crea una invitación y devuelve el token, que solo se entrega una vez.
 *
 * Pide CSRF fresco justo antes del `POST` y refresca la lista de pendientes al
 * terminar.
 */
export function useCreateInvitationMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation<CreatedInvitationDto, unknown, CreateInvitationInput>({
    mutationFn: async (input) => {
      const csrfToken = await fetchCsrfToken(queryClient);

      return apiClient.post(
        invitationPath(circleId),
        input.invitedEmail === undefined ? {} : { invitedEmail: input.invitedEmail },
        {
          schema: createInvitationResponseSchema,
          headers: { 'X-CSRF-Token': csrfToken },
        },
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.invitations(circleId) });
    },
  });
}

/** Retira una invitación. La API es idempotente. */
export function useRevokeInvitationMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: async (invitationId) => {
      const csrfToken = await fetchCsrfToken(queryClient);

      await apiClient.delete(`${invitationPath(circleId)}/${encodeURIComponent(invitationId)}`, {
        schema: revokeInvitationResponseSchema,
        headers: { 'X-CSRF-Token': csrfToken },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.invitations(circleId) });
    },
  });
}

/**
 * Salir de un círculo como miembro.
 *
 * La API responde `204`; el owner recibe `409` y no debe ver esta acción. Se
 * invalida la lista para que el círculo desaparezca de Mis círculos. La
 * limpieza del detalle la hace el consumidor **después** de navegar: borrarlo
 * aquí, con el layout todavía observándolo, lo recrea y lanza un `GET` que ya
 * devolverá `404` (m-03).
 */
export function useLeaveCircleMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, void>({
    mutationFn: async () => {
      const csrfToken = await fetchCsrfToken(queryClient);

      await apiClient.post(`/circles/${encodeURIComponent(circleId)}/leave`, undefined, {
        schema: leaveCircleResponseSchema,
        headers: { 'X-CSRF-Token': csrfToken },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: circleKeys.list });
    },
  });
}

/**
 * Quita a una persona del círculo.
 *
 * Invalida la lista de miembros y el detalle del círculo: el contador de
 * personas de la pestaña y de la cabecera sale de `['circle', id]`.
 */
export function useRemoveMemberMutation(circleId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: async (userId) => {
      const csrfToken = await fetchCsrfToken(queryClient);

      await apiClient.delete(`${memberPath(circleId)}/${encodeURIComponent(userId)}`, {
        schema: removeMemberResponseSchema,
        headers: { 'X-CSRF-Token': csrfToken },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberKeys.list(circleId) });
      void queryClient.invalidateQueries({ queryKey: circleKeys.detail(circleId) });
    },
  });
}
