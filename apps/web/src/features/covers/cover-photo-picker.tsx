import type { PhotoDto } from '@memora/shared';
import { useMemo, type ReactNode } from 'react';

import { PhotoGrid } from '../photos/photo-grid';

export interface CoverPhotoPickerProps {
  /** Nombre accesible de la rejilla. */
  readonly label: string;
  readonly photos: readonly PhotoDto[];
  readonly selectedId: string | null;
  readonly onSelect: (photo: PhotoDto) => void;
  /** Quita la selección al volver a pulsar la foto marcada. */
  readonly onClear?: (() => void) | undefined;
  readonly loading?: boolean | undefined;
  readonly error?: unknown;
  readonly onRetry?: (() => void) | undefined;
  readonly hasNextPage?: boolean | undefined;
  readonly loadingMore?: boolean | undefined;
  readonly onLoadMore?: (() => void) | undefined;
  readonly total?: number | undefined;
  readonly empty?: ReactNode;
  readonly className?: string | undefined;
}

/**
 * Rejilla de selección única sobre `PhotoGrid`.
 *
 * No modifica la galería de F29: le pasa un `Set` de un solo id y mantiene la
 * selección siempre visible. La foto marcada se puede desmarcar para dejar la
 * portada vacía sin salir del selector.
 */
export function CoverPhotoPicker({
  label,
  photos,
  selectedId,
  onSelect,
  onClear,
  loading = false,
  error = null,
  onRetry,
  hasNextPage = false,
  loadingMore = false,
  onLoadMore,
  total,
  empty,
  className,
}: CoverPhotoPickerProps) {
  const selectedIds = useMemo(() => new Set(selectedId === null ? [] : [selectedId]), [selectedId]);

  return (
    <PhotoGrid
      label={label}
      photos={photos}
      selectedIds={selectedIds}
      selectionActive
      loading={loading}
      error={error}
      onRetry={onRetry}
      hasNextPage={hasNextPage}
      loadingMore={loadingMore}
      onLoadMore={onLoadMore}
      total={total}
      empty={empty}
      className={className}
      onToggle={(photo) => {
        if (photo.id === selectedId && onClear !== undefined) {
          onClear();
          return;
        }

        onSelect(photo);
      }}
    />
  );
}
