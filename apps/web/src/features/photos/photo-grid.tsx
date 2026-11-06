import type { PhotoDto } from '@memora/shared';
import { Button, EmptyState, InlineAlert, Skeleton } from '@memora/ui';
import { Check, Images } from 'lucide-react';
import type { MouseEvent, ReactNode, RefObject } from 'react';

import { formatAlbumPhotos } from '../albums/format';

import { PhotoTile } from './photo-tile';
import { useInfiniteScroll } from './use-infinite-scroll';

export interface PhotoGridProps {
  /** Nombre accesible de la lista; cambia entre álbum y persona. */
  readonly label: string;
  readonly photos: readonly PhotoDto[];
  readonly selectedIds?: ReadonlySet<string>;
  /** Abre el visor al pulsar la miniatura. */
  readonly onOpen?: ((photo: PhotoDto) => void) | undefined;
  /** Alterna la selección desde la casilla o con modificadores. */
  readonly onToggle?: ((photo: PhotoDto, event: MouseEvent<HTMLElement>) => void) | undefined;
  /** Mantiene visibles las casillas mientras haya selección. */
  readonly selectionActive?: boolean | undefined;
  /** Total conocido (contador del álbum o de la persona) para el pie. */
  readonly total?: number | undefined;
  readonly loading?: boolean;
  readonly error?: unknown;
  readonly onRetry?: (() => void) | undefined;
  readonly hasNextPage?: boolean;
  readonly loadingMore?: boolean;
  readonly onLoadMore?: (() => void) | undefined;
  /** Estado vacío propio; si falta, se usa el genérico. */
  readonly empty?: ReactNode;
  readonly className?: string | undefined;
  /** Permite devolver el foco a la rejilla tras limpiar la selección. */
  readonly gridRef?: RefObject<HTMLUListElement | null> | undefined;
}

const GRID_CLASSES =
  'grid grid-cols-3 gap-1.5 sm:gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7';

/**
 * Rejilla de fotos con estados de carga, error y vacío.
 *
 * Móvil 3 columnas; escritorio de 4 a 7 (AC-01). El pie combina el centinela
 * de scroll infinito con un botón real «Cargar más fotos»: así el recorrido con
 * teclado no depende de `IntersectionObserver` (AC-10).
 */
export function PhotoGrid({
  label,
  photos,
  selectedIds,
  onOpen,
  onToggle,
  selectionActive = false,
  total,
  loading = false,
  error = null,
  onRetry,
  hasNextPage = false,
  loadingMore = false,
  onLoadMore,
  empty,
  className,
  gridRef,
}: PhotoGridProps) {
  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage: loadingMore,
    fetchNextPage: () => onLoadMore?.(),
    enabled: onLoadMore !== undefined && error === null && !loading,
  });

  if (loading) {
    return (
      <div aria-busy="true" className={className}>
        <p role="status" className="sr-only">
          Cargando fotos…
        </p>
        <ul aria-hidden="true" className={GRID_CLASSES}>
          {Array.from({ length: 12 }, (_, index) => (
            <li key={index}>
              <Skeleton shape="rect" className="aspect-square w-full rounded-md" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (error !== null && error !== undefined) {
    return (
      <div className={className}>
        <InlineAlert
          tone="danger"
          title="No hemos podido cargar las fotos"
          description="Comprueba la conexión y vuelve a intentarlo."
          action={
            onRetry === undefined ? undefined : (
              <Button variant="secondary" onClick={onRetry}>
                Reintentar
              </Button>
            )
          }
        />
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className={className}>
        {empty ?? (
          <EmptyState
            icon={<Images />}
            iconShape="square"
            title="Todavía no hay fotos que mostrar"
            description="Cuando se suba o etiquete una foto, aparecerá aquí."
            headingLevel={2}
            className="rounded-xl border border-dashed border-border-strong px-5 py-10"
          />
        )}
      </div>
    );
  }

  const showFooter = hasNextPage || (total !== undefined && total > photos.length);

  return (
    <div className={className}>
      <ul
        ref={gridRef}
        tabIndex={-1}
        aria-label={label}
        data-photo-grid=""
        className={GRID_CLASSES}
      >
        {photos.map((photo) => (
          <PhotoTile
            key={photo.id}
            photo={photo}
            selected={selectedIds?.has(photo.id) ?? false}
            onOpen={onOpen}
            onToggle={
              onToggle === undefined
                ? undefined
                : (item, event) => {
                    onToggle(item, event);
                  }
            }
            selectionActive={selectionActive}
          />
        ))}
      </ul>

      {showFooter ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          {total !== undefined ? (
            <p className="text-body-sm text-muted">
              Mostrando {photos.length} de {formatAlbumPhotos(total)}
              {hasNextPage ? ' · se cargan más al desplazar' : ''}
            </p>
          ) : null}
          {hasNextPage ? (
            <Button
              variant="secondary"
              onClick={onLoadMore}
              loading={loadingMore}
              disabled={onLoadMore === undefined}
            >
              Cargar más fotos
            </Button>
          ) : null}
          <div ref={sentinelRef} data-testid="photo-grid-sentinel" aria-hidden="true" />
        </div>
      ) : null}

      {!hasNextPage && total !== undefined && total <= photos.length ? (
        <p className="mt-6 flex items-center justify-center gap-2 text-body-sm text-muted">
          <Check aria-hidden="true" className="size-4" />
          Has visto todas las fotos.
        </p>
      ) : null}
    </div>
  );
}
