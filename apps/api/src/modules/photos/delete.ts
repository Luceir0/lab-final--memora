import type { FastifyBaseLogger } from 'fastify';

import type { PrismaClient } from '../../generated/prisma/client.ts';
import type { StorageService } from '../../services/storage.ts';
import { deleteObjects, photoObjectKeys, type PhotoObjectKeys } from './objects.ts';

export interface DeletePhotoInput {
  readonly prisma: PrismaClient;
  readonly storage: StorageService;
  readonly photoId: string;
  readonly circleId: string;
  /** Request logger; receives storage failures without keys or PII. */
  readonly logger: FastifyBaseLogger;
}

/**
 * Deletes one photo and its objects (`DELETE /photos/:photoId`, F31).
 *
 * The row is removed inside a transaction scoped by `id + circleId`, so a photo
 * from another circle is never touched even if the route check raced with a
 * move. `PhotoTag` rows fall by cascade and `Activity.photoId` becomes `null`
 * through `SetNull`, keeping the historical events alive.
 *
 * Storage cleanup happens after the commit and is best-effort: a failing
 * bucket logs a warning and the delete still succeeds. Returns `false` when the
 * row was already gone, so the route can answer `404`.
 */
export async function deletePhoto(input: DeletePhotoInput): Promise<boolean> {
  const keys = await input.prisma.$transaction(async (tx) => {
    const stored = await tx.photo.findFirst({
      where: { id: input.photoId, circleId: input.circleId },
      select: { originalKey: true, displayKey: true, thumbKey: true },
    });

    if (stored === null) {
      return null;
    }

    // `deleteMany` instead of `delete`: a concurrent delete makes the count
    // `0` and the request answers `404`, never a `P2025` 500.
    const deleted = await tx.photo.deleteMany({
      where: { id: input.photoId, circleId: input.circleId },
    });

    return deleted.count === 0 ? null : stored;
  });

  if (keys === null) {
    return false;
  }

  await removeObjects(input.storage, keys, input.logger);

  return true;
}

/** Best-effort object cleanup; the database delete has already committed. */
async function removeObjects(
  storage: StorageService,
  keys: PhotoObjectKeys,
  logger: FastifyBaseLogger,
): Promise<void> {
  const cleanup = await deleteObjects(storage, photoObjectKeys(keys));

  if (cleanup.failures > 0) {
    logger.warn(
      { code: 'STORAGE_CLEANUP_FAILED', failed: cleanup.failures, total: cleanup.total },
      'No se pudieron borrar todos los objetos de la foto',
    );
  }
}
