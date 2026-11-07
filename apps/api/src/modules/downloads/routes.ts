import {
  can,
  createDownloadParamsSchema,
  createDownloadRequestSchema,
  createDownloadResponseSchema,
  downloadJobParamsSchema,
  downloadJobResponseSchema,
  downloadPhotoParamsSchema,
  errorResponseSchema,
  imageMimeTypeSchema,
  type DownloadKind,
  type PermissionActor,
  type PermissionCircle,
} from '@memora/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type { AppConfig } from '../../config.ts';
import { ApiError } from '../../errors.ts';
import { SESSION_SECURITY_SCHEME } from '../../plugins/swagger.ts';
import type { StoredObject } from '../../services/index.ts';
import type { MemoraServer } from '../../types.ts';
import { findAlbumForMember, type AlbumMembership } from '../albums/service.ts';
import { csrfHeaderSchema } from '../auth/csrf-header.ts';
import { assertCsrfToken, requirePrisma, setPrivateNoStore } from '../auth/guards.ts';
import { assertTrustedOrigin } from '../auth/origin.ts';
import { resolveSession } from '../auth/session.ts';
import { toCircleSettings } from '../circles/dto.ts';
import {
  attachmentDisposition,
  buildArchiveDownloadFilename,
  buildPhotoDownloadFilename,
} from './filename.ts';
import { deriveProgress, toDownloadJobDto } from './dto.ts';
import {
  assertDownloadLimits,
  canReadDownloadJob,
  createDownloadJob,
  DOWNLOAD_JOB_TTL_MS,
  expireDueJobs,
  expireJob,
  findDownloadablePhoto,
  findDownloadJobForUser,
  findSelectedDownloadPhotos,
  listAlbumDownloadPhotos,
  markOrphanedJobs,
  type DownloadPhotoRow,
} from './service.ts';
import {
  createDownloadProgressRegistry,
  createDownloadWorker,
  type DownloadProgressRegistry,
} from './worker.ts';

const DOWNLOADS_TAG = 'Downloads';

const sessionSecurity = [{ [SESSION_SECURITY_SCHEME]: [] }];

/** 10 job creations per minute and user (contract `downloads.md`). */
export const DOWNLOAD_RATE_LIMIT_MAX = 10;

const FALLBACK_CONTENT_TYPE = 'application/octet-stream';

/**
 * Progress lives in memory next to the worker that produces it. The registry is
 * exposed only to the owning Fastify instance so tests can observe a
 * `processing` job without persisting a derived value.
 */
const progressRegistries = new WeakMap<MemoraServer, DownloadProgressRegistry>();

export function downloadProgressRegistryFor(app: MemoraServer): DownloadProgressRegistry | null {
  return progressRegistries.get(app) ?? null;
}

function assertDownloadPermission(userId: string, target: AlbumMembership): void {
  const actor: PermissionActor = { id: userId, role: target.membership.role };
  const circle: PermissionCircle = {
    id: target.circle.id,
    ownerId: target.circle.ownerId,
    settings: toCircleSettings(target.circle.settings),
  };

  if (!can(actor, 'photo.download', circle)) {
    throw new ApiError('FORBIDDEN');
  }
}

function sumSizes(rows: readonly DownloadPhotoRow[]): number {
  return rows.reduce((total, row) => total + row.size, 0);
}

function resolvePhotoContentType(mimeType: string): string {
  const parsed = imageMimeTypeSchema.safeParse(mimeType);

  return parsed.success ? parsed.data : FALLBACK_CONTENT_TYPE;
}

/**
 * `GET /api/photos/:photoId/download` (F33, AC-01/AC-07).
 *
 * Serves the original as an attachment. Requires a session, a current
 * membership (`404` otherwise) and `photo.download`, which honours the
 * persisted `membersCanDownload` (`403` when disabled). A missing object is
 * `404`; a storage failure is `500` and never logs the object key.
 */
export function registerDownloadRoutes(app: MemoraServer, config: AppConfig): void {
  const progress = createDownloadProgressRegistry();
  progressRegistries.set(app, progress);

  const worker = createDownloadWorker({
    getPrisma: () => requirePrisma(app),
    storage: app.services.storage,
    progress,
    logger: app.log,
  });

  const trustedOrigin = async (request: FastifyRequest): Promise<void> => {
    assertTrustedOrigin(request, config);
  };

  /**
   * ADR-0008: jobs left in `processing` by a previous process are dead. The
   * recovery is lazy (first job request) so a health-only boot never needs a
   * database. It runs once per app instance and a failure never masks the real
   * request, which will fail on its own query if the database is down.
   */
  let orphanRecovery: Promise<void> | null = null;

  const ensureOrphanRecovery = async (): Promise<void> => {
    orphanRecovery ??= markOrphanedJobs(requirePrisma(app))
      .then(() => undefined)
      .catch(() => {
        app.log.warn(
          { code: 'DOWNLOAD_ORPHAN_RECOVERY_FAILED' },
          'Orphan download recovery failed',
        );
      });

    await orphanRecovery;
  };

  /** Best-effort sweep of expired jobs, on create and on every read. */
  const sweepExpiredJobs = async (): Promise<void> => {
    try {
      await expireDueJobs(requirePrisma(app), app.services.storage);
    } catch {
      app.log.warn({ code: 'DOWNLOAD_EXPIRY_SWEEP_FAILED' }, 'Download expiry sweep failed');
    }
  };

  const rateLimitUsers = new WeakMap<FastifyRequest, string>();
  const downloadLimiter = app.createRateLimit({
    max: DOWNLOAD_RATE_LIMIT_MAX,
    timeWindow: '1 minute',
    keyGenerator: (request) => `downloads:${rateLimitUsers.get(request) ?? request.ip}`,
  });

  const enforceDownloadLimit = async (request: FastifyRequest, userId: string): Promise<void> => {
    rateLimitUsers.set(request, userId);

    const result = await downloadLimiter(request);

    if (!result.isAllowed && result.isExceeded) {
      throw new ApiError('RATE_LIMITED');
    }
  };

  app.get(
    '/api/photos/:photoId/download',
    {
      schema: {
        tags: [DOWNLOADS_TAG],
        summary: 'Descargar foto original',
        description:
          'Entrega el original de la foto como adjunto. Requiere sesión, membresía vigente en el círculo y ' +
          '`photo.download`: un no miembro o una foto de otro círculo responden `404`, un miembro con ' +
          '`membersCanDownload` desactivado recibe `403`. Cabeceras: `Content-Disposition: attachment` con nombre ' +
          'seguro `memora-{album}-{fecha}-{id}.{ext}`, `Content-Type` real, `Content-Length`, ' +
          '`X-Content-Type-Options: nosniff` y `Cache-Control: private, no-store`. Un objeto ausente en storage ' +
          'es `404`; un fallo de storage es `500` sin filtrar claves.',
        security: sessionSecurity,
        params: downloadPhotoParamsSchema,
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          429: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user } = await resolveSession(prisma, config, request, reply);
      const photo = await findDownloadablePhoto(prisma, request.params.photoId, user.id);

      if (photo === null) {
        throw new ApiError('NOT_FOUND');
      }

      const actor: PermissionActor = { id: user.id, role: photo.role };

      if (!can(actor, 'photo.download', photo.circle)) {
        throw new ApiError('FORBIDDEN');
      }

      let object: StoredObject | null;

      try {
        object = await app.services.storage.get(photo.originalKey);
      } catch {
        request.log.error({ code: 'DOWNLOAD_STORAGE_READ_FAILED' }, 'Download storage read failed');
        throw new ApiError('INTERNAL_ERROR');
      }

      if (object === null) {
        throw new ApiError('NOT_FOUND');
      }

      const filename = buildPhotoDownloadFilename({
        albumTitle: photo.albumTitle,
        date: photo.takenAt ?? photo.albumDate ?? photo.createdAt,
        photoId: photo.id,
        mimeType: photo.mimeType,
      });

      // The declared response map documents only the JSON errors; the success
      // body is a raw Buffer that must bypass the JSON serializer.
      const binaryReply = reply as FastifyReply;

      setPrivateNoStore(binaryReply);

      binaryReply
        .header('x-content-type-options', 'nosniff')
        .header('content-disposition', attachmentDisposition(filename))
        .header('content-type', resolvePhotoContentType(photo.mimeType))
        .header('content-length', object.body.byteLength);

      return binaryReply.code(200).send(object.body);
    },
  );

  app.post(
    '/api/albums/:albumId/downloads',
    {
      preValidation: trustedOrigin,
      schema: {
        tags: [DOWNLOADS_TAG],
        summary: 'Crear descarga de álbum',
        description:
          'Crea un job ZIP del álbum completo o de una selección de fotos. Requiere sesión, CSRF, ' +
          '`Origin`/`Referer` permitido, membresía (`404` para un álbum ajeno) y `photo.download` (`403` si el ' +
          'círculo desactiva `membersCanDownload`). Sin `photoIds` descarga el álbum; con `photoIds` todas las ' +
          'fotos deben pertenecer al álbum y círculo, sin duplicados (`404` si alguna no lo es). Límites: 500 ' +
          'fotos (`422 UNPROCESSABLE_ENTITY`) y 2 GB sumando `Photo.size` (`413 FILE_TOO_LARGE`). Responde `202` ' +
          'con el `DownloadJobDto`; el ZIP se genera en un worker en proceso con concurrencia 1. Límite: 10 por ' +
          'minuto y usuario.',
        security: sessionSecurity,
        headers: csrfHeaderSchema,
        params: createDownloadParamsSchema,
        body: createDownloadRequestSchema,
        response: {
          202: createDownloadResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          413: errorResponseSchema,
          422: errorResponseSchema,
          429: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user, token } = await resolveSession(prisma, config, request, reply);

      assertCsrfToken(request, app, token);
      await enforceDownloadLimit(request, user.id);

      const target = await findAlbumForMember(prisma, request.params.albumId, user.id);

      if (target === null) {
        throw new ApiError('NOT_FOUND');
      }

      assertDownloadPermission(user.id, target);

      const selection = request.body.photoIds;
      let kind: DownloadKind;
      let photoIds: string[];
      let photos: DownloadPhotoRow[];

      if (selection === undefined) {
        kind = 'album';
        photos = await listAlbumDownloadPhotos(prisma, target.album.id, target.album.circleId);
        photoIds = photos.map((photo) => photo.id);
      } else {
        kind = 'selection';
        const unique = [...new Set(selection)];

        if (unique.length !== selection.length) {
          throw new ApiError('VALIDATION_ERROR', {
            message: 'No se pueden repetir fotos en la selección.',
          });
        }

        photos = await findSelectedDownloadPhotos(
          prisma,
          target.album.id,
          target.album.circleId,
          unique,
        );

        // One foreign, deleted or other-circle id makes the whole selection
        // invisible; the response never says which one.
        if (photos.length !== unique.length) {
          throw new ApiError('NOT_FOUND');
        }

        photoIds = unique;
      }

      assertDownloadLimits(photoIds.length, sumSizes(photos));

      await ensureOrphanRecovery();
      await sweepExpiredJobs();

      const job = await createDownloadJob(prisma, {
        circleId: target.album.circleId,
        albumId: target.album.id,
        requestedBy: user.id,
        kind,
        photoIds,
        expiresAt: new Date(Date.now() + DOWNLOAD_JOB_TTL_MS),
      });

      worker.enqueue(job.id);

      setPrivateNoStore(reply);

      return reply.code(202).send(toDownloadJobDto(job, null));
    },
  );

  app.get(
    '/api/downloads/:jobId',
    {
      schema: {
        tags: [DOWNLOADS_TAG],
        summary: 'Estado de descarga',
        description:
          'Devuelve el `DownloadJobDto` al solicitante o a un owner del círculo; cualquier otro miembro recibe ' +
          '`404`. `progress` es derivado y no persistido: un entero 0–100 solo en `processing` y `null` en el ' +
          'resto de estados. Si `expiresAt` ya pasó, el job se marca `expired`, se borra su objeto y se responde ' +
          'con ese estado. No expone `objectKey`.',
        security: sessionSecurity,
        params: downloadJobParamsSchema,
        response: {
          200: downloadJobResponseSchema,
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

      await ensureOrphanRecovery();
      await sweepExpiredJobs();

      const target = await findDownloadJobForUser(prisma, request.params.jobId, user.id);

      if (target === null || !canReadDownloadJob(target.job, target, user.id)) {
        throw new ApiError('NOT_FOUND');
      }

      let job = target.job;

      if (job.expiresAt.getTime() <= Date.now()) {
        await expireJob(prisma, app.services.storage, job.id);
        job = { ...job, status: 'expired' };
      }

      setPrivateNoStore(reply);

      return toDownloadJobDto(job, deriveProgress(job.status, progress.get(job.id)));
    },
  );

  app.get(
    '/api/downloads/:jobId/file',
    {
      schema: {
        tags: [DOWNLOADS_TAG],
        summary: 'Descargar ZIP',
        description:
          'Entrega el ZIP de un job `ready` y no expirado como adjunto ' +
          '`memora-{album}-{fecha}.zip`, con `application/zip` y `Cache-Control: private, no-store`. Solo el ' +
          'solicitante o un owner del círculo; el resto recibe `404`. Si el job no está `ready` responde ' +
          '`409 CONFLICT`; si ya expiró, `404`. Nunca expone `objectKey`.',
        security: sessionSecurity,
        params: downloadJobParamsSchema,
        response: {
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          429: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const prisma = requirePrisma(app);
      const { user } = await resolveSession(prisma, config, request, reply);

      await ensureOrphanRecovery();
      await sweepExpiredJobs();

      const target = await findDownloadJobForUser(prisma, request.params.jobId, user.id);

      if (target === null || !canReadDownloadJob(target.job, target, user.id)) {
        throw new ApiError('NOT_FOUND');
      }

      if (target.job.expiresAt.getTime() <= Date.now()) {
        await expireJob(prisma, app.services.storage, target.job.id);
        throw new ApiError('NOT_FOUND');
      }

      if (target.job.status !== 'ready') {
        throw new ApiError('CONFLICT');
      }

      if (target.job.objectKey === null) {
        throw new ApiError('NOT_FOUND');
      }

      let object: StoredObject | null;

      try {
        object = await app.services.storage.get(target.job.objectKey);
      } catch {
        request.log.error({ code: 'DOWNLOAD_STORAGE_READ_FAILED' }, 'Download storage read failed');
        throw new ApiError('INTERNAL_ERROR');
      }

      if (object === null) {
        throw new ApiError('NOT_FOUND');
      }

      const filename = buildArchiveDownloadFilename(target.albumTitle ?? 'Album', target.albumDate);

      const binaryReply = reply as FastifyReply;

      setPrivateNoStore(binaryReply);

      binaryReply
        .header('x-content-type-options', 'nosniff')
        .header('content-disposition', attachmentDisposition(filename))
        .header('content-type', 'application/zip')
        .header('content-length', object.body.byteLength);

      return binaryReply.code(200).send(object.body);
    },
  );
}
