import { BottomSheet, Button, IconButton, ProgressBar } from '@memora/ui';
import { RefreshCw, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

import {
  formatUploadBytes,
  formatUploadCancelledCount,
  formatUploadFailedCount,
  formatUploadQueueCount,
} from './format';
import type { UploadQueueSummary } from './types';
import { useMediaQuery } from './use-media-query';
import { useUploadQueue } from './upload-queue-context';
import { UploadQueueItem } from './upload-queue-item';

export interface UploadQueueProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** Id del panel/hoja, compartido con `aria-controls` del disparador. */
  readonly panelId: string;
  /** Al abrir desde la barra, el panel de escritorio recibe foco. */
  readonly focusOnOpen?: boolean;
}

function UploadQueueHeader({
  summary,
  flat = false,
}: {
  readonly summary: UploadQueueSummary;
  readonly flat?: boolean;
}) {
  if (summary.total === 0) {
    return null;
  }

  const details: string[] = [];

  if (summary.failed > 0) {
    details.push(formatUploadFailedCount(summary.failed));
  }

  if (summary.cancelled > 0) {
    details.push(formatUploadCancelledCount(summary.cancelled));
  }

  return (
    <div className={flat ? 'py-1' : 'rounded-lg border border-border bg-surface-2 p-4'}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-body-sm font-semibold text-text">
          {formatUploadQueueCount(summary.completed, summary.total)}
        </p>
        <p className="text-caption text-muted">
          {summary.progress} % · {formatUploadBytes(summary.uploadedBytes, summary.totalBytes)}
        </p>
      </div>
      {details.length > 0 ? (
        <p className="mt-1 text-caption text-muted">{details.join(' · ')}</p>
      ) : null}
      <ProgressBar
        label="Progreso de las subidas"
        value={summary.progress}
        size={8}
        className="mt-2"
      />
      {summary.pending + summary.active > 0 ? (
        <p className="mt-2 text-caption text-muted">
          Puedes seguir usando Memora mientras se suben.
        </p>
      ) : null}
    </div>
  );
}

function UploadQueueFooter({
  summary,
  onCancelAll,
  onRetryFailed,
  onDiscardFailed,
  onClearCompleted,
}: {
  readonly summary: UploadQueueSummary;
  readonly onCancelAll: () => void;
  readonly onRetryFailed: () => void;
  readonly onDiscardFailed: () => void;
  readonly onClearCompleted: () => void;
}) {
  const active = summary.pending + summary.active;
  const finished = summary.completed + summary.cancelled;

  if (active === 0 && summary.failed === 0 && finished === 0) {
    return null;
  }

  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {active > 0 ? (
          <Button variant="secondary" size="sm" onClick={onCancelAll}>
            Cancelar todo
          </Button>
        ) : null}
        {finished > 0 ? (
          <Button variant="ghost" size="sm" onClick={onClearCompleted}>
            Limpiar terminadas
          </Button>
        ) : null}
        {summary.failed > 0 ? (
          <Button variant="ghost" size="sm" icon={<Trash2 />} onClick={onDiscardFailed}>
            Descartar fallidas ({summary.failed})
          </Button>
        ) : null}
      </div>
      {summary.failed > 0 ? (
        <Button
          variant="soft"
          size="sm"
          icon={<RefreshCw />}
          onClick={onRetryFailed}
          className="sm:ml-auto"
        >
          Reintentar fallidas ({summary.failed})
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Cola de subida global.
 *
 * Una sola instancia y un solo árbol de contenido: hoja inferior en
 * móvil/tablet y panel flotante no modal desde 1024 px. Muestra todos los
 * items de la cola; el nombre del álbum solo aparece por archivo cuando hay
 * subidas de más de un álbum. El cierre no cancela nada.
 */
export function UploadQueue({ open, onClose, panelId, focusOnOpen = false }: UploadQueueProps) {
  const { items, summary, retry, cancel, remove } = useUploadQueue();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const albumIds = new Set(items.map((item) => item.albumId));
  const showAlbum = albumIds.size > 1;

  // Tras una acción el botón pulsado puede desaparecer (la fila cambia o se
  // elimina). Devolvemos el foco al cuerpo del panel/hoja, que siempre existe,
  // para no dejarlo en `body` ni fuera del diálogo móvil.
  const focusBody = useCallback((): void => {
    window.requestAnimationFrame(() => {
      bodyRef.current?.focus();
    });
  }, []);

  // Abrir desde la barra sí mueve el foco al panel; el autoabrir tras encolar
  // no lo mueve. La hoja móvil ya enfoca su primer control por ser modal.
  useEffect(() => {
    if (!open || !focusOnOpen || !isDesktop) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [focusOnOpen, isDesktop, open]);

  // Panel no modal: Esc lo cierra. Si hay otro overlay abierto, lo deja a él.
  useEffect(() => {
    if (!isDesktop || !open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return;
      }

      if (document.querySelector('[data-memora-overlay-root]') !== null) {
        return;
      }

      event.preventDefault();
      onClose();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDesktop, onClose, open]);

  const cancelAll = (): void => {
    for (const item of items) {
      if (item.status === 'pending' || item.status === 'uploading') {
        cancel(item.id);
      }
    }

    focusBody();
  };

  const retryFailed = (): void => {
    for (const item of items) {
      if (item.status === 'error') {
        retry(item.id);
      }
    }

    focusBody();
  };

  const discardFailed = (): void => {
    for (const item of items) {
      if (item.status === 'error') {
        remove(item.id);
      }
    }

    focusBody();
  };

  const clearCompleted = (): void => {
    for (const item of items) {
      if (item.status === 'done' || item.status === 'cancelled') {
        remove(item.id);
      }
    }

    focusBody();
  };

  const cancelItem = (id: string): void => {
    cancel(id);
    focusBody();
  };

  const retryItem = (id: string): void => {
    retry(id);
    focusBody();
  };

  const removeItem = (id: string): void => {
    remove(id);
    focusBody();
  };

  const body = (
    <div
      ref={bodyRef}
      data-upload-queue=""
      id={isDesktop ? undefined : panelId}
      role="group"
      aria-label="Subidas"
      tabIndex={-1}
      className="space-y-4"
    >
      <UploadQueueHeader summary={summary} flat={isDesktop} />

      {items.length === 0 ? (
        <p className="py-6 text-center text-body-sm text-muted">Todavía no hay subidas.</p>
      ) : (
        <ul role="list" aria-label="Archivos en la cola">
          {items.map((item) => (
            <UploadQueueItem
              key={item.id}
              item={item}
              showAlbum={showAlbum}
              onCancel={cancelItem}
              onRetry={retryItem}
              onRemove={removeItem}
            />
          ))}
        </ul>
      )}
    </div>
  );

  const footer = (
    <UploadQueueFooter
      summary={summary}
      onCancelAll={cancelAll}
      onRetryFailed={retryFailed}
      onDiscardFailed={discardFailed}
      onClearCompleted={clearCompleted}
    />
  );

  if (isDesktop) {
    if (!open) {
      return null;
    }

    return (
      <aside
        id={panelId}
        aria-label="Subidas"
        data-upload-queue=""
        className="fixed bottom-6 right-6 z-nav flex max-h-[var(--upload-queue-panel-height)] w-[26rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg [[data-theme='dark']_&]:border-border-strong"
      >
        <header className="flex items-start gap-2 border-b border-border p-4">
          <h2 className="min-w-0 flex-1 text-h3 font-bold text-text">Subidas</h2>
          <IconButton
            ref={closeButtonRef}
            label="Cerrar subidas"
            icon={<X />}
            onClick={onClose}
            className="-mr-2 -mt-2 shrink-0"
          />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{body}</div>
        <div className="border-t border-border p-4">{footer}</div>
      </aside>
    );
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Subidas"
      bodyLabel="Lista de subidas"
      maxHeightPercent={85}
      footer={<div className="max-h-[45dvh] overflow-y-auto overscroll-contain">{footer}</div>}
    >
      {body}
    </BottomSheet>
  );
}
