import {
  can,
  errorResponseSchema,
  photoParamsSchema,
  photoResponseSchema,
  uploadPhotoParamsSchema,
  uploadPhotoResponseSchema,
  type PermissionActor,
  type PermissionCircle,
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
import { findPhotoForMember, storePhoto } from './service.ts';
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
}
