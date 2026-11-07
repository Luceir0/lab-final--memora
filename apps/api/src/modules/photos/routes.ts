import {
  can,
  deletePhotoResponseSchema,
  errorResponseSchema,
  photoParamsSchema,
  photoResponseSchema,
  updatePhotoRequestSchema,
  uploadPhotoParamsSchema,
  uploadPhotoResponseSchema,
  type PermissionActor,
  type PermissionCircle,
  type PermissionResource,
} from '@memora/shared';
import type { FastifyRequest } from 'fastify';

import type { AppConfig } from '../../config.ts';
import { ApiError } from '../../errors.ts';
import { SESSION_SECURITY_SCHEME } from '../../plugins/swagger.ts';
import type { MemoraServer } from '../../types.ts';
import { findAlbumForMember, type AlbumMembership } from '../albums/service.ts';
import { csrfHeaderSchema } from '../auth/csrf-header.ts';
import { assertCsrfToken, requirePrisma, setPrivateNoStore } from '../auth/guards.ts';
import { assertTrustedOrigin } from '../auth/origin.ts';
import { resolveSession } from '../auth/session.ts';
import { toCircleSettings } from '../circles/dto.ts';
import { toPhotoDto } from '../members/dto.ts';
import { deletePhoto } from './delete.ts';
import { findPhotoForMember, storePhoto } from './service.ts';
import { findPhotoUpdateTarget, updatePhoto, type PhotoUpdateTarget } from './update.ts';
import { readUploadRequest } from './upload-request.ts';

const PHOTOS_TAG = 'Photos';

const sessionSecurity = [{ [SESSION_SECURITY_SCHEME]: [] }];

/** 60 uploads per minute and user. */
export const UPLOAD_RATE_LIMIT_MAX = 60;

function assertUploadPermission(userId: string, target: AlbumMembership): void {
  const actor: PermissionActor = { id: userId, role: target.membership.role };
  const circle: PermissionCircle = {
    id: target.circle.id,
    ownerId: target.circle.ownerId,
    settings: toCircleSettings(target.circle.settings),
  };

  if (!can(actor, 'photo.upload', circle)) {
    throw new ApiError('FORBIDDEN');
  }
}

/**
 * Checks `photo.update` or `photo.delete` for the loaded photo.
 *
 * Only the author (uploader) or the circle owner may edit or delete. Ownership
 * is decided by `Circle.ownerId` inside `can()`, using the membership already
 * loaded for the request, so a forged `role: 'owner'` cannot escalate.
 */
function assertPhotoPermission(
  userId: string,
  target: PhotoUpdateTarget,
  action: 'photo.update' | 'photo.delete',
): void {
  const actor: PermissionActor = { id: userId, role: target.membership.role };
  const circle: PermissionCircle = {
    id: target.circle.id,
    ownerId: target.circle.ownerId,
    settings: toCircleSettings(target.circle.settings),
  };
  const resource: PermissionResource = {
    type: 'photo',
    circleId: target.photo.circleId,
    uploaderId: target.photo.uploaderId,
  };

  if (!can(actor, action, circle, resource)) {
    throw new ApiError('FORBIDDEN');
  }
}

/**
 * `POST /api/albums/:albumId/photos` — one multipart file per request.
 *
 * Requires membership in the album's circle (otherwise `404`, never `403`) and
 * `photo.upload` with the persisted circle settings. The rate limit is 60 per
 * minute and user, checked after `resolveSession` so the key is the user id.
 * Idempotent replays answer `200` with the existing photo.
 */
export function registerPhotoRoutes(app: MemoraServer, config: AppConfig): void {
  const trustedOrigin = async (request: FastifyRequest): Promise<void> => {
    assertTrustedOrigin(request, config);
  };

  /**
   * The user id is only known after `resolveSession`, so the limiter is called
   * manually and the resolved id travels in a `WeakMap` keyed by the request.
   */
  const rateLimitUsers = new WeakMap<FastifyRequest, string>();
  const uploadLimiter = app.createRateLimit({
    max: UPLOAD_RATE_LIMIT_MAX,
    timeWindow: '1 minute',
    keyGenerator: (request) => `upload:${rateLimitUsers.get(request) ?? request.ip}`,
  });

  const enforceUploadLimit = async (request: FastifyRequest, userId: string): Promise<void> => {
    rateLimitUsers.set(request, userId);

    const result = await uploadLimiter(request);

    // `applyRateLimit` encodes the decision in `isExceeded`.
    if (!result.isAllowed && result.isExceeded) {
      throw new ApiError('RATE_LIMITED');
    }
  };

  app.post(
    '/api/albums/:albumId/photos',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [PHOTOS_TAG],
        summary: 'Subir foto',
        description:
          'Sube un archivo JPEG, PNG o WebP a un álbum. Requiere sesión, `Origin`/`Referer` permitido, CSRF, ' +
          'pertenencia al círculo y `photo.upload`; un no miembro recibe `404` y un miembro sin permiso `403`. ' +
          'Valida magic bytes, 25 MB, 50 MP y la cuota de 2 GB del círculo. Aplica orientación EXIF, genera ' +
          '`thumb` 400×400 y `display` 1600 WebP, y guarda un original sin metadatos. El GPS solo se usa en ' +
          'memoria para `placeName`; nunca se persiste ni se registra. Idempotente por ' +
          '`(uploaderId, clientUploadId)`: la repetición devuelve `200` con la foto existente, salvo que el ' +
          'usuario ya no pertenezca al círculo de esa foto (`409 CONFLICT`). Límite: 60 por minuto y usuario.',
        security: sessionSecurity,
        consumes: ['multipart/form-data'],
        headers: csrfHeaderSchema,
        params: uploadPhotoParamsSchema,
        response: {
          200: uploadPhotoResponseSchema,
          201: uploadPhotoResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          413: errorResponseSchema,
          415: errorResponseSchema,
          422: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user, token } = await resolveSession(prisma, config, request, reply);

      assertCsrfToken(request, app, token);
      await enforceUploadLimit(request, user.id);

      const target = await findAlbumForMember(prisma, request.params.albumId, user.id);

      if (target === null) {
        throw new ApiError('NOT_FOUND');
      }

      assertUploadPermission(user.id, target);

      const { file, fields } = await readUploadRequest(request);
      const result = await storePhoto({
        prisma,
        storage: app.services.storage,
        geocoding: app.services.geocoding,
        userId: user.id,
        circleId: target.album.circleId,
        albumId: target.album.id,
        fields,
        file,
        logger: request.log,
      });

      setPrivateNoStore(reply);

      return reply.code(result.status).send(toPhotoDto(result.photo));
    },
  );

  /**
   * `GET /api/photos/:photoId` — public detail of one photo (F30).
   *
   * Requires a session and a current membership in the photo's circle. A
   * non-member, a photo from another circle and a missing photo all answer
   * `404 NOT_FOUND`, never `403`. The payload is the frozen `PhotoDto`: author,
   * date, place, dimensions, album, tags and authenticated image URLs; storage
   * keys and coordinates are never selected.
   */
  app.get(
    '/api/photos/:photoId',
    {
      schema: {
        tags: [PHOTOS_TAG],
        summary: 'Detalle de foto',
        description:
          'Devuelve el `PhotoDto` completo de una foto: autor, fecha, lugar, dimensiones, álbum, etiquetas y ' +
          'URLs `thumb`/`display`. Requiere sesión y membresía vigente en el círculo de la foto. Un no miembro, ' +
          'una foto de otro círculo y un id inexistente responden `404 NOT_FOUND`, nunca `403`. No incluye ' +
          'claves de almacenamiento ni coordenadas.',
        security: sessionSecurity,
        params: photoParamsSchema,
        response: {
          200: photoResponseSchema,
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
      const photo = await findPhotoForMember(prisma, request.params.photoId, user.id);

      if (photo === null) {
        throw new ApiError('NOT_FOUND');
      }

      setPrivateNoStore(reply);

      return toPhotoDto(photo);
    },
  );

  /**
   * `PATCH /api/photos/:photoId` — edit description, date and place (F31).
   *
   * Requires a session and a current membership in the photo's circle: a
   * non-member, a photo from another circle and a missing photo answer `404`,
   * never `403`. Only the author or the circle owner may edit; any other member
   * gets `403 FORBIDDEN`. The body is the frozen `updatePhotoRequestSchema`:
   * every field is optional, `null` clears it, an empty body is `400` and
   * unknown fields are dropped before reaching the database. Coordinates and
   * storage keys are never read from the client nor returned.
   */
  app.patch(
    '/api/photos/:photoId',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [PHOTOS_TAG],
        summary: 'Editar metadatos de foto',
        description:
          'Edita `description`, `takenAt` y `placeName` de una foto. Requiere sesión, `Origin`/`Referer` ' +
          'permitido, CSRF y membresía vigente en el círculo: un no miembro, una foto de otro círculo y un id ' +
          'inexistente responden `404 NOT_FOUND`. Solo el autor de la foto o el propietario del círculo pueden ' +
          'editar; cualquier otro miembro recibe `403 FORBIDDEN`. Los tres campos son opcionales y anulables: ' +
          '`null` limpia el valor y un cuerpo vacío es `400 VALIDATION_ERROR`. No acepta coordenadas ni claves ' +
          'de almacenamiento y responde `200` con el `PhotoDto` actualizado.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: photoParamsSchema,
        body: updatePhotoRequestSchema,
        response: {
          200: photoResponseSchema,
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

      const target = await findPhotoUpdateTarget(prisma, request.params.photoId, user.id);

      if (target === null) {
        throw new ApiError('NOT_FOUND');
      }

      assertPhotoPermission(user.id, target, 'photo.update');

      const { description, takenAt, placeName } = request.body;
      const updated = await updatePhoto(prisma, target.photo.id, {
        description,
        takenAt: takenAt === undefined ? undefined : takenAt === null ? null : new Date(takenAt),
        placeName,
      });

      setPrivateNoStore(reply);

      return toPhotoDto(updated);
    },
  );

  /**
   * `DELETE /api/photos/:photoId` — remove one photo (F31).
   *
   * Requires a session and a current membership in the photo's circle: a
   * non-member, a photo from another circle and a missing photo answer `404`,
   * never `403`. Only the author or the circle owner may delete; any other
   * member gets `403 FORBIDDEN`. The row is deleted in a transaction, so tags
   * fall by cascade and `Activity.photoId` becomes `null`; the three storage
   * objects are removed after the commit, best-effort. A storage failure logs a
   * warning and still answers `204`. Repeating the request answers `404`.
   */
  app.delete(
    '/api/photos/:photoId',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [PHOTOS_TAG],
        summary: 'Borrar foto',
        description:
          'Borra una foto y responde `204` sin cuerpo. Requiere sesión, `Origin`/`Referer` permitido, CSRF y ' +
          'membresía vigente en el círculo: un no miembro, una foto de otro círculo y un id inexistente ' +
          'responden `404 NOT_FOUND`. Solo el autor de la foto o el propietario del círculo pueden borrar; ' +
          'cualquier otro miembro recibe `403 FORBIDDEN`. La fila se elimina en una transacción: las etiquetas ' +
          'caen por cascada y la actividad histórica se conserva con `photoId = null`. Tras el commit borra ' +
          'los tres objetos (`original`, `display`, `thumb`) de forma best-effort; si storage falla, registra ' +
          'un aviso y responde `204` igualmente. Repetir el borrado → `404 NOT_FOUND`. No expone claves de ' +
          'almacenamiento ni detalles internos.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: photoParamsSchema,
        response: {
          204: deletePhotoResponseSchema,
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

      const target = await findPhotoUpdateTarget(prisma, request.params.photoId, user.id);

      if (target === null) {
        throw new ApiError('NOT_FOUND');
      }

      assertPhotoPermission(user.id, target, 'photo.delete');

      const deleted = await deletePhoto({
        prisma,
        storage: app.services.storage,
        photoId: target.photo.id,
        circleId: target.photo.circleId,
        logger: request.log,
      });

      if (!deleted) {
        throw new ApiError('NOT_FOUND');
      }

      return reply.code(204).send();
    },
  );
}
