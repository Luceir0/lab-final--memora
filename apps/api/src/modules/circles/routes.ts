import {
  can,
  circleDetailResponseSchema,
  circleParamsSchema,
  circleResponseSchema,
  createCircleRequestSchema,
  deleteCircleResponseSchema,
  errorResponseSchema,
  listCirclesQuerySchema,
  listCirclesResponseSchema,
  updateCircleRequestSchema,
  type PermissionActor,
  type PermissionCircle,
} from '@memora/shared';
import type { FastifyRequest } from 'fastify';

import type { AppConfig } from '../../config.ts';
import { ApiError } from '../../errors.ts';
import { Prisma, type PrismaClient } from '../../generated/prisma/client.ts';
import { SESSION_SECURITY_SCHEME } from '../../plugins/swagger.ts';
import type { MemoraServer } from '../../types.ts';
import { csrfHeaderSchema } from '../auth/csrf-header.ts';
import { assertCsrfToken, requirePrisma, setPrivateNoStore } from '../auth/guards.ts';
import { assertTrustedOrigin } from '../auth/origin.ts';
import { resolveSession } from '../auth/session.ts';
import { decodeCircleCursor } from './cursor.ts';
import { resolveCircleRole, toCircleDetailDto, toCircleDto, toCircleSettings } from './dto.ts';
import {
  createCircleWithOwner,
  deleteCircle,
  findCircleForMember,
  findCirclePhoto,
  listCirclesPage,
  loadCircleStats,
  updateCircle,
  type CircleMembership,
  type UpdatedCircle,
} from './service.ts';

const CIRCLES_TAG = 'Circles';

const sessionSecurity = [{ [SESSION_SECURITY_SCHEME]: [] }];

/**
 * Circles CRUD.
 *
 * Visibility rule: a circle is only reachable through a membership row, so a
 * stranger always gets `404 NOT_FOUND` (never `403`, which would confirm that
 * the circle exists). Permission is decided by `can()` using the persisted
 * `Circle.ownerId`, never by the membership `role` alone.
 */
export function registerCircleRoutes(app: MemoraServer, config: AppConfig): void {
  const trustedOrigin = async (request: FastifyRequest): Promise<void> => {
    assertTrustedOrigin(request, config);
  };

  app.get(
    '/api/circles',
    {
      schema: {
        tags: [CIRCLES_TAG],
        summary: 'Listar círculos',
        description:
          'Círculos donde el usuario tiene membresía, ordenados por `updatedAt` descendente con desempate por `id`. ' +
          'Paginación keyset opaca con `?cursor=` y `limit` (1–100, defecto 24). Un cursor inválido devuelve ' +
          '`400 VALIDATION_ERROR` con el detalle del campo `cursor`; un `limit` fuera de rango se rechaza, no se recorta.',
        security: sessionSecurity,
        querystring: listCirclesQuerySchema,
        response: {
          200: listCirclesResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user } = await resolveSession(prisma, config, request, reply);
      const { cursor, limit } = request.query;
      const page = await listCirclesPage(prisma, user.id, {
        cursor: cursor === undefined ? null : decodeCircleCursor(cursor),
        limit,
      });

      setPrivateNoStore(reply);

      return page;
    },
  );

  app.post(
    '/api/circles',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [CIRCLES_TAG],
        summary: 'Crear círculo',
        description:
          'Crea el círculo y, en la misma transacción, la membresía `owner` del creador. `settings` es opcional: ' +
          'si falta se aplican los valores por defecto y, si viene, se guarda el objeto completo sin merge. ' +
          'Requiere sesión, `Origin` permitido y `X-CSRF-Token`.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        body: createCircleRequestSchema,
        response: {
          201: circleResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user, token } = await resolveSession(prisma, config, request, reply);

      assertCsrfToken(request, app, token);

      const { name, description, settings } = request.body;
      const created = await createCircleWithOwner(prisma, {
        ownerId: user.id,
        name,
        description: description ?? null,
        settings,
      });

      return reply
        .code(201)
        .send(
          toCircleDto(
            created.circle,
            resolveCircleRole(created.circle, user.id, created.membership.role),
            created.coverPhoto,
          ),
        );
    },
  );

  app.get(
    '/api/circles/:circleId',
    {
      schema: {
        tags: [CIRCLES_TAG],
        summary: 'Detalle de círculo',
        description:
          'Detalle con `stats` del círculo. Solo para miembros; un usuario sin membresía recibe `404 NOT_FOUND`. ' +
          'Las stats se calculan únicamente sobre las filas de este círculo.',
        security: sessionSecurity,
        params: circleParamsSchema,
        response: {
          200: circleDetailResponseSchema,
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
      const stats = await loadCircleStats(prisma, membership.circle.id);
      const circleDto = toCircleDto(
        membership.circle,
        resolveCircleRole(membership.circle, user.id, membership.membership.role),
        membership.coverPhoto,
      );

      setPrivateNoStore(reply);

      return toCircleDetailDto(circleDto, stats);
    },
  );

  app.patch(
    '/api/circles/:circleId',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [CIRCLES_TAG],
        summary: 'Editar círculo',
        description:
          'Edita nombre, descripción, portada y settings. Solo el propietario: un miembro sin permiso recibe ' +
          '`403 FORBIDDEN` y un extraño `404 NOT_FOUND`. Los settings se reemplazan completos; un `coverPhotoId` ' +
          'de otro círculo devuelve `404 NOT_FOUND` y `null` limpia la portada.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: circleParamsSchema,
        body: updateCircleRequestSchema,
        response: {
          200: circleResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user, token } = await resolveSession(prisma, config, request, reply);

      assertCsrfToken(request, app, token);

      const membership = await requireCircleMembership(prisma, user.id, request.params.circleId);
      assertCirclePermission(user.id, membership, 'circle.update');

      const { name, description, coverPhotoId, settings } = request.body;

      if (coverPhotoId !== undefined && coverPhotoId !== null) {
        await assertPhotoBelongsToCircle(prisma, membership.circle.id, coverPhotoId);
      }

      let updated: UpdatedCircle;

      try {
        updated = await updateCircle(prisma, membership.circle.id, {
          name,
          description,
          coverPhotoId,
          settings,
        });
      } catch (error) {
        // The row disappeared (or the cover was deleted) between the read and
        // the write: same outcome as a missing circle, never a 500.
        if (isCircleWriteRace(error)) {
          throw new ApiError('NOT_FOUND');
        }

        throw error;
      }

      return toCircleDto(
        updated.circle,
        resolveCircleRole(updated.circle, user.id, membership.membership.role),
        updated.coverPhoto,
      );
    },
  );

  app.delete(
    '/api/circles/:circleId',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [CIRCLES_TAG],
        summary: 'Borrar círculo',
        description:
          'Borra el círculo y sus filas dependientes por la cascada de la base de datos. Solo el propietario. ' +
          'Responde `204` sin cuerpo. Un círculo ya inexistente (por ejemplo, dos `DELETE` seguidos) responde ' +
          '`404 NOT_FOUND`.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: circleParamsSchema,
        response: {
          204: deleteCircleResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user, token } = await resolveSession(prisma, config, request, reply);

      assertCsrfToken(request, app, token);

      const membership = await requireCircleMembership(prisma, user.id, request.params.circleId);
      assertCirclePermission(user.id, membership, 'circle.delete');

      const deleted = await deleteCircle(prisma, membership.circle.id);

      if (deleted === 0) {
        // Lost race with another delete: same status as a sequential retry.
        throw new ApiError('NOT_FOUND');
      }

      return reply.code(204).send();
    },
  );
}

/** Loads the circle or throws the shared `404`, never revealing its existence. */
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
 * Checks `circle.update` / `circle.delete` for the loaded circle.
 *
 * The role comes from the membership row, but ownership is decided solely by
 * `Circle.ownerId` inside `can()`: a forged `role: 'owner'` cannot escalate.
 */
function assertCirclePermission(
  userId: string,
  membership: CircleMembership,
  action: 'circle.update' | 'circle.delete',
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

/** A cover must belong to the same circle; anything else is a shared 404. */
async function assertPhotoBelongsToCircle(
  prisma: PrismaClient,
  circleId: string,
  photoId: string,
): Promise<void> {
  const photo = await findCirclePhoto(prisma, circleId, photoId);

  if (photo === null) {
    throw new ApiError('NOT_FOUND');
  }
}

/**
 * Prisma errors meaning the row changed between the membership read and the
 * write: `P2025` (record not found) and `P2003` (cover deleted in parallel).
 */
const CIRCLE_WRITE_RACE_CODES: ReadonlySet<string> = new Set(['P2025', 'P2003']);

function isCircleWriteRace(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && CIRCLE_WRITE_RACE_CODES.has(error.code)
  );
}
