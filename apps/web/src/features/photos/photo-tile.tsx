import type { PhotoDto } from '@memora/shared';
import { Check, ImageOff } from 'lucide-react';
import { useState, type MouseEvent } from 'react';

import { formatPhotoDescription } from './format';

export interface PhotoTileProps {
  readonly photo: PhotoDto;
  readonly selected: boolean;
  /** Abre el visor. El clic sin modificadores es siempre «abrir». */
  readonly onOpen?: ((photo: PhotoDto) => void) | undefined;
  /**
   * Alterna la selección. Se usa desde la casilla y desde el clic con
   * Shift/Ctrl/Cmd sobre la miniatura.
   */
  readonly onToggle?: ((photo: PhotoDto, event: MouseEvent<HTMLElement>) => void) | undefined;
  /** Con selección activa, la casilla queda siempre visible. */
  readonly selectionActive?: boolean | undefined;
  /**
   * Tamaños de la rejilla para `sizes`. El valor por defecto describe las
   * columnas de móvil (3) y escritorio (4–7) de AC-01.
   */
  readonly sizes?: string | undefined;
}

const DEFAULT_SIZES =
  '(min-width: 1536px) 14vw, (min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, 33vw';

/**
 * Celda de la galería.
 *
 * La miniatura abre el visor (F30). La selección tiene su propia casilla, que
 * aparece al pasar el ratón o al enfocar la celda y queda siempre visible en
 * móvil o con selección activa. Shift/Ctrl/Cmd + clic sobre la miniatura
 * seleccionan sin abrir, para no perder los atajos de F29.
 *
 * La imagen es decorativa dentro del botón (el nombre accesible describe la
 * foto) y usa `srcset` con las variantes `thumb` y `display` de F27, además de
 * `width`/`height` para reservar el hueco antes de cargar.
 */
export function PhotoTile({
  photo,
  selected,
  onOpen,
  onToggle,
  selectionActive = false,
  sizes = DEFAULT_SIZES,
}: PhotoTileProps) {
  const [failed, setFailed] = useState(false);
  const description = formatPhotoDescription(photo);
  const opensViewer = onOpen !== undefined;
  const canToggle = onToggle !== undefined;
  const checkboxVisibility = selectionActive
    ? 'opacity-100'
    : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100';

  const handleThumbnailClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (onOpen !== undefined && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      onOpen(photo);
      return;
    }

    onToggle?.(photo, event);
  };

  return (
    <li className="group relative min-w-0">
      <button
        type="button"
        data-photo-tile={photo.id}
        aria-label={
          opensViewer
            ? `Abrir foto: ${description}`
            : canToggle
              ? selected
                ? `Quitar selección: ${description}`
                : `Seleccionar foto: ${description}`
              : `Foto: ${description}`
        }
        onClick={handleThumbnailClick}
        className="relative block aspect-square w-full overflow-hidden rounded-md bg-surface-2 transition-shadow duration-(--memora-duration-fast) ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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

        {selected ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-inset ring-primary"
          />
        ) : null}
      </button>

      {canToggle ? (
        <label
          className={`absolute left-1.5 top-1.5 z-10 inline-flex size-11 cursor-pointer items-center justify-center rounded-full transition-opacity duration-(--memora-duration-fast) ${checkboxVisibility}`}
        >
          <input
            type="checkbox"
            checked={selected}
            aria-label={
              selected ? `Quitar selección: ${description}` : `Seleccionar foto: ${description}`
            }
            onChange={() => {}}
            onClick={(event) => {
              onToggle?.(photo, event);
            }}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={
              selected
                ? 'inline-flex size-6 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus'
                : 'inline-flex size-6 items-center justify-center rounded-full border border-on-primary/70 bg-viewer-bg/40 text-transparent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus'
            }
          >
            <Check className="size-4" />
          </span>
        </label>
      ) : null}
    </li>
  );
}
