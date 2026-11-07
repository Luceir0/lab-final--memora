/** Aviso de tamaño antes de generar un ZIP (100 MB). */
export const DOWNLOAD_WARNING_BYTES = 100 * 1024 * 1024;

const MEGABYTE = 1024 * 1024;

export interface SizedPhoto {
  readonly size: number;
}

/** Suma el tamaño de las fotos seleccionadas, sin salir del rango seguro. */
export function sumPhotoSizes(photos: readonly SizedPhoto[]): number {
  return photos.reduce((total, photo) => total + Math.max(0, photo.size), 0);
}

/** ¿Conviene avisar antes de generar el ZIP? */
export function exceedsDownloadWarning(bytes: number): boolean {
  return bytes > DOWNLOAD_WARNING_BYTES;
}

/** «150 MB» con coma decimal y sin decimales de más. */
export function formatDownloadSize(bytes: number): string {
  const megabytes = Math.max(0, bytes) / MEGABYTE;
  const maximumFractionDigits = megabytes >= 10 ? 0 : 1;

  return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits }).format(megabytes)} MB`;
}

export function formatDownloadWarningTitle(photoCount: number): string {
  return photoCount === 1 ? 'Descargar 1 foto' : `Descargar ${photoCount} fotos`;
}

/**
 * Texto del aviso de tamaño (AC-06).
 *
 * Explica que el ZIP puede tardar y dónde queda el archivo en móvil, sin
 * prometer una carpeta concreta: iOS y Android deciden según la app.
 */
export function formatDownloadWarning(photoCount: number, bytes: number): string {
  const photos = photoCount === 1 ? '1 foto' : `${photoCount} fotos`;

  return `La selección (${photos}) pesa ${formatDownloadSize(bytes)}. Generar el ZIP puede tardar unos minutos. En iPhone y Android, el archivo se guarda en Archivos o en Descargas.`;
}
