import {
  can,
  circleMemberParamsSchema,
  circleParamsSchema,
  errorResponseSchema,
  leaveCircleResponseSchema,
  listMembersQuerySchema,
  listMembersResponseSchema,
  personPhotosParamsSchema,
  personPhotosQuerySchema,
  personPhotosResponseSchema,
  removeMemberResponseSchema,
  type PermissionActor,
  type PermissionCircle,
} from '@memora/shared';
import type { FastifyRequest } from 'fastify';

import type { AppConfig } from '../../config.ts';
import { ApiError } from '../../errors.ts';
import type { PrismaClient } from '../../generated/prisma/client.ts';
import { SESSION_SECURITY_SCHEME } from '../../plugins/swagger.ts';
import type { MemoraServer } from '../../types.ts';
import { csrfHeaderSchema } from '../auth/csrf-header.ts';
import { assertCsrfToken, requirePrisma, setPrivateNoStore } from '../auth/guards.ts';
import { assertTrustedOrigin } from '../auth/origin.ts';
import { resolveSession } from '../auth/session.ts';
import { toCircleSettings } from '../circles/dto.ts';
import { findCircleForMember, type CircleMembership } from '../circles/service.ts';
import { decodeMemberCursor, decodePersonPhotoCursor } from './cursor.ts';
import {
  findCircleMember,
  leaveCircle,
  listMembersPage,
  listPersonPhotosPage,
  removeCircleMember,
} from './service.ts';

const MEMBERS_TAG = 'Circles';

const sessionSecurity = [{ [SESSION_SECURITY_SCHEME]: [] }];

/**
 * Same generic wording for both owner conflicts: leaving and being expelled
 * must not depend on who reads it, and neither operation is possible for the
 * owner (they have to delete the circle instead).
 */
export const OWNER_CONFLICT_MESSAGE = 'El propietario no puede salir ni ser expulsado del círculo.';

/**
 * Circle members.
 *
 * Visibility rule: every route requires a membership row for the caller, so a
 * stranger always gets `404 NOT_FOUND` (never `403`, which would confirm that
 * the circle or the user exists in it). Expulsion is decided by `can()` with
 * the persisted `Circle.ownerId`, never by the membership `role`: a member
 * with a forged `owner` role gets `403`.
 */
export function registerMemberRoutes(app: MemoraServer, config: AppConfig): void {
  const trustedOrigin = async (request: FastifyRequest): Promise<void> => {
    assertTrustedOrigin(request, config);
  };

  app.get(
    '/api/circles/:circleId/members',
    {
      schema: {
        tags: [MEMBERS_TAG],
        summary: 'Listar miembros',
        description:
          'Miembros del círculo visibles para cualquier miembro. Orden `joinedAt asc` con desempate `id asc`, de ' +
          'modo que el propietario queda primero. Keyset opaco con `?cursor=` y `limit` (1–100, defecto 24). ' +
          'Cada miembro incluye `photosCount`: fotos **de este círculo** en las que está etiquetado. Nunca ' +
          'incluye el email. Sin membresía → `404 NOT_FOUND`.',
        security: sessionSecurity,
        params: circleParamsSchema,
        querystring: listMembersQuerySchema,
        response: {
          200: listMembersResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user } = await resolveSession(prisma, config, request, reply);
      const membership = await requireCircleMembership(prisma, user.id, request.params.circleId);
      const { cursor, limit } = request.query;
      const page = await listMembersPage(prisma, membership.circle, {
        cursor: cursor === undefined ? null : decodeMemberCursor(cursor),
        limit,
      });

      setPrivateNoStore(reply);

      return page;
    },
  );

  app.delete(
    '/api/circles/:circleId/members/:userId',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [MEMBERS_TAG],
        summary: 'Expulsar miembro',
        description:
          'Expulsa a un miembro. Solo el propietario: un miembro recibe `403 FORBIDDEN` y un extraño ' +
          '`404 NOT_FOUND`. El objetivo debe pertenecer al círculo (`404` si no) y no puede ser el propietario, ' +
          'incluido uno mismo (`409 CONFLICT`). En una transacción borra sus etiquetas **en fotos de este ' +
          'círculo** y su membresía; sus fotos, la autoría y la actividad se conservan. Responde `204`.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: circleMemberParamsSchema,
        response: {
          204: removeMemberResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user, token } = await resolveSession(prisma, config, request, reply);

      assertCsrfToken(request, app, token);

      const membership = await requireCircleMembership(prisma, user.id, request.params.circleId);

      assertMemberPermission(user.id, membership, 'member.remove');

      const targetId = request.params.userId;
      const target = await findCircleMember(prisma, membership.circle.id, targetId);

      if (target === null) {
        throw new ApiError('NOT_FOUND');
      }

      assertTargetIsNotOwner(membership, targetId);

      const removed = await removeCircleMember(prisma, membership.circle.id, targetId);

      if (removed === 0) {
        // Lost a race with a concurrent leave/expulsion: same outcome as a
        // target that was no longer a member.
        throw new ApiError('NOT_FOUND');
      }

      return reply.code(204).send();
    },
  );

  app.post(
    '/api/circles/:circleId/leave',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [MEMBERS_TAG],
        summary: 'Salir del círculo',
        description:
          'El miembro de la sesión abandona el círculo. El propietario no puede salir (`409 CONFLICT`) porque ' +
          'debe borrar el círculo: la decisión se toma por `Circle.ownerId`, no por el rol de la fila. Un usuario ' +
          'sin membresía recibe `404 NOT_FOUND`. En una transacción borra sus etiquetas en fotos de este círculo ' +
          'y su membresía; sus fotos y la autoría se conservan. Responde `204`.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: circleParamsSchema,
        response: {
          204: leaveCircleResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user, token } = await resolveSession(prisma, config, request, reply);

      assertCsrfToken(request, app, token);

      const membership = await requireCircleMembership(prisma, user.id, request.params.circleId);

      assertTargetIsNotOwner(membership, user.id);

      const removed = await leaveCircle(prisma, membership.circle.id, user.id);

      if (removed === 0) {
        throw new ApiError('NOT_FOUND');
      }

      return reply.code(204).send();
    },
  );

  app.get(
    '/api/circles/:circleId/members/:userId/photos',
    {
      schema: {
        tags: [MEMBERS_TAG],
        summary: 'Fotos de esta persona',
        description:
          'Fotos **de este círculo** en las que el miembro indicado está etiquetado, con `PhotoDto` completo ' +
          '(autor, etiquetas y URLs `thumb`/`display`). Orden `createdAt desc` con desempate `id desc`, keyset ' +
          'opaco con `?cursor=` y `limit` (1–100, defecto 24). Tanto el llamante como el objetivo deben ' +
          'pertenecer al círculo; si cualquiera de los dos no es miembro, `404 NOT_FOUND` para no revelar ' +
          'usuarios de otros círculos.',
        security: sessionSecurity,
        params: personPhotosParamsSchema,
        querystring: personPhotosQuerySchema,
        response: {
          200: personPhotosResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user } = await resolveSession(prisma, config, request, reply);
      const membership = await requireCircleMembership(prisma, user.id, request.params.circleId);
      const target = await findCircleMember(prisma, membership.circle.id, request.params.userId);

      if (target === null) {
        throw new ApiError('NOT_FOUND');
      }

      const { cursor, limit } = request.query;
      const page = await listPersonPhotosPage(prisma, membership.circle.id, target.userId, {
        cursor: cursor === undefined ? null : decodePersonPhotoCursor(cursor),
        limit,
      });

      setPrivateNoStore(reply);

      return page;
    },
  );
}

/** Loads the circle for a member or throws the shared `404`. */
async function requireCircleMembership(
  prisma: PrismaClient,
  userId: string,
  circleId: string,
): Promise<CircleMembership> {
  const membership = await findCircleForMember(prisma, circleId, userId);

  if (membership === null) {
    throw new ApiError('NOT_FOUND');
  }

  return membership;
}

/**
 * Checks `member.remove` for the loaded circle.
 *
 * Ownership is decided solely by `Circle.ownerId` inside `can()`: a forged
 * `role: 'owner'` in the membership row cannot escalate.
 */
function assertMemberPermission(
  userId: string,
  membership: CircleMembership,
  action: 'member.remove',
): void {
  const actor: PermissionActor = { id: userId, role: membership.membership.role };
  const circle: PermissionCircle = {
    id: membership.circle.id,
    ownerId: membership.circle.ownerId,
    settings: toCircleSettings(membership.circle.settings),
  };

  if (!can(actor, action, circle)) {
    throw new ApiError('FORBIDDEN');
  }
}

/** The owner can neither leave nor be expelled; they must delete the circle. */
function assertTargetIsNotOwner(membership: CircleMembership, userId: string): void {
  if (membership.circle.ownerId === userId) {
    throw new ApiError('CONFLICT', { message: OWNER_CONFLICT_MESSAGE });
  }
}
