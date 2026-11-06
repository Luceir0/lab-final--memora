import { randomUUID } from 'node:crypto';

import type { UploadPhotoFields } from '@memora/shared';
import type { FastifyBaseLogger } from 'fastify';

import { ApiError } from '../../errors.ts';
import { Prisma, type PrismaClient } from '../../generated/prisma/client.ts';
import type { GeocodingService } from '../../services/geocoding.ts';
import {
  processImage,
  processOriginal,
  type SupportedImageMimeType,
} from '../../services/images.ts';
import type { StorageService } from '../../services/storage.ts';
import { MAX_UPLOAD_BYTES } from '../../plugins/multipart.ts';
import type { PhotoWithRelations } from '../members/dto.ts';
import { normalisePlaceName, readPhotoExif, type PhotoGps } from './exif.ts';
import { buildPhotoObjectKeys, deleteObjects } from './objects.ts';
import { validateImageBytes } from './validation.ts';

/** 2 GB per circle, from `docs/03-architecture/uploads.md`. */
export const MAX_CIRCLE_BYTES = 2 * 1024 * 1024 * 1024;

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
} as const;

const PHOTO_INCLUDE = {
  uploader: { select: PUBLIC_USER_SELECT },
  tags: { include: { taggedUser: { select: PUBLIC_USER_SELECT } } },
} as const satisfies Prisma.PhotoInclude;

export interface StorePhotoInput {
  readonly prisma: PrismaClient;
  readonly storage: StorageService;
  readonly geocoding: GeocodingService;
  readonly userId: string;
  readonly circleId: string;
  readonly albumId: string;
  readonly fields: UploadPhotoFields;
  readonly file: Buffer;
  /** Request logger; receives the underlying failure without PII or coordinates. */
  readonly logger: FastifyBaseLogger;
}

export type StorePhotoOutcome =
  | { readonly status: 201; readonly photo: PhotoWithRelations }
  | { readonly status: 200; readonly photo: PhotoWithRelations };

type QuotaClient = Pick<PrismaClient, 'photo'>;

async function circleBytes(client: QuotaClient, circleId: string): Promise<number> {
  const aggregate = await client.photo.aggregate({
    where: { circleId },
    _sum: { size: true },
  });

  return aggregate._sum.size ?? 0;
}

async function assertQuota(
  client: QuotaClient,
  circleId: string,
  incomingBytes: number,
): Promise<void> {
  const current = await circleBytes(client, circleId);

  if (current + incomingBytes > MAX_CIRCLE_BYTES) {
    throw new ApiError('QUOTA_EXCEEDED');
  }
}

/**
 * Photo plus the relations `PhotoDto` needs, only while the requesting user is
 * still a member of its circle.
 *
 * A missing photo, a photo from another circle and a circle the user left all
 * return `null`, so the route answers `404` without revealing which case it is.
 * The select is the same one used by the upload response: storage keys and
 * coordinates never leave the database.
 */
export async function findPhotoForMember(
  prisma: PrismaClient,
  photoId: string,
  userId: string,
): Promise<PhotoWithRelations | null> {
  return prisma.photo.findFirst({
    where: {
      id: photoId,
      circle: { memberships: { some: { userId } } },
    },
    include: PHOTO_INCLUDE,
  });
}

/** Finds an upload by its idempotency key, with the relations `PhotoDto` needs. */
export async function findExistingUpload(
  prisma: PrismaClient,
  uploaderId: string,
  clientUploadId: string,
): Promise<PhotoWithRelations | null> {
  return prisma.photo.findUnique({
    where: {
      uploaderId_clientUploadId: { uploaderId, clientUploadId },
    },
    include: PHOTO_INCLUDE,
  });
}

/**
 * Idempotent replay. The same key is normally replayed from the same album.
 *
 * Cross-album replay is accepted while the uploader still belongs to the circle
 * that owns the existing photo. If membership was revoked, returning its DTO
 * would leak a circle the user can no longer access: that is `409 CONFLICT`.
 */
async function replayExisting(
  prisma: PrismaClient,
  userId: string,
  existing: PhotoWithRelations,
): Promise<StorePhotoOutcome> {
  const membership = await prisma.membership.findUnique({
    where: { circleId_userId: { circleId: existing.circleId, userId } },
    select: { id: true },
  });

  if (membership === null) {
    throw new ApiError('CONFLICT');
  }

  return { status: 200, photo: existing };
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function resolvePlaceName(
  geocoding: GeocodingService,
  gps: PhotoGps | null,
): Promise<string | null> {
  if (gps === null) {
    return null;
  }

  try {
    return normalisePlaceName(await geocoding.reverse(gps));
  } catch {
    // Geocoding is best-effort: the photo is still saved without a place.
    return null;
  }
}

function resolveTakenAt(formValue: string | undefined, exifDate: Date | null): Date | null {
  if (formValue !== undefined) {
    return new Date(formValue);
  }

  return exifDate;
}

async function processUploadedImage(
  file: Buffer,
  mimeType: SupportedImageMimeType,
  logger: FastifyBaseLogger,
): Promise<{
  readonly original: Awaited<ReturnType<typeof processOriginal>>;
  readonly variants: Awaited<ReturnType<typeof processImage>>;
}> {
  try {
    // Variants come from the raw upload (with `.rotate()`), not from the
    // re-encoded original, to avoid a second lossy compression.
    const [original, variants] = await Promise.all([
      processOriginal(file, mimeType),
      processImage(file),
    ]);

    return { original, variants };
  } catch (error) {
    logger.error(
      { err: error, code: 'PROCESSING_FAILED', stage: 'image' },
      'Image processing failed',
    );

    throw new ApiError('PROCESSING_FAILED');
  }
}

/**
 * Full upload pipeline after authentication and authorization.
 *
 * Ordering matters:
 * 1. Cheap size check and idempotent replay (before any image work).
 * 2. Magic bytes, pixel budget, EXIF and geocoding.
 * 3. Original and variants in memory.
 * 4. Quota pre-check, then object uploads.
 * 5. One transaction that locks the circle row, re-checks the quota and
 *    inserts `Photo` + `photo_uploaded` activity. The album is never updated.
 *
 * Any failure after the first `put` removes the objects already written.
 */
export async function storePhoto(input: StorePhotoInput): Promise<StorePhotoOutcome> {
  if (input.file.length > MAX_UPLOAD_BYTES) {
    throw new ApiError('FILE_TOO_LARGE');
  }

  const existing = await findExistingUpload(
    input.prisma,
    input.userId,
    input.fields.clientUploadId,
  );

  if (existing !== null) {
    return replayExisting(input.prisma, input.userId, existing);
  }

  // Cheap pre-check before EXIF, geocoding or sharp. It uses the raw size on
  // purpose: if it already exceeds the quota there is no need to decode. The
  // authoritative check with the processed size runs under `FOR UPDATE`.
  await assertQuota(input.prisma, input.circleId, input.file.length);

  const validated = await validateImageBytes(input.file);
  const exif = await readPhotoExif(input.file);
  const takenAt = resolveTakenAt(input.fields.takenAt, exif.takenAt);
  const placeName = await resolvePlaceName(input.geocoding, exif.gps);
  const { original, variants } = await processUploadedImage(
    input.file,
    validated.mimeType,
    input.logger,
  );

  await assertQuota(input.prisma, input.circleId, original.buffer.length);

  const photoId = randomUUID();
  const keys = buildPhotoObjectKeys(input.circleId, photoId, original.extension);
  const uploadedKeys: string[] = [];

  try {
    // Record the key before the request: a timeout can still leave the object
    // written, and deleting a key that was never created is harmless.
    uploadedKeys.push(keys.originalKey);
    await input.storage.put(keys.originalKey, original.buffer, original.mimeType);

    uploadedKeys.push(keys.displayKey);
    await input.storage.put(keys.displayKey, variants.display.buffer, 'image/webp');

    uploadedKeys.push(keys.thumbKey);
    await input.storage.put(keys.thumbKey, variants.thumb.buffer, 'image/webp');
  } catch (error) {
    input.logger.error(
      { err: error, code: 'PROCESSING_FAILED', stage: 'storage' },
      'Object storage failed during upload',
    );
    await deleteObjects(input.storage, uploadedKeys);

    throw new ApiError('PROCESSING_FAILED');
  }

  try {
    const photo = await input.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Circle" WHERE "id" = ${input.circleId} FOR UPDATE
      `;

      if (locked.length === 0) {
        throw new ApiError('NOT_FOUND');
      }

      await assertQuota(tx, input.circleId, original.buffer.length);

      const created = await tx.photo.create({
        data: {
          id: photoId,
          circleId: input.circleId,
          albumId: input.albumId,
          uploaderId: input.userId,
          clientUploadId: input.fields.clientUploadId,
          mimeType: original.mimeType,
          size: original.buffer.length,
          width: original.width,
          height: original.height,
          takenAt,
          placeName,
          description: input.fields.description ?? null,
          ...keys,
        },
        include: PHOTO_INCLUDE,
      });

      await tx.activity.create({
        data: {
          circleId: input.circleId,
          actorId: input.userId,
          type: 'photo_uploaded',
          albumId: input.albumId,
          photoId: created.id,
          // Grouping metadata from activity.md; no PII.
          metadata: { count: 1 },
        },
      });

      return created;
    });

    return { status: 201, photo };
  } catch (error) {
    await deleteObjects(input.storage, uploadedKeys);

    if (error instanceof ApiError) {
      throw error;
    }

    if (isUniqueConstraintError(error)) {
      input.logger.warn(
        { code: 'IDEMPOTENCY_RACE', stage: 'database' },
        'Concurrent upload with the same clientUploadId',
      );

      // A concurrent request with the same idempotency key won the insert.
      const raced = await findExistingUpload(
        input.prisma,
        input.userId,
        input.fields.clientUploadId,
      );

      if (raced !== null) {
        return replayExisting(input.prisma, input.userId, raced);
      }

      throw new ApiError('PROCESSING_FAILED');
    }

    // The album or circle was deleted between the route checks and the insert.
    // The upload has not been published; answer the same 404 as a missing album.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2003' || error.code === 'P2025')
    ) {
      input.logger.warn(
        { code: 'NOT_FOUND', stage: 'database' },
        'Album or circle disappeared during upload',
      );
      throw new ApiError('NOT_FOUND');
    }

    input.logger.error(
      { err: error, code: 'INTERNAL_ERROR', stage: 'database' },
      'Database transaction failed during upload',
    );

    // Database failures stay internal (500) but objects are already cleaned.
    throw error;
  }
}
