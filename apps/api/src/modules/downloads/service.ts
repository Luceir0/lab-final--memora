import {
  MAX_DOWNLOAD_BYTES,
  MAX_DOWNLOAD_PHOTOS,
  type DownloadKind,
  type PermissionCircle,
  type Role,
} from '@memora/shared';

import { ApiError } from '../../errors.ts';
import type { DownloadJob, PrismaClient } from '../../generated/prisma/client.ts';
import type { StorageService } from '../../services/storage.ts';
import { resolveCircleRole, toCircleSettings } from '../circles/dto.ts';

/** Jobs live 24 hours (AC-03). */
export const DOWNLOAD_JOB_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Message of a job killed by a process restart (ADR-0008). It names no file,
 * user or storage key.
 */
export const ORPHANED_JOB_MESSAGE =
  'La generación del ZIP se interrumpió al reiniciar el servidor. Crea una nueva descarga.';

/** One photo needed to authorise and serve the individual download. */
export interface DownloadablePhoto {
  readonly id: string;
  readonly mimeType: string;
  readonly originalKey: string;
  readonly takenAt: Date | null;
  readonly createdAt: Date;
  readonly albumTitle: string;
  readonly albumDate: Date | null;
  readonly circle: PermissionCircle;
  readonly role: Role;
}

/** A job plus the circle data needed to decide who may read it. */
export interface DownloadJobForUser {
  readonly job: DownloadJob;
  readonly albumTitle: string | null;
  readonly albumDate: Date | null;
  readonly circle: PermissionCircle;
  readonly role: Role;
}

/** Minimal row used to enforce the 500-photo / 2 GB limits. */
export interface DownloadPhotoRow {
  readonly id: string;
  readonly size: number;
}

/**
 * Loads the photo only while the user is still a member of its circle.
 *
 * A missing photo, a photo from another circle and a circle the user left all
 * return `null`: the route answers `404` for every case.
 */
export async function findDownloadablePhoto(
  prisma: PrismaClient,
  photoId: string,
  userId: string,
): Promise<DownloadablePhoto | null> {
  const row = await prisma.photo.findFirst({
    where: {
      id: photoId,
      circle: { memberships: { some: { userId } } },
    },
    select: {
      id: true,
      mimeType: true,
      originalKey: true,
      takenAt: true,
      createdAt: true,
      album: { select: { title: true, date: true } },
      circle: {
        select: {
          id: true,
          ownerId: true,
          settings: true,
          memberships: { where: { userId }, select: { role: true }, take: 1 },
        },
      },
    },
  });

  if (row === null) {
    return null;
  }

  const membership = row.circle.memberships[0];

  if (membership === undefined) {
    return null;
  }

  return {
    id: row.id,
    mimeType: row.mimeType,
    originalKey: row.originalKey,
    takenAt: row.takenAt,
    createdAt: row.createdAt,
    albumTitle: row.album.title,
    albumDate: row.album.date,
    circle: {
      id: row.circle.id,
      ownerId: row.circle.ownerId,
      settings: toCircleSettings(row.circle.settings),
    },
    role: resolveCircleRole(row.circle, userId, membership.role),
  };
}

/**
 * Loads a job only when the user is a member of its circle.
 *
 * Authorisation (requester or circle owner) is decided by the caller, so this
 * helper never answers `404` on its own beyond the missing/foreign cases.
 */
export async function findDownloadJobForUser(
  prisma: PrismaClient,
  jobId: string,
  userId: string,
): Promise<DownloadJobForUser | null> {
  const row = await prisma.downloadJob.findFirst({
    where: {
      id: jobId,
      circle: { memberships: { some: { userId } } },
    },
    include: {
      album: { select: { title: true, date: true } },
      circle: {
        select: {
          id: true,
          ownerId: true,
          settings: true,
          memberships: { where: { userId }, select: { role: true }, take: 1 },
        },
      },
    },
  });

  if (row === null) {
    return null;
  }

  const membership = row.circle.memberships[0];

  if (membership === undefined) {
    return null;
  }

  return {
    job: row,
    albumTitle: row.album?.title ?? null,
    albumDate: row.album?.date ?? null,
    circle: {
      id: row.circle.id,
      ownerId: row.circle.ownerId,
      settings: toCircleSettings(row.circle.settings),
    },
    role: resolveCircleRole(row.circle, userId, membership.role),
  };
}

/** `GET /downloads/:jobId` is visible to the requester and the circle owner. */
export function canReadDownloadJob(
  job: Pick<DownloadJob, 'requestedBy'>,
  target: Pick<DownloadJobForUser, 'circle'>,
  userId: string,
): boolean {
  return job.requestedBy === userId || target.circle.ownerId === userId;
}

/**
 * Limits of a single job (AC-02).
 *
 * Too many photos is `422 UNPROCESSABLE_ENTITY`: the request is well formed,
 * but a ZIP that large is not produced synchronously. Exceeding 2 GB is
 * `413 FILE_TOO_LARGE`, the same code the upload pipeline uses for a payload
 * that is too big. Both carry a clear Spanish message.
 */
export function assertDownloadLimits(photosCount: number, bytes: number): void {
  if (photosCount > MAX_DOWNLOAD_PHOTOS) {
    throw new ApiError('UNPROCESSABLE_ENTITY', {
      message: `No se pueden descargar más de ${MAX_DOWNLOAD_PHOTOS} fotos de una vez. Selecciona menos fotos.`,
    });
  }

  if (bytes > MAX_DOWNLOAD_BYTES) {
    throw new ApiError('FILE_TOO_LARGE', {
      message: 'La descarga supera el límite de 2 GB. Selecciona menos fotos.',
    });
  }
}

/** Every photo of an album, in stable creation order. */
export async function listAlbumDownloadPhotos(
  prisma: PrismaClient,
  albumId: string,
  circleId: string,
): Promise<DownloadPhotoRow[]> {
  return prisma.photo.findMany({
    where: { albumId, circleId },
    select: { id: true, size: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });
}

/**
 * The requested photos that really belong to the album and circle.
 *
 * The caller compares lengths: a shorter result means at least one id was
 * foreign, and the route answers `404` without saying which one.
 */
export async function findSelectedDownloadPhotos(
  prisma: PrismaClient,
  albumId: string,
  circleId: string,
  photoIds: readonly string[],
): Promise<DownloadPhotoRow[]> {
  return prisma.photo.findMany({
    where: { id: { in: [...photoIds] }, albumId, circleId },
    select: { id: true, size: true },
  });
}

export interface NewDownloadJobInput {
  readonly circleId: string;
  readonly albumId: string;
  readonly requestedBy: string;
  readonly kind: DownloadKind;
  /** Snapshot of the photos so the worker processes exactly what was checked. */
  readonly photoIds: readonly string[];
  readonly expiresAt: Date;
}

export async function createDownloadJob(
  prisma: PrismaClient,
  input: NewDownloadJobInput,
): Promise<DownloadJob> {
  return prisma.downloadJob.create({
    data: {
      circleId: input.circleId,
      albumId: input.albumId,
      requestedBy: input.requestedBy,
      kind: input.kind,
      photoIds: [...input.photoIds],
      status: 'pending',
      expiresAt: input.expiresAt,
    },
  });
}

/**
 * Marks the jobs a previous process left in `processing` as `error`.
 *
 * ADR-0008: the in-process worker does not survive a restart, so those jobs
 * can never finish. Runs lazily on the first job request, never on boot, so a
 * health-only process does not need a database.
 */
export async function markOrphanedJobs(prisma: PrismaClient): Promise<number> {
  const result = await prisma.downloadJob.updateMany({
    where: { status: 'processing' },
    data: { status: 'error', errorMessage: ORPHANED_JOB_MESSAGE },
  });

  return result.count;
}

/**
 * Marks every job past `expiresAt` as `expired` and deletes its ZIP.
 *
 * The object deletion is best-effort: a storage failure cannot keep the job
 * alive past its deadline. A job the worker is still processing is expired
 * too; the worker's guarded final update then skips the resurrection and
 * removes the ZIP it has just written.
 */
export async function expireDueJobs(
  prisma: PrismaClient,
  storage: StorageService,
  now: Date = new Date(),
): Promise<number> {
  const due = await prisma.downloadJob.findMany({
    where: {
      expiresAt: { lte: now },
      status: { not: 'expired' },
    },
    select: { id: true, objectKey: true },
    orderBy: { expiresAt: 'asc' },
    take: 100,
  });

  for (const job of due) {
    if (job.objectKey !== null) {
      try {
        await storage.delete(job.objectKey);
      } catch {
        // Best effort: the row is expired regardless of storage.
      }
    }

    await prisma.downloadJob.updateMany({
      where: { id: job.id, status: { not: 'expired' } },
      data: { status: 'expired' },
    });
  }

  return due.length;
}

/** Expires one job on demand when a read finds it past its deadline. */
export async function expireJob(
  prisma: PrismaClient,
  storage: StorageService,
  jobId: string,
): Promise<void> {
  const job = await prisma.downloadJob.findUnique({
    where: { id: jobId },
    select: { objectKey: true },
  });

  if (job !== null && job.objectKey !== null) {
    try {
      await storage.delete(job.objectKey);
    } catch {
      // Best effort, same as the sweep.
    }
  }

  await prisma.downloadJob.updateMany({
    where: { id: jobId, status: { not: 'expired' } },
    data: { status: 'expired' },
  });
}
