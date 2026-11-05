import {
  albumParamsSchema,
  albumResponseSchema,
  can,
  circleAlbumsParamsSchema,
  createAlbumRequestSchema,
  deleteAlbumResponseSchema,
  emptyAlbumResponseSchema,
  errorResponseSchema,
  listAlbumsQuerySchema,
  listAlbumsResponseSchema,
  updateAlbumRequestSchema,
  type PermissionActor,
  type PermissionCircle,
  type PermissionResource,
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
import { deleteObjects, photoObjectKeys } from '../photos/objects.ts';
import { decodeAlbumCursor } from './cursor.ts';
import { toAlbumDto, type AlbumWithRelations } from './dto.ts';
import {
  createAlbumWithActivity,
  deleteAlbumIfEmpty,
  emptyAlbum,
  findAlbumForMember,
  findAlbumPhoto,
  isAlbumWriteRace,
  listAlbumsPage,
  updateAlbum,
  type AlbumMembership,
  type AlbumUpdateInput,
} from './service.ts';

const ALBUMS_TAG = 'Albums';

const sessionSecurity = [{ [SESSION_SECURITY_SCHEME]: [] }];

/**
 * Albums CRUD plus the two delete operations.
 *
 * Visibility rule: every route requires a membership row in the circle that
 * owns the album, so a stranger always gets `404 NOT_FOUND` (never `403`, which
 * would confirm that the album exists). Permission is decided by `can()` using
 * the persisted `Circle.ownerId`, never by the membership `role` alone.
 */
export function registerAlbumRoutes(app: MemoraServer, config: AppConfig): void {
  const trustedOrigin = async (request: FastifyRequest): Promise<void> => {
    assertTrustedOrigin(request, config);
  };

  app.get(
    '/api/circles/:circleId/albums',
    {
      schema: {
        tags: [ALBUMS_TAG],
        summary: 'Listar álbumes',
        description:
          'Álbumes del círculo, solo para miembros. Orden `createdAt` descendente con desempate por `id`; ' +
          'paginación keyset opaca con `?cursor=` y `limit` (1–100, defecto 24). Un cursor inválido devuelve ' +
          '`400 VALIDATION_ERROR` con el detalle del campo `cursor`. Cada álbum incluye `coverPhoto`, ' +
          '`photosCount` y `createdBy`, sin claves de almacenamiento ni coordenadas.',
        security: sessionSecurity,
        params: circleAlbumsParamsSchema,
        querystring: listAlbumsQuerySchema,
        response: {
          200: listAlbumsResponseSchema,
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
      const page = await listAlbumsPage(prisma, membership.circle.id, {
        cursor: cursor === undefined ? null : decodeAlbumCursor(cursor),
        limit,
      });

      setPrivateNoStore(reply);

      return page;
    },
  );

  app.post(
    '/api/circles/:circleId/albums',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [ALBUMS_TAG],
        summary: 'Crear álbum',
        description:
          'Crea el álbum y, en la misma transacción, la actividad `album.created` con actor, círculo, álbum y ' +
          '`metadata: { albumTitle }`. Requiere pertenencia al círculo y `album.create`: el propietario o un ' +
          'miembro con `membersCanCreateAlbums`; un miembro sin permiso recibe `403 FORBIDDEN` y un extraño ' +
          '`404 NOT_FOUND`. No acepta portada: se edita con `PATCH`. Responde `201` con el `AlbumDto`.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: circleAlbumsParamsSchema,
        body: createAlbumRequestSchema,
        response: {
          201: albumResponseSchema,
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

      assertAlbumCreatePermission(user.id, membership);

      const { title, description, date } = request.body;
      const album = await createAlbumWithActivity(prisma, {
        circleId: membership.circle.id,
        createdById: user.id,
        title,
        description: description ?? null,
        date: date === undefined || date === null ? null : new Date(date),
      });

      return reply.code(201).send(toAlbumDto(album));
    },
  );

  app.get(
    '/api/albums/:albumId',
    {
      schema: {
        tags: [ALBUMS_TAG],
        summary: 'Detalle de álbum',
        description:
          'Detalle de un álbum con portada, número de fotos y creador. Solo para miembros del círculo; un ' +
          'usuario sin membresía (o el álbum de otro círculo) recibe `404 NOT_FOUND`. No expone claves de ' +
          'almacenamiento ni coordenadas.',
        security: sessionSecurity,
        params: albumParamsSchema,
        response: {
          200: albumResponseSchema,
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
      const target = await requireAlbumMembership(prisma, user.id, request.params.albumId);

      setPrivateNoStore(reply);

      return toAlbumDto(target.album);
    },
  );

  app.patch(
    '/api/albums/:albumId',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [ALBUMS_TAG],
        summary: 'Editar álbum',
        description:
          'Edita título, descripción, fecha y portada. Requiere pertenencia y editar: el propietario, o el ' +
          'creador del álbum mientras `membersCanCreateAlbums` siga activo. Un miembro sin permiso recibe ' +
          '`403 FORBIDDEN` y un extraño `404 NOT_FOUND`. `coverPhotoId` debe ser una foto **del mismo álbum**; ' +
          'si no existe, es de otro álbum o de otro círculo → `404 NOT_FOUND`. `null` limpia la portada.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: albumParamsSchema,
        body: updateAlbumRequestSchema,
        response: {
          200: albumResponseSchema,
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

      const target = await requireAlbumMembership(prisma, user.id, request.params.albumId);

      assertAlbumPermission(user.id, target, 'album.update');

      const { title, description, date, coverPhotoId } = request.body;

      if (coverPhotoId !== undefined && coverPhotoId !== null) {
        await assertPhotoBelongsToAlbum(
          prisma,
          target.album.id,
          target.album.circleId,
          coverPhotoId,
        );
      }

      const update: AlbumUpdateInput = {
        title,
        description,
        date: date === undefined ? undefined : date === null ? null : new Date(date),
        coverPhotoId,
      };

      let updated: AlbumWithRelations;

      try {
        updated = await updateAlbum(prisma, target.album.id, update);
      } catch (error) {
        // The album (or the cover photo) disappeared between the read and the
        // write: same outcome as a missing album, never a 500.
        if (isAlbumWriteRace(error)) {
          throw new ApiError('NOT_FOUND');
        }

        throw error;
      }

      return toAlbumDto(updated);
    },
  );

  app.delete(
    '/api/albums/:albumId',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [ALBUMS_TAG],
        summary: 'Borrar álbum',
        description:
          'Borra un álbum vacío. Lo permite el propietario o el miembro que creó el álbum, sin depender de ' +
          '`membersCanCreateAlbums`, y solo si no tiene fotos: con fotos responde `409 ALBUM_NOT_EMPTY` y un ' +
          'miembro que no lo creó `403 FORBIDDEN`. La transacción bloquea la fila del álbum con ' +
          '`SELECT … FOR UPDATE`, así que una foto concurrente espera al bloqueo y, al confirmarse, el recuento ' +
          'devuelve `409` en lugar de perderse por la cascada. Responde `204`; un álbum ya inexistente → ' +
          '`404 NOT_FOUND`.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: albumParamsSchema,
        response: {
          204: deleteAlbumResponseSchema,
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

      const target = await requireAlbumMembership(prisma, user.id, request.params.albumId);

      assertAlbumDeletePermission(user.id, target);

      const outcome = await deleteAlbumIfEmpty(prisma, target.album.id, target.album.circleId);

      if (outcome === 'missing') {
        throw new ApiError('NOT_FOUND');
      }

      if (outcome === 'not_empty') {
        throw new ApiError('ALBUM_NOT_EMPTY');
      }

      return reply.code(204).send();
    },
  );

  app.delete(
    '/api/albums/:albumId/photos',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [ALBUMS_TAG],
        summary: 'Vaciar álbum',
        description:
          'Elimina todas las fotos del álbum y sus etiquetas en una transacción y responde ' +
          '`200 { deletedCount }`. Lo permite el propietario o el miembro que creó el álbum, sin depender de ' +
          '`membersCanCreateAlbums`; un miembro que no lo creó recibe `403 FORBIDDEN` y un extraño ' +
          '`404 NOT_FOUND`. Es idempotente: un álbum vacío devuelve `{ deletedCount: 0 }`. Los eventos de ' +
          'actividad se conservan con `photoId = null`. Tras el commit borra los tres objetos de cada foto de ' +
          'forma best-effort: si storage falla, registra un aviso y responde `200` igualmente.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: albumParamsSchema,
        response: {
          200: emptyAlbumResponseSchema,
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

      const target = await requireAlbumMembership(prisma, user.id, request.params.albumId);

      assertAlbumPermission(user.id, target, 'album.empty');

      const emptied = await emptyAlbum(prisma, target.album.id, target.album.circleId);

      if (emptied === null) {
        throw new ApiError('NOT_FOUND');
      }

      const keys = emptied.objects.flatMap(photoObjectKeys);
      const cleanup = await deleteObjects(app.services.storage, keys);

      if (cleanup.failures > 0) {
        request.log.warn(
          { code: 'STORAGE_CLEANUP_FAILED', failed: cleanup.failures, total: cleanup.total },
          'No se pudieron borrar todos los objetos del álbum vaciado',
        );
      }

      return { deletedCount: emptied.deletedCount };
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

/** Loads the album for a member or throws the shared `404`. */
async function requireAlbumMembership(
  prisma: PrismaClient,
  userId: string,
  albumId: string,
): Promise<AlbumMembership> {
  const membership = await findAlbumForMember(prisma, albumId, userId);

  if (membership === null) {
    throw new ApiError('NOT_FOUND');
  }

  return membership;
}

/** Facts `can()` needs about an album; never trusts client input. */
function albumResource(target: AlbumMembership): PermissionResource {
  return {
    type: 'album',
    circleId: target.album.circleId,
    createdById: target.album.createdBy,
    photosCount: target.album._count.photos,
  };
}

/**
 * Checks `album.create` for the loaded circle.
 *
 * The owner is never limited by the flag; a member needs
 * `membersCanCreateAlbums`.
 */
function assertAlbumCreatePermission(userId: string, membership: CircleMembership): void {
  const actor: PermissionActor = { id: userId, role: membership.membership.role };
  const circle: PermissionCircle = {
    id: membership.circle.id,
    ownerId: membership.circle.ownerId,
    settings: toCircleSettings(membership.circle.settings),
  };

  if (!can(actor, 'album.create', circle)) {
    throw new ApiError('FORBIDDEN');
  }
}

/**
 * Checks a permission for the loaded album.
 *
 * Ownership is decided solely by `Circle.ownerId` inside `can()`: a forged
 * `role: 'owner'` in the membership row cannot escalate. `album.empty` and
 * `album.update` also accept the album creator; only `album.update` is gated by
 * `membersCanCreateAlbums`.
 */
function assertAlbumPermission(
  userId: string,
  target: AlbumMembership,
  action: 'album.update' | 'album.empty',
): void {
  const actor: PermissionActor = { id: userId, role: target.membership.role };
  const circle: PermissionCircle = {
    id: target.circle.id,
    ownerId: target.circle.ownerId,
    settings: toCircleSettings(target.circle.settings),
  };

  if (!can(actor, action, circle, albumResource(target))) {
    throw new ApiError('FORBIDDEN');
  }
}

/**
 * Delete is allowed for the owner or the album creator; emptiness is decided
 * later, inside the locked transaction.
 *
 * `can()` is the single source of the permission. It receives an empty-album
 * snapshot (`photosCount: 0`) on purpose: that makes it answer the ownership
 * question only, so a member who did not create the album always gets
 * `403 FORBIDDEN` regardless of the current photo count. The creator of a
 * non-empty album passes this check and then the service answers
 * `409 ALBUM_NOT_EMPTY`, never `403`.
 */
function assertAlbumDeletePermission(userId: string, target: AlbumMembership): void {
  const actor: PermissionActor = { id: userId, role: target.membership.role };
  const circle: PermissionCircle = {
    id: target.circle.id,
    ownerId: target.circle.ownerId,
    settings: toCircleSettings(target.circle.settings),
  };
  const resource: PermissionResource = {
    type: 'album',
    circleId: target.album.circleId,
    createdById: target.album.createdBy,
    photosCount: 0,
  };

  if (!can(actor, 'album.delete', circle, resource)) {
    throw new ApiError('FORBIDDEN');
  }
}

/** A cover must belong to the same album (and circle); anything else is 404. */
async function assertPhotoBelongsToAlbum(
  prisma: PrismaClient,
  albumId: string,
  circleId: string,
  photoId: string,
): Promise<void> {
  const photo = await findAlbumPhoto(prisma, albumId, circleId, photoId);

  if (photo === null) {
    throw new ApiError('NOT_FOUND');
  }
}
