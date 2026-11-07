import { deletePhotoRequest } from './queries';

/** Máximo de `DELETE` simultáneos al borrar una selección. */
export const PHOTO_DELETE_CONCURRENCY = 3;

export interface DeletePhotosResult {
  readonly deletedIds: readonly string[];
  readonly failedIds: readonly string[];
}

/**
 * Borra varias fotos con concurrencia limitada.
 *
 * Un fallo individual no cancela el resto: la selección puede mezclar fotos que
 * el servidor ya no encuentra o que dejaron de ser borrables. El consumidor
 * informa del resultado parcial en lugar de tratarlo como un todo o nada.
 */
export async function deletePhotosWithLimit(
  photoIds: readonly string[],
  csrfToken: string,
  concurrency: number = PHOTO_DELETE_CONCURRENCY,
): Promise<DeletePhotosResult> {
  const deletedIds: string[] = [];
  const failedIds: string[] = [];
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, photoIds.length));

  const worker = async () => {
    while (nextIndex < photoIds.length) {
      const index = nextIndex;
      nextIndex += 1;

      const photoId = photoIds[index];

      if (photoId === undefined) {
        continue;
      }

      try {
        await deletePhotoRequest(photoId, csrfToken);
        deletedIds.push(photoId);
      } catch {
        failedIds.push(photoId);
      }
    }
  };

  await Promise.all(Array.from({ length: workerCount }, worker));

  return { deletedIds, failedIds };
}
