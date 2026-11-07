/**
 * Filename helpers for download responses and ZIP entries.
 *
 * The client never chooses a download name: it is built from the album, the
 * date and the photo id. Everything is reduced to ASCII `[a-z0-9-]`, so the
 * value is safe inside `Content-Disposition` (no quotes, newlines or `;`) and
 * in a ZIP entry, and no accent leaks into the filesystem.
 */

const DIACRITICS = /[\u0300-\u036f]/g;
const UNSAFE_RUN = /[^a-z0-9]+/g;
const MAX_PART_LENGTH = 48;

/** ASCII slug: `Cumpleaños de Lucía` → `cumpleanos-de-lucia`. */
export function sanitizeFilePart(value: string, fallback: string): string {
  const slug = value
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(UNSAFE_RUN, '-')
    .replace(/^-+/, '')
    .slice(0, MAX_PART_LENGTH)
    .replace(/-+$/, '');

  return slug.length > 0 ? slug : fallback;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Calendar date in UTC, e.g. `2025-05-01`; `sin-fecha` when unknown. */
export function formatFileDate(date: Date | null): string {
  if (date === null) {
    return 'sin-fecha';
  }

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * Extension derived from the persisted MIME type. Unknown values fall back to
 * `bin` instead of echoing an arbitrary string from the database.
 */
export function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}

export interface PhotoFilenameInput {
  readonly albumTitle: string;
  readonly date: Date | null;
  readonly photoId: string;
  readonly mimeType: string;
}

/** `memora-{album}-{fecha}-{id}.{ext}` (contract `downloads.md`). */
export function buildPhotoDownloadFilename(input: PhotoFilenameInput): string {
  const album = sanitizeFilePart(input.albumTitle, 'album');
  const date = formatFileDate(input.date);
  const id = sanitizeFilePart(input.photoId, 'foto');
  const extension = extensionForMimeType(input.mimeType);

  return `memora-${album}-${date}-${id}.${extension}`;
}

/** `memora-{album}-{fecha}.zip`. */
export function buildArchiveDownloadFilename(albumTitle: string, date: Date | null): string {
  const album = sanitizeFilePart(albumTitle, 'album');
  const formattedDate = formatFileDate(date);

  return `memora-${album}-${formattedDate}.zip`;
}

/** Entry name inside the ZIP; the index keeps names unique and ordered. */
export function buildArchiveEntryName(
  albumTitle: string,
  date: Date | null,
  index: number,
  photoId: string,
  mimeType: string,
): string {
  const album = sanitizeFilePart(albumTitle, 'album');
  const formattedDate = formatFileDate(date);
  const id = sanitizeFilePart(photoId, 'foto');
  const extension = extensionForMimeType(mimeType);

  return `${album}-${formattedDate}-${String(index).padStart(3, '0')}-${id}.${extension}`;
}

/** Attachment disposition. The name is already ASCII-only and quote-free. */
export function attachmentDisposition(filename: string): string {
  return `attachment; filename="${filename}"`;
}
