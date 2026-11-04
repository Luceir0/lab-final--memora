/**
 * Helpers puros de presentación de círculos.
 *
 * Viven fuera de los componentes para poder probarlos sin DOM ni fechas del
 * sistema. Todas las fechas se formatean en la zona horaria del navegador,
 * que es la que ve la persona usuaria.
 */

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
});

// Por defecto, es-ES agrupa solo a partir de 5 cifras (1240 → «1240»).
// El diseño enseña «1.240», así que se fuerza el separador de miles.
const NUMBER_FORMATTER = new Intl.NumberFormat('es-ES', { useGrouping: 'always' });

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Pone en mayúscula la primera letra sin tocar el resto. */
function capitalize(value: string): string {
  if (value === '') {
    return value;
  }

  return `${value.charAt(0).toLocaleUpperCase('es-ES')}${value.slice(1)}`;
}

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** «Sábado, 17 de octubre». */
export function formatLongDate(value: string | Date): string {
  const date = toDate(value);

  return date === null ? '' : capitalize(LONG_DATE_FORMATTER.format(date));
}

/** «17 oct». */
export function formatShortDate(value: string | Date): string {
  const date = toDate(value);

  return date === null ? '' : SHORT_DATE_FORMATTER.format(date).replace(/\.$/, '');
}

/**
 * «Hoy», «Ayer», «Hace 3 días» o la fecha corta a partir de la semana.
 *
 * Una fecha futura se trata como «Hoy»: el servidor puede ir unos segundos por
 * delante del reloj del navegador y no queremos anunciar «Hace -1 días».
 */
export function formatRelativeDate(value: string | Date, now: Date = new Date()): string {
  const date = toDate(value);

  if (date === null) {
    return '';
  }

  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / MS_PER_DAY);

  if (days <= 0) {
    return 'Hoy';
  }

  if (days === 1) {
    return 'Ayer';
  }

  if (days < 7) {
    return `Hace ${formatCount(days)} días`;
  }

  return formatShortDate(date);
}

/** Miles con separador de es-ES: 1240 → «1.240». */
export function formatCount(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

/** «1 persona», «8 personas», «1 álbum», «12 álbumes». */
export function formatPlural(count: number, singular: string, plural: string): string {
  return `${formatCount(count)} ${count === 1 ? singular : plural}`;
}

export interface CircleStatsLike {
  readonly membersCount: number;
  readonly albumsCount: number;
  readonly photosCount: number;
}

/** «8 personas · 12 álbumes · 1.240 fotos». */
export function formatCircleStats(stats: CircleStatsLike): string {
  return [
    formatPlural(stats.membersCount, 'persona', 'personas'),
    formatPlural(stats.albumsCount, 'álbum', 'álbumes'),
    formatPlural(stats.photosCount, 'foto', 'fotos'),
  ].join(' · ');
}

/** Versión corta para las filas de móvil: «8 personas · 1.240 fotos». */
export function formatCircleStatsShort(stats: CircleStatsLike): string {
  return [
    formatPlural(stats.membersCount, 'persona', 'personas'),
    formatPlural(stats.photosCount, 'foto', 'fotos'),
  ].join(' · ');
}

/** Iniciales de hasta dos palabras, en mayúsculas. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (parts.length === 0) {
    return '?';
  }

  return parts.map((part) => part.charAt(0).toLocaleUpperCase('es-ES')).join('');
}

/** Primer nombre para el saludo: «Sofía Martín» → «Sofía». */
export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}

/** Reloj corto para el código de error: «17:42». */
export function formatClockTime(value: Date = new Date()): string {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(value);
}
