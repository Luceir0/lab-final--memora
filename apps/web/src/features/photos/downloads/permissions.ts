import type { CircleDetailDto } from '@memora/shared';

export type DownloadCircle = Pick<CircleDetailDto, 'settings'>;

/**
 * Permiso de UI para descargar.
 *
 * Espejo directo de `photo.download`: la flag `membersCanDownload` del círculo.
 * La API vuelve a comprobarlo en cada petición y responde `403` si no procede.
 */
export function canDownloadPhotos(circle: DownloadCircle): boolean {
  return circle.settings.membersCanDownload;
}
