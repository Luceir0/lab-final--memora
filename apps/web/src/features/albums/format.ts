/**
 * Helpers puros de presentación de álbumes.
 *
 * La fecha de un álbum se guarda como el día 1 a las 00:00 UTC (D3). Por eso
 * todos los formateos de mes usan `timeZone: 'UTC'`: con la zona del navegador,
 * un álbum de agosto podría mostrarse como julio al oeste de Greenwich.
 */

import { formatPlural, formatRelativeDate } from '../circles/format';

const MONTH_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  month: 'long',
  timeZone: 'UTC',
});

const MONTH_INPUT_PATTERN = /^(\d{4})-(\d{2})$/;

function toDate(value: string | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * «agosto 2026». Devuelve `null` si la fecha falta o no es válida para que el
 * consumidor pueda distinguir «sin fecha» de una cadena vacía.
 */
export function formatAlbumMonth(value: string | null | undefined): string | null {
  const date = toDate(value);

  if (date === null) {
    return null;
  }

  return `${MONTH_FORMATTER.format(date)} ${date.getUTCFullYear()}`;
}

/** «agosto 2026» o «Sin fecha · álbum continuo». */
export function formatAlbumDateLabel(value: string | null | undefined): string {
  return formatAlbumMonth(value) ?? 'Sin fecha · álbum continuo';
}

/** «1 foto», «342 fotos». */
export function formatAlbumPhotos(count: number): string {
  return formatPlural(count, 'foto', 'fotos');
}

/** «Se ha eliminado 1 foto.» / «Se han eliminado 342 fotos.» */
export function formatDeletedPhotos(count: number): string {
  return count === 1 ? 'Se ha eliminado 1 foto.' : `Se han eliminado ${formatAlbumPhotos(count)}.`;
}

/** «Se borrará 1 foto» / «Se borrarán 342 fotos» */
export function formatWillDeletePhotos(count: number): string {
  return count === 1 ? 'Se borrará 1 foto' : `Se borrarán ${formatAlbumPhotos(count)}`;
}

export interface AlbumMetaLike {
  readonly date: string | null;
  readonly updatedAt: string;
}

/** «agosto 2026 · actualizado hace 3 días». */
export function formatAlbumMeta(album: AlbumMetaLike, now: Date = new Date()): string {
  const dateLabel = formatAlbumDateLabel(album.date);
  const updated = formatRelativeDate(album.updatedAt, now).toLocaleLowerCase('es-ES');

  return `${dateLabel} · actualizado ${updated}`;
}

/**
 * Convierte el valor de un `<input type="month">` (`2026-08`) al ISO que
 * espera el contrato: día 1 a las 00:00 UTC.
 */
export function monthInputToIso(value: string): string | null {
  const match = MONTH_INPUT_PATTERN.exec(value.trim());

  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(year) || month < 1 || month > 12) {
    return null;
  }

  // `Date.UTC` mapea los años 0–99 a 1900–1999; `setUTCFullYear` conserva el
  // año tal cual.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, 1);
  date.setUTCHours(0, 0, 0, 0);

  return date.toISOString();
}

/**
 * `YYYY-MM` del año y mes locales del navegador.
 *
 * Se usa para precargar el mes actual en el alta: el mes que ve la persona,
 * no el que resultaría de leer UTC.
 */
export function currentMonthInput(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

/**
 * Convierte una fecha ISO al valor `YYYY-MM` del selector de mes, leyendo en
 * UTC para no desplazar el mes.
 */
export function isoToMonthInput(value: string | null | undefined): string {
  const date = toDate(value);

  if (date === null) {
    return '';
  }

  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}
