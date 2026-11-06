import type { PhotoDto, PhotoSummary } from '@memora/shared';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';

import { formatUploadPhotoAlt } from './format';

export interface UploadPhotoThumbnailProps {
  readonly photo: PhotoDto;
  readonly albumTitle: string;
}

/**
 * Miniatura de una foto propia.
 *
 * No es un enlace: el visor llega en F30. Si la imagen falla (el seed de
 * desarrollo puede no tener el objeto en storage) se sustituye por un bloque
 * de reserva con un icono decorativo, conservando el texto alternativo. Nunca
 * se deja el icono nativo de imagen rota.
 */
export function UploadPhotoThumbnail({ photo, albumTitle }: UploadPhotoThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const alt = formatUploadPhotoAlt(photo.description, albumTitle, photo.createdAt, photo.takenAt);

  return (
    <div className="aspect-square overflow-hidden rounded-md bg-surface-2">
      {failed ? (
        <div
          role="img"
          aria-label={alt}
          className="flex size-full items-center justify-center text-muted"
        >
          <ImageOff aria-hidden="true" className="size-6" />
        </div>
      ) : (
        <img
          src={photo.thumbUrl}
          alt={alt}
          width={photo.width}
          height={photo.height}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => {
            setFailed(true);
          }}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}

interface PreviewCellProps {
  readonly photo: PhotoSummary;
}

/** Celda decorativa del mosaico: si falla, queda el fondo `surface-2`. */
function PreviewCell({ photo }: PreviewCellProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="aspect-square overflow-hidden bg-surface-2">
      {failed ? null : (
        <img
          src={photo.thumbUrl}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => {
            setFailed(true);
          }}
          className="size-full object-cover"
        />
      )}
    </div>
  );
}

export interface AlbumPreviewMosaicProps {
  readonly photos: readonly PhotoSummary[];
}

/**
 * Mosaico 2×2 de hasta cuatro previews.
 *
 * Es decorativo: el nombre y el contador de la carpeta están siempre en texto.
 * Los huecos se rellenan con `surface-2` para que la tarjeta no cambie de
 * tamaño entre carpetas.
 */
export function AlbumPreviewMosaic({ photos }: AlbumPreviewMosaicProps) {
  const cells = photos.slice(0, 4);
  const emptyCells = 4 - cells.length;

  return (
    <div
      aria-hidden="true"
      className="grid size-16 shrink-0 grid-cols-2 gap-1 overflow-hidden rounded-md sm:size-20"
    >
      {cells.map((photo) => (
        <PreviewCell key={photo.id} photo={photo} />
      ))}
      {Array.from({ length: emptyCells }, (_, index) => (
        <div key={`empty-${index}`} className="aspect-square bg-surface-2" />
      ))}
    </div>
  );
}
