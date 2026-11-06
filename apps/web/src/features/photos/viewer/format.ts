const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function parseDate(value: string | null): Date | null {
  if (value === null) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** «14 de agosto de 2026 · 19:42». `null` si la fecha no es válida. */
export function formatPhotoTakenAt(value: string | null): string | null {
  const date = parseDate(value);

  return date === null ? null : DATE_TIME_FORMATTER.format(date);
}

/** «15 de agosto de 2026». `null` si la fecha no es válida. */
export function formatPhotoUploadedAt(value: string | null): string | null {
  const date = parseDate(value);

  return date === null ? null : DATE_FORMATTER.format(date);
}

/**
 * «24 de 342», «1 de 3» o «Foto» si la foto no está en la lista cargada.
 *
 * `index` es la posición cero-based dentro de la lista visible; el total sale
 * del contador del álbum, no del número de fotos descargadas.
 */
export function formatPhotoPosition(index: number, total: number | undefined): string {
  if (index < 0) {
    return 'Foto';
  }

  if (total === undefined || total <= 0) {
    return `Foto ${index + 1}`;
  }

  return `${index + 1} de ${total}`;
}
