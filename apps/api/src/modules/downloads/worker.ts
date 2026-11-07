import { MAX_DOWNLOAD_BYTES } from '@memora/shared';
import { ZipArchive } from 'archiver';
import type { FastifyBaseLogger } from 'fastify';

import type { PrismaClient } from '../../generated/prisma/client.ts';
import type { StorageService } from '../../services/storage.ts';
import { buildArchiveEntryName, formatFileDate } from './filename.ts';

/**
 * In-process ZIP worker (ADR-0008).
 *
 * Concurrency is exactly one: a second job waits in memory until the first
 * finishes, so the process never runs two `archiver` pipelines at once. The
 * queue is intentionally not persisted; a restart marks the leftover
 * `processing` rows as `error` (see `service.markOrphanedJobs`).
 *
 * `StorageService.put` only accepts a `Buffer`, so the ZIP is assembled in
 * memory with a hard 2 GB ceiling. That is an MVP limitation recorded in the
 * handoff: a streaming upload to the bucket is the production replacement.
 */

export const ZIP_CONTENT_TYPE = 'application/zip';
export const ZIP_README_NAME = 'README.txt';
export const ZIP_OBJECT_PREFIX = 'downloads';

const MAX_PROGRESS_WHILE_PROCESSING = 99;
const GENERIC_ERROR_MESSAGE = 'No se pudo generar el ZIP. Inténtalo de nuevo.';
const MISSING_SOURCE_MESSAGE = 'No se pudo leer una de las fotos del álbum.';
const ZIP_TOO_LARGE_MESSAGE = 'El ZIP supera el límite de 2 GB. Selecciona menos fotos.';

/** A failure whose message is safe to persist and expose in the job DTO. */
class DownloadJobFailure extends Error {
  constructor(readonly userMessage: string) {
    super(userMessage);
    this.name = 'DownloadJobFailure';
  }
}

/** Derived progress reported by the worker; never written to the database. */
export interface DownloadProgressRegistry {
  set(jobId: string, value: number): void;
  get(jobId: string): number | undefined;
  delete(jobId: string): void;
}

export function createDownloadProgressRegistry(): DownloadProgressRegistry {
  const values = new Map<string, number>();

  return {
    set: (jobId, value) => {
      values.set(jobId, value);
    },
    get: (jobId) => values.get(jobId),
    delete: (jobId) => {
      values.delete(jobId);
    },
  };
}

interface DownloadWorkerOptions {
  /** Resolved on demand: a health-only process never enqueues a job. */
  readonly getPrisma: () => PrismaClient;
  readonly storage: StorageService;
  readonly progress: DownloadProgressRegistry;
  readonly logger: FastifyBaseLogger;
}

export interface DownloadWorker {
  /** Queues a job and returns immediately; never blocks the HTTP response. */
  enqueue(jobId: string): void;
}

interface DownloadSourcePhoto {
  readonly id: string;
  readonly size: number;
  readonly originalKey: string;
  readonly mimeType: string;
}

function readPhotoIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function buildReadme(albumTitle: string, albumDate: Date | null, photosCount: number): string {
  return [
    'Memora',
    '',
    `Álbum: ${albumTitle}`,
    `Fecha: ${formatFileDate(albumDate)}`,
    `Fotos: ${photosCount}`,
    '',
  ].join('\n');
}

function toProgressPercent(processedBytes: number, totalBytes: number): number {
  if (totalBytes <= 0) {
    return 0;
  }

  const percent = Math.round((processedBytes / totalBytes) * 100);

  return Math.max(0, Math.min(MAX_PROGRESS_WHILE_PROCESSING, percent));
}

interface BuildZipInput {
  readonly photos: readonly DownloadSourcePhoto[];
  readonly albumTitle: string;
  readonly albumDate: Date | null;
  readonly storage: StorageService;
  readonly onProgress: (percent: number) => void;
}

/**
 * Builds the ZIP in memory, aborting as soon as the produced bytes exceed the
 * hard 2 GB ceiling. The total is the sum of the persisted `Photo.size`, so
 * `progress` reflects the source bytes that have been appended.
 */
async function buildZip(input: BuildZipInput): Promise<Buffer> {
  const archive = new ZipArchive({ zlib: { level: 6 } });
  const chunks: Buffer[] = [];
  let zipBytes = 0;
  let failure: DownloadJobFailure | null = null;
  let resolveFinished!: (zip: Buffer) => void;
  let rejectFinished!: (error: Error) => void;

  const finished = new Promise<Buffer>((resolve, reject) => {
    resolveFinished = resolve;
    rejectFinished = reject;
  });

  // The ZIP can be aborted from a stream event before the async caller awaits
  // `finished`; attach a no-op handler so Node never reports it as unhandled.
  void finished.catch(() => undefined);

  const abortWith = (error: DownloadJobFailure): void => {
    if (failure !== null) {
      return;
    }

    failure = error;
    archive.abort();
    rejectFinished(error);
  };

  archive.on('data', (chunk: Buffer) => {
    if (failure !== null) {
      return;
    }

    zipBytes += chunk.byteLength;

    if (zipBytes > MAX_DOWNLOAD_BYTES) {
      abortWith(new DownloadJobFailure(ZIP_TOO_LARGE_MESSAGE));
      return;
    }

    chunks.push(chunk);
  });

  archive.on('warning', () => {
    // Warnings (for example a skipped optional entry) never make the ZIP valid:
    // every photo is appended from a buffer and a missing one is handled below.
  });

  archive.on('error', () => {
    abortWith(new DownloadJobFailure(GENERIC_ERROR_MESSAGE));
  });

  archive.on('end', () => {
    if (failure !== null) {
      return;
    }

    resolveFinished(Buffer.concat(chunks));
  });

  archive.append(
    Buffer.from(buildReadme(input.albumTitle, input.albumDate, input.photos.length), 'utf8'),
    {
      name: ZIP_README_NAME,
    },
  );

  let processedBytes = 0;
  const totalBytes = input.photos.reduce((total, photo) => total + photo.size, 0);

  try {
    for (const [index, photo] of input.photos.entries()) {
      if (failure !== null) {
        throw failure;
      }

      const object = await input.storage.get(photo.originalKey);

      if (object === null) {
        throw new DownloadJobFailure(MISSING_SOURCE_MESSAGE);
      }

      archive.append(object.body, {
        name: buildArchiveEntryName(
          input.albumTitle,
          input.albumDate,
          index + 1,
          photo.id,
          photo.mimeType,
        ),
      });

      processedBytes += photo.size;
      input.onProgress(toProgressPercent(processedBytes, totalBytes));
    }

    void archive.finalize().catch(() => {
      abortWith(new DownloadJobFailure(GENERIC_ERROR_MESSAGE));
    });

    return await finished;
  } catch (error) {
    const failureToReport =
      error instanceof DownloadJobFailure ? error : new DownloadJobFailure(GENERIC_ERROR_MESSAGE);

    abortWith(failureToReport);
    // `abortWith` rejects the shared promise; consume it so the rejection is
    // never reported twice, then surface the original failure.
    await finished.catch(() => undefined);
    throw failureToReport;
  }
}

async function processJob(options: DownloadWorkerOptions, jobId: string): Promise<void> {
  const prisma = options.getPrisma();
  const job = await prisma.downloadJob.findUnique({
    where: { id: jobId },
    include: { album: { select: { title: true, date: true } } },
  });

  if (job === null) {
    return;
  }

  const claimed = await prisma.downloadJob.updateMany({
    where: { id: jobId, status: 'pending' },
    data: { status: 'processing' },
  });

  if (claimed.count === 0) {
    return;
  }

  options.progress.set(jobId, 0);

  let uploadedKey: string | null = null;

  try {
    const photoIds = readPhotoIds(job.photoIds);
    const rows = await prisma.photo.findMany({
      where: { id: { in: photoIds }, circleId: job.circleId },
      select: { id: true, size: true, originalKey: true, mimeType: true },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    const photos = photoIds
      .map((id) => byId.get(id))
      .filter((row): row is DownloadSourcePhoto => row !== undefined);
    const albumTitle = job.album?.title ?? 'Album';
    const albumDate = job.album?.date ?? null;

    const zip = await buildZip({
      photos,
      albumTitle,
      albumDate,
      storage: options.storage,
      onProgress: (percent) => {
        options.progress.set(jobId, percent);
      },
    });

    const objectKey = `${ZIP_OBJECT_PREFIX}/${jobId}.zip`;

    await options.storage.put(objectKey, zip, ZIP_CONTENT_TYPE);
    uploadedKey = objectKey;

    const completed = await prisma.downloadJob.updateMany({
      where: { id: jobId, status: 'processing' },
      data: { status: 'ready', objectKey, completedAt: new Date() },
    });

    if (completed.count === 0) {
      // The job was expired while it was being generated: do not resurrect it,
      // and remove the ZIP that was just written.
      try {
        await options.storage.delete(objectKey);
      } catch {
        // Best effort.
      }
    }
  } catch (error) {
    const userMessage =
      error instanceof DownloadJobFailure ? error.userMessage : GENERIC_ERROR_MESSAGE;

    if (uploadedKey !== null) {
      // The row will not reference this object: remove it instead of leaving
      // an orphan ZIP in the bucket.
      try {
        await options.storage.delete(uploadedKey);
      } catch {
        // Best effort.
      }
    }

    await prisma.downloadJob.updateMany({
      where: { id: jobId, status: { in: ['pending', 'processing'] } },
      data: { status: 'error', errorMessage: userMessage },
    });

    // The thrown error can contain a storage key or provider details: neither
    // the log nor the persisted message may echo it.
    options.logger.error({ code: 'DOWNLOAD_JOB_FAILED' }, 'Download ZIP generation failed');
  } finally {
    options.progress.delete(jobId);
  }
}

export function createDownloadWorker(options: DownloadWorkerOptions): DownloadWorker {
  const queue: string[] = [];
  let draining = false;

  const drain = async (): Promise<void> => {
    if (draining) {
      return;
    }

    draining = true;

    try {
      for (let jobId = queue.shift(); jobId !== undefined; jobId = queue.shift()) {
        try {
          await processJob(options, jobId);
        } catch {
          options.logger.error({ code: 'DOWNLOAD_JOB_FAILED' }, 'Download worker error');
        }
      }
    } finally {
      draining = false;
    }
  };

  return {
    enqueue: (jobId) => {
      queue.push(jobId);
      // Fire and forget: the HTTP handler answers 202 immediately.
      void drain();
    },
  };
}
