import { Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface UploadDropzoneProps {
  readonly albumTitle: string;
  readonly onFiles: (files: readonly File[]) => void;
  readonly enabled?: boolean;
}

function hasFilePayload(dataTransfer: DataTransfer | null): boolean {
  return dataTransfer !== null && Array.from(dataTransfer.types).includes('Files');
}

function fileCount(dataTransfer: DataTransfer | null): number {
  if (dataTransfer === null) {
    return 0;
  }

  const items = Array.from(dataTransfer.items).filter((item) => item.kind === 'file').length;

  return items > 0 ? items : dataTransfer.files.length;
}

function isInsideIgnoredArea(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    (target.closest('[data-upload-queue]') !== null ||
      target.closest('[data-memora-overlay-root]') !== null)
  );
}

/**
 * Capa de arrastre para escritorio.
 *
 * Escucha en `window` porque el arrastre puede empezar en cualquier punto de la
 * página. Solo acepta `DataTransfer` con archivos: texto, selecciones y
 * arrastres internos no abren la capa. El contador de `dragenter`/`dragleave`
 * evita el parpadeo al pasar sobre hijos. Los arrastres dentro de la propia cola
 * se ignoran.
 */
export function UploadDropzone({ albumTitle, onFiles, enabled = true }: UploadDropzoneProps) {
  const [dragDepth, setDragDepth] = useState(0);
  const [count, setCount] = useState(0);
  const depthRef = useRef(0);
  const onFilesRef = useRef(onFiles);

  onFilesRef.current = onFiles;

  useEffect(() => {
    const reset = () => {
      depthRef.current = 0;
      setDragDepth(0);
      setCount(0);
    };

    const handleDragEnter = (event: DragEvent) => {
      if (!enabled || isInsideIgnoredArea(event.target)) {
        reset();
        return;
      }

      if (!hasFilePayload(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      depthRef.current += 1;
      setDragDepth(depthRef.current);
      setCount(fileCount(event.dataTransfer));
    };

    const handleDragOver = (event: DragEvent) => {
      // Con archivos se cancela SIEMPRE el default, también deshabilitado o
      // dentro de la cola: si no, el navegador abriría el archivo y perdería
      // la cola al recargar.
      if (!hasFilePayload(event.dataTransfer)) {
        return;
      }

      event.preventDefault();

      if (!enabled || isInsideIgnoredArea(event.target)) {
        reset();
        return;
      }

      if (event.dataTransfer !== null) {
        event.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!enabled || isInsideIgnoredArea(event.target)) {
        reset();
        return;
      }

      if (depthRef.current === 0) {
        return;
      }

      depthRef.current = Math.max(0, depthRef.current - 1);
      setDragDepth(depthRef.current);

      if (depthRef.current === 0) {
        setCount(0);
      }
    };

    const handleDrop = (event: DragEvent) => {
      if (!hasFilePayload(event.dataTransfer)) {
        return;
      }

      // Igual que en `dragover`: el default se cancela aunque no se encole.
      event.preventDefault();

      if (!enabled || isInsideIgnoredArea(event.target)) {
        reset();
        return;
      }

      const files = Array.from(event.dataTransfer?.files ?? []);
      reset();

      if (files.length > 0) {
        onFilesRef.current(files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [enabled]);

  if (dragDepth === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-upload-dropzone=""
      className="pointer-events-none fixed inset-0 z-nav flex items-center justify-center bg-primary/10 p-6 backdrop-blur-sm"
    >
      <div className="max-w-md rounded-2xl border border-dashed border-primary bg-surface/95 px-6 py-8 text-center shadow-lg">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft text-on-primary-soft">
          <Upload className="size-6" />
        </span>
        <p className="mt-4 text-h3 font-bold text-text">
          {count > 0
            ? `Suelta para subir ${count} ${count === 1 ? 'foto' : 'fotos'}`
            : 'Suelta para subir fotos'}
        </p>
        <p className="mt-2 text-body-sm text-muted">
          Se añadirán a {albumTitle} · en calidad original
        </p>
      </div>
    </div>
  );
}
