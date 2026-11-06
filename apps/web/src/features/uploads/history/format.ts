import type { MyUploadsSummary } from '@memora/shared';

import { formatCount } from '../../circles/format';

const UPLOAD_DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const UPLOAD_TIME_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function toDate(value: string): Date | null {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** «1 foto», «23 fotos». */
export function formatUploadPhotoCount(count: number): string {
  return `${formatCount(count)} ${count === 1 ? 'foto' : 'fotos'}`;
}

/**
 * Resumen de cabecera: «23 fotos en 2 círculos».
 *
 * Con un único círculo se nombra para dar contexto sin una cifra redundante:
 * «12 fotos en Familia García». El vacío no pinta resumen.
 */
export function formatUploadSummary(summary: Pick<MyUploadsSummary, 'total' | 'circles'>): string {
  const photos = formatUploadPhotoCount(summary.total);
  const circleCount = summary.circles.length;

  if (circleCount === 1) {
    const name = summary.circles[0]?.circle.name ?? '';

    return `${photos} en ${name}`;
  }

  return `${photos} en ${formatCount(circleCount)} círculos`;
}

/** Texto visible de una fecha de subida: «5 abr 2025». */
export function formatUploadDate(value: string): string {
  const date = toDate(value);

  if (date === null) {
    return '';
  }

  return UPLOAD_DATE_FORMATTER.format(date).replace(/\.$/, '');
}

/** Hora local de una subida: «12:00». */
function formatUploadTime(value: string): string {
  const date = toDate(value);

  return date === null ? '' : UPLOAD_TIME_FORMATTER.format(date);
}

/**
 * Texto alternativo de una miniatura.
 *
 * La descripción de la foto manda; si no existe, el alt describe el álbum, la
 * fecha y la hora. La hora (o `takenAt`, si existe) evita que dos fotos del
 * mismo álbum y día compartan exactamente el mismo texto.
 */
export function formatUploadPhotoAlt(
  description: string | null,
  albumTitle: string,
  createdAt: string,
  takenAt: string | null = null,
): string {
  const described = description?.trim() ?? '';

  if (described !== '') {
    return described;
  }

  const dateValue = takenAt ?? createdAt;
  const verb = takenAt === null ? 'subida' : 'tomada';

  return `Foto de ${albumTitle}, ${verb} el ${formatUploadDate(dateValue)} a las ${formatUploadTime(dateValue)}`;
}
