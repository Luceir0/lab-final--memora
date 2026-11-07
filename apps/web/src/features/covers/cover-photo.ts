import type { PhotoDto, PhotoSummary } from '@memora/shared';

/**
 * Recorta un `PhotoDto` a la portada mínima del contrato.
 *
 * El borrador guarda el resumen para previsualizar la portada sin depender de
 * que la galería siga cargada ni de volver a pedir la foto.
 */
export function toPhotoSummary(photo: PhotoDto): PhotoSummary {
  return {
    id: photo.id,
    thumbUrl: photo.thumbUrl,
    width: photo.width,
    height: photo.height,
  };
}
