import { circlePath } from '../circles/paths';

/** Ruta de un álbum dentro de un círculo, con ambos ids codificados. */
export function albumPath(circleId: string, albumId: string): string {
  return `${circlePath(circleId)}/albums/${encodeURIComponent(albumId)}`;
}
