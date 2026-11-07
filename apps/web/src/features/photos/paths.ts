import { circlePath } from '../circles/paths';

/**
 * Ruta de «Fotos de esta persona» dentro de un círculo.
 *
 * Vive en `features/photos` porque la entrada la añade F29 y la consume tanto
 * la fila de miembros como la cabecera de la propia página.
 */
export function personPhotosPath(circleId: string, userId: string): string {
  return `${circlePath(circleId)}/people/${encodeURIComponent(userId)}/photos`;
}
