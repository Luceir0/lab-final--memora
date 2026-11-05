import { MAX_PLACE_NAME_LENGTH } from '@memora/shared';
import exifr from 'exifr';

export interface PhotoGps {
  readonly latitude: number;
  readonly longitude: number;
}

export interface PhotoExif {
  /** `DateTimeOriginal`, interpreted as UTC when EXIF has no offset. */
  readonly takenAt: Date | null;
  /** Transient GPS; callers must never persist it. */
  readonly gps: PhotoGps | null;
}

const EXIF_DATE_PATTERN = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/;

function buildUtcDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): Date | null {
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  // Reject impossible components (2024-02-31, 25:00...) instead of letting
  // `Date.UTC` roll them over into the next day.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second
  ) {
    return null;
  }

  return date;
}

/**
 * Parses an EXIF `DateTimeOriginal` value.
 *
 * EXIF stores local wall-clock time with no zone. Memora treats it as UTC; an
 * `OffsetTimeOriginal` is not read, so a photo taken near midnight in another
 * zone can shift the calendar date. Documented limitation, not a silent server
 * timezone dependency.
 */
export function parseExifDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const match = EXIF_DATE_PATTERN.exec(value.trim());

  if (match === null) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined ||
    second === undefined
  ) {
    return null;
  }

  return buildUtcDate(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
}

function readGps(value: unknown): PhotoGps | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as { readonly latitude?: unknown; readonly longitude?: unknown };
  const { latitude, longitude } = candidate;

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

/**
 * Reads date and GPS from the uploaded bytes.
 *
 * PNG/WebP usually have no EXIF and `exifr` may reject them; every failure
 * resolves to "no EXIF", never to an upload error.
 */
export async function readPhotoExif(buffer: Buffer): Promise<PhotoExif> {
  let rawDate: unknown;
  let rawGps: unknown;

  try {
    const parsed: unknown = await exifr.parse(buffer, {
      pick: ['DateTimeOriginal'],
      reviveValues: false,
      gps: false,
    });

    if (typeof parsed === 'object' && parsed !== null) {
      rawDate = (parsed as { readonly DateTimeOriginal?: unknown }).DateTimeOriginal;
    }
  } catch {
    rawDate = undefined;
  }

  try {
    rawGps = await exifr.gps(buffer);
  } catch {
    rawGps = undefined;
  }

  return {
    takenAt: parseExifDate(rawDate),
    gps: readGps(rawGps),
  };
}

/** Persisted place name: trimmed and capped to the shared contract limit. */
export function normalisePlaceName(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === '') {
    return null;
  }

  return trimmed.slice(0, MAX_PLACE_NAME_LENGTH);
}
