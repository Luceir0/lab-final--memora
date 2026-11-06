/**
 * Preview local de un archivo.
 *
 * `createObjectURL` no existe en jsdom ni en algunos entornos sin DOM; el
 * fallback evita romper el render y deja la UI sin miniatura.
 */
export function createPreviewUrl(file: File): string {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return '';
  }

  try {
    return URL.createObjectURL(file);
  } catch {
    return '';
  }
}

export function revokePreviewUrl(url: string): void {
  if (url.length === 0) {
    return;
  }

  if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
    return;
  }

  URL.revokeObjectURL(url);
}
