import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';

import type { PhotoDto } from '@memora/shared';

export interface ToggleSelectionModifiers {
  readonly shiftKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
}

export interface PhotoSelection {
  readonly selectedIds: ReadonlySet<string>;
  readonly selectedCount: number;
  readonly isSelected: (photoId: string) => boolean;
  readonly toggle: (photo: PhotoDto, modifiers?: ToggleSelectionModifiers) => void;
  readonly selectAll: (photos: readonly PhotoDto[]) => void;
  readonly clear: () => void;
}

/**
 * Selección múltiple de la galería.
 *
 * - Clic o Ctrl/Cmd + clic: alterna una foto y fija el ancla.
 * - Shift + clic: añade el rango entre el ancla y la foto pulsada, en el orden
 *   visible de la rejilla.
 * - `Escape` limpia la selección. El consumidor decide dónde devolver el foco.
 *
 * El ancla se guarda por id, no por índice, para que cargar una página nueva
 * no desplace el rango.
 */
export function usePhotoSelection(photos: readonly PhotoDto[]): PhotoSelection {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const anchorIdRef = useRef<string | null>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const toggle = useCallback((photo: PhotoDto, modifiers: ToggleSelectionModifiers = {}) => {
    const { shiftKey = false } = modifiers;

    setSelectedIds((current) => {
      const next = new Set(current);
      const anchorId = anchorIdRef.current;

      if (shiftKey && anchorId !== null) {
        const list = photosRef.current;
        const anchorIndex = list.findIndex((item) => item.id === anchorId);
        const targetIndex = list.findIndex((item) => item.id === photo.id);

        if (anchorIndex !== -1 && targetIndex !== -1) {
          const [start, end] =
            anchorIndex <= targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];

          for (let index = start; index <= end; index += 1) {
            const item = list[index];

            if (item !== undefined) {
              next.add(item.id);
            }
          }

          return next;
        }
      }

      if (next.has(photo.id)) {
        next.delete(photo.id);
      } else {
        next.add(photo.id);
      }

      anchorIdRef.current = photo.id;

      return next;
    });
  }, []);

  const selectAll = useCallback((items: readonly PhotoDto[]) => {
    setSelectedIds(new Set(items.map((photo) => photo.id)));
    anchorIdRef.current = items[0]?.id ?? null;
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    anchorIdRef.current = null;
  }, []);

  const isSelected = useCallback((photoId: string) => selectedIds.has(photoId), [selectedIds]);

  useEffect(() => {
    if (selectedIds.size === 0) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        clear();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clear, selectedIds.size]);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelected,
    toggle,
    selectAll,
    clear,
  };
}

/** Extrae los modificadores relevantes de un clic de ratón o teclado. */
export function selectionModifiers(event: MouseEvent<HTMLElement>): ToggleSelectionModifiers {
  return {
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
  };
}
