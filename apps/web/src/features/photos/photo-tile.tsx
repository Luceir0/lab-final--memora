import type { PhotoDto } from '@memora/shared';
import { Check, ImageOff } from 'lucide-react';
import { useState, type MouseEvent } from 'react';

import { formatPhotoDescription } from './format';

export interface PhotoTileProps {
  readonly photo: PhotoDto;
  readonly selected: boolean;
  readonly onToggle: (photo: PhotoDto, event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Tamaños de la rejilla para `sizes`. El valor por defecto describe las
   * columnas de móvil (3) y escritorio (4–7) de AC-01.
   */
  readonly sizes?: string;
}

const DEFAULT_SIZES =
  '(min-width: 1536px) 14vw, (min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, 33vw';

/**
 * Celda de la galería.
 *
 * El tile entero es un botón con `aria-pressed`: el clic y el teclado hacen lo
 * mismo. La imagen es decorativa dentro del botón (el nombre accesible describe
 * la foto) y usa `srcset` con las variantes `thumb` y `display` de F27, además
 * de `width`/`height` para reservar el hueco antes de cargar.
 *
 * Si la imagen falla, se sustituye por un icono y se conserva el nombre del
 * botón: nunca se deja el icono nativo de imagen rota.
 */
export function PhotoTile({ photo, selected, onToggle, sizes = DEFAULT_SIZES }: PhotoTileProps) {
  const [failed, setFailed] = useState(false);
  const description = formatPhotoDescription(photo);

  return (
    <li className="min-w-0">
      <button
        type="button"
        aria-pressed={selected}
        aria-label={
          selected ? `Quitar selección: ${description}` : `Seleccionar foto: ${description}`
        }
        onClick={(event) => {
          onToggle(photo, event);
        }}
        className="group relative block aspect-square w-full overflow-hidden rounded-md bg-surface-2 transition-shadow duration-(--memora-duration-fast) ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {failed ? (
          <span
            data-testid="photo-tile-fallback"
            aria-hidden="true"
            className="flex size-full items-center justify-center text-muted"
          >
            <ImageOff className="size-6" />
          </span>
        ) : (
          <img
            src={photo.thumbUrl}
            srcSet={`${photo.thumbUrl} 400w, ${photo.displayUrl} 1600w`}
            sizes={sizes}
            alt=""
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

        <span
          aria-hidden="true"
          className={
            selected
              ? 'absolute left-2 top-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm'
              : 'absolute left-2 top-2 inline-flex size-6 items-center justify-center rounded-full border border-on-primary/70 bg-viewer-bg/40 text-transparent'
          }
        >
          <Check className="size-4" />
        </span>

        {selected ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-inset ring-primary"
          />
        ) : null}
      </button>
    </li>
  );
}
