import { ProgressBar } from '@memora/ui';
import { Upload } from 'lucide-react';
import { useEffect, useRef, type RefObject } from 'react';

import { formatUploadCancelledCount, formatUploadFailedCount } from './format';
import { summarizeUploadQueue } from './reducer';
import { useMediaQuery } from './use-media-query';
import { useUploadQueue } from './upload-queue-context';

export interface UploadQueueBarProps {
  /** La cola está abierta: la barra se oculta e inutiliza, pero sigue montada. */
  readonly open: boolean;
  readonly onOpen: () => void;
  /** Id del panel/hoja que controla el botón. */
  readonly panelId: string;
  readonly buttonRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * Barra compacta global de la cola cerrada.
 *
 * En móvil/tablet va sobre la bottom nav; en escritorio es una pill anclada
 * abajo a la derecha. Se mantiene montada mientras la cola está abierta (solo
 * visualmente oculta e `inert`) para que el panel pueda devolverle el foco.
 * Se pinta en cualquier ruta privada mientras haya items.
 */
export function UploadQueueBar({ open, onOpen, panelId, buttonRef }: UploadQueueBarProps) {
  const { items } = useUploadQueue();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const hasItems = items.length > 0;
  const summary = summarizeUploadQueue(items);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasItems || typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.uploadBar = 'visible';

    return () => {
      delete document.documentElement.dataset.uploadBar;
    };
  }, [hasItems]);

  /*
   * La barra de guardado de Ajustes se apoya en `--upload-queue-bar-height`
   * para apilarse encima en móvil (B2). La medida fija de `app.css` se queda
   * corta con zoom de texto; publicamos la altura real y la limpiamos al
   * desmontar. No cambia el comportamiento visual de la barra.
   */
  useEffect(() => {
    const bar = barRef.current;

    if (!hasItems || bar === null || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const syncHeight = () => {
      root.style.setProperty(
        '--upload-queue-bar-height',
        `${Math.ceil(bar.getBoundingClientRect().height)}px`,
      );
    };

    syncHeight();

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncHeight);

    observer?.observe(bar);

    return () => {
      observer?.disconnect();
      root.style.removeProperty('--upload-queue-bar-height');
    };
  }, [hasItems]);

  if (!hasItems) {
    return null;
  }

  const active = summary.pending + summary.active;
  const counters: string[] = [];

  if (summary.failed > 0) {
    counters.push(formatUploadFailedCount(summary.failed));
  }

  if (summary.cancelled > 0) {
    counters.push(formatUploadCancelledCount(summary.cancelled));
  }

  let stateText: string;

  if (active > 0) {
    stateText = `Subiendo ${summary.completed} de ${summary.total}`;
  } else if (summary.failed > 0) {
    stateText = `${summary.completed} de ${summary.total}`;
  } else if (summary.completed === 0 && summary.cancelled > 0) {
    stateText = 'Subidas canceladas';
  } else {
    stateText = `Subidas terminadas · ${summary.completed} de ${summary.total}`;
  }

  const percentText = `${summary.progress} %`;
  const accessibleText = [stateText, percentText, ...counters].join(' · ');
  const positionClasses = isDesktop
    ? 'bottom-6 right-6 w-[22rem] max-w-[calc(100vw-3rem)]'
    : 'bottom-[calc(var(--app-bottom-nav-height)+0.75rem)] left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))]';

  return (
    <div
      ref={barRef}
      inert={open || undefined}
      className={`fixed z-nav flex min-h-14 flex-col rounded-lg border border-border bg-surface text-left shadow-lg transition-opacity duration-(--memora-duration-fast) ease-standard motion-reduce:transition-none [[data-theme='dark']_&]:border-border-strong ${positionClasses} ${
        open ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onOpen}
        aria-label={`Abrir subidas. ${accessibleText}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="absolute inset-0 rounded-lg"
      />
      <div aria-hidden="true" className="pointer-events-none flex gap-3 p-3">
        {isDesktop ? null : (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-on-primary-soft">
            <Upload className="size-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-body-sm font-semibold text-text">
              {stateText}
            </span>
            <span className="shrink-0 text-caption text-muted">{percentText}</span>
          </div>
          <ProgressBar
            label="Progreso de las subidas"
            value={summary.progress}
            size={6}
            className="mt-1"
          />
          {counters.length > 0 ? (
            <p className="mt-1 text-caption text-muted">{counters.join(' · ')}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
