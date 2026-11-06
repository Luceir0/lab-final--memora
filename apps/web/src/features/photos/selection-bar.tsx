import { Button, IconButton } from '@memora/ui';
import { Download, Tag, Trash2, X } from 'lucide-react';
import { useId } from 'react';

import { formatSelectedCount } from './format';

export interface SelectionBarProps {
  readonly selectedCount: number;
  readonly loadedCount: number;
  readonly onClear: () => void;
  readonly onSelectAll: () => void;
}

/**
 * Barra de selección de la galería.
 *
 * Las acciones de descarga, etiquetado y borrado pertenecen a F33/F31 y se
 * muestran deshabilitadas con una nota accesible: no se ocultan porque el
 * diseño las sitúa en la barra. `Esc` también limpia la selección desde el
 * hook; el botón de cerrar devuelve el foco a la rejilla.
 */
export function SelectionBar({
  selectedCount,
  loadedCount,
  onClear,
  onSelectAll,
}: SelectionBarProps) {
  const noteId = useId();
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
          disabled
          aria-describedby={noteId}
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
          disabled
          aria-describedby={noteId}
          className="text-on-primary! disabled:bg-transparent! disabled:text-on-primary/60!"
        >
          Eliminar
        </Button>
      </div>

      <p id={noteId} className="w-full text-caption text-on-primary/80">
        Descargar, etiquetar y eliminar selecciones llegarán en una próxima entrega.
      </p>
    </div>
  );
}
