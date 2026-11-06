/**
 * Foto desde la que se abrió el visor.
 *
 * Se guarda en módulo, no en la URL: el enlace directo no debe llevar estado
 * de navegación y el foco se restaura solo dentro de la misma sesión SPA. Si
 * no hay origen (enlace directo o recarga), el visor devuelve el foco a la
 * rejilla.
 */
let originPhotoId: string | null = null;

export function rememberViewerOrigin(photoId: string): void {
  originPhotoId = photoId;
}

/** Devuelve el origen y lo olvida. */
export function takeViewerOrigin(): string | null {
  const current = originPhotoId;
  originPhotoId = null;

  return current;
}
