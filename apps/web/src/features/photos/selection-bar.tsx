import { Button, IconButton } from '@memora/ui';
import { Download, Tag, Trash2, X } from 'lucide-react';
import { useId } from 'react';

import { formatSelectedCount } from './format';

export interface SelectionBarProps {
  readonly selectedCount: number;
  readonly loadedCount: number;
  readonly onClear: () => void;
  readonly onSelectAll: () => void;
  /** Todas las fotos seleccionadas son borrables por la cuenta actual. */
  readonly canDelete?: boolean | undefined;
  readonly onDelete?: (() => void) | undefined;
  /** Motivo visible y accesible cuando «Eliminar» no está disponible. */
  readonly deleteDisabledReason?: string | undefined;
  readonly deleting?: boolean | undefined;
  /** La cuenta puede descargar en este círculo (`membersCanDownload`). */
  readonly canDownload?: boolean | undefined;
  readonly onDownload?: (() => void) | undefined;
  /** Hay un job de descarga en curso: bloquea el botón. */
  readonly downloading?: boolean | undefined;
  /** Motivo visible y accesible cuando «Descargar» no está disponible. */
  readonly downloadDisabledReason?: string | undefined;
}

/**
 * Barra de selección de la galería.
 *
 * «Eliminar» está activo cuando todas las fotos seleccionadas son borrables
 * (autor u owner). «Descargar» depende de `membersCanDownload` (F33); si está
 * desactivado se explica con una nota accesible. El etiquetado pertenece a F32
 * y sigue deshabilitado.
 *
 * `Esc` también limpia la selección desde el hook; el botón de cerrar devuelve
 * el foco a la rejilla.
 */
export function SelectionBar({
  selectedCount,
  loadedCount,
  onClear,
  onSelectAll,
  canDelete = false,
  onDelete,
  deleteDisabledReason,
  deleting = false,
  canDownload = false,
  onDownload,
  downloading = false,
  downloadDisabledReason,
}: SelectionBarProps) {
  const noteId = useId();
  const deleteReasonId = useId();
  const downloadReasonId = useId();
  const allSelected = loadedCount > 0 && selectedCount === loadedCount;

  return (
    <div
      role="region"
      aria-label="Selección de fotos"
      className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-primary px-4 py-3 text-on-primary shadow-sm"
    >
      <IconButton
        label="Salir de la selección"
        icon={<X />}
        variant="onMedia"
        onClick={onClear}
        className="shrink-0"
      />

      <p role="status" className="min-w-0 flex-1 text-body-sm font-semibold">
        {formatSelectedCount(selectedCount)}
      </p>

      <Button
        variant="soft"
        size="sm"
        onClick={onSelectAll}
        disabled={allSelected || loadedCount === 0}
        className="shrink-0"
      >
        {allSelected ? 'Todas seleccionadas' : `Seleccionar las ${loadedCount}`}
      </Button>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          icon={<Download />}
          disabled={!canDownload}
          loading={downloading}
          aria-describedby={canDownload ? undefined : downloadReasonId}
          onClick={onDownload}
          className="text-on-primary! disabled:bg-transparent! disabled:text-on-primary/60!"
        >
          Descargar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Tag />}
          disabled
          aria-describedby={noteId}
          className="text-on-primary! disabled:bg-transparent! disabled:text-on-primary/60!"
        >
          Etiquetar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 />}
          disabled={!canDelete || deleting}
          aria-describedby={canDelete ? undefined : deleteReasonId}
          onClick={onDelete}
          className="text-on-primary! disabled:bg-transparent! disabled:text-on-primary/60!"
        >
          {deleting ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </div>

      <p id={noteId} className="w-full text-caption text-on-primary/80">
        El etiquetado de selecciones llegará en una próxima entrega.
      </p>

      {canDownload ? null : (
        <p id={downloadReasonId} className="w-full text-caption text-on-primary/80">
          {downloadDisabledReason ?? 'La descarga está desactivada en este círculo.'}
        </p>
      )}

      {canDelete ? null : (
        <p id={deleteReasonId} className="w-full text-caption text-on-primary/80">
          {deleteDisabledReason ??
            'Solo puedes eliminar las fotos que hayas subido tú o si eres propietario del círculo.'}
        </p>
      )}
    </div>
  );
}
