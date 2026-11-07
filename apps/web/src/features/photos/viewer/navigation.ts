import type { PhotoDto } from '@memora/shared';

export interface PhotoNeighbours {
  /** Posición cero-based en la lista cargada; `-1` si no está. */
  readonly index: number;
  readonly previous: PhotoDto | null;
  readonly next: PhotoDto | null;
}

/**
 * Vecinos de una foto dentro de la lista ya cargada del álbum.
 *
 * La lista conserva el orden del servidor. Si la foto no está en las páginas
 * en caché (enlace directo a una foto que no cae en la primera página), no se
 * inventan vecinos: el visor muestra solo «volver».
 */
export function findPhotoNeighbours(photos: readonly PhotoDto[], photoId: string): PhotoNeighbours {
  const index = photos.findIndex((photo) => photo.id === photoId);

  if (index === -1) {
    return { index: -1, previous: null, next: null };
  }

  return {
    index,
    previous: photos[index - 1] ?? null,
    next: photos[index + 1] ?? null,
  };
}
