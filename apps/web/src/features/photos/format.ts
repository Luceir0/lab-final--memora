import type { PhotoDto } from '@memora/shared';

const PHOTO_DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatDate(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : PHOTO_DATE_FORMATTER.format(date);
}

/**
 * Texto accesible de una foto de la galería.
 *
 * La descripción manda; si no existe, se compone con la persona que la subió y
 * la fecha. Nunca se usa el nombre del archivo ni se exponen coordenadas.
 */
export function formatPhotoDescription(photo: PhotoDto): string {
  const description = photo.description?.trim() ?? '';

  if (description !== '') {
    return description;
  }

  const date = formatDate(photo.takenAt ?? photo.createdAt);
  const place = photo.placeName?.trim() ?? '';

  if (place !== '') {
    return date === null ? place : `${place}, ${date}`;
  }

  return date === null
    ? `Foto de ${photo.uploader.name}`
    : `Foto de ${photo.uploader.name}, ${date}`;
}

/** «1 álbum», «6 álbumes». */
export function formatAlbumsCount(count: number): string {
  return `${count} ${count === 1 ? 'álbum' : 'álbumes'}`;
}

/** «Aparece en 142 fotos de 6 álbumes». */
export function formatPersonPhotosSummary(photosCount: number, albumsCount: number): string {
  return `Aparece en ${photosCount === 1 ? '1 foto' : `${photosCount} fotos`} de ${formatAlbumsCount(albumsCount)}`;
}

/** «1 foto seleccionada», «5 fotos seleccionadas». */
export function formatSelectedCount(count: number): string {
  return count === 1 ? '1 foto seleccionada' : `${count} fotos seleccionadas`;
}
