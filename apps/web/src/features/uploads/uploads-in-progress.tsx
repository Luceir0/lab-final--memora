import { Button, ProgressBar } from '@memora/ui';
import { useEffect, useId, useRef } from 'react';

import { getUploadErrorCopy } from './errors';
import { formatUploadItemName, formatUploadStatus } from './format';
import { UPLOADS_TITLE_ID } from './history/ids';
import { useUploadQueue } from './upload-queue-context';
import type { UploadItem } from './types';

/** Filas visibles antes de resumir el resto con «y N más en la cola». */
const VISIBLE_LIMIT = 3;

function isInProgress(item: UploadItem): boolean {
  return item.status === 'pending' || item.status === 'uploading' || item.status === 'error';
}

function statusClassName(item: UploadItem): string {
  switch (item.status) {
    case 'error':
      return 'text-danger-text';
    case 'uploading':
      return 'text-primary-text';
    case 'pending':
      return 'text-muted';
    default:
      return 'text-muted';
  }
}

/**
 * Bloque «En curso» de `/uploads`.
 *
 * Es un espejo de solo lectura de la cola global de F26: no reintenta, no
 * cancela y no anuncia nada. Las acciones viven en el panel de la cola y los
 * anuncios en su `UploadAnnouncer`; duplicarlos aquí los diría dos veces.
 */
export function UploadsInProgress() {
  const { items, isPanelOpen, openPanel } = useUploadQueue();
  const headingId = useId();
  const hadFocusRef = useRef(false);
  const previousCountRef = useRef(0);
  const inProgress = items.filter(isInProgress);

  /*
   * Si el bloque desaparece porque las subidas terminan mientras el foco está
   * dentro, el elemento enfocado se desmonta y el foco caería en `body`. Se
   * devuelve al `h1` de la página, que es el inicio lógico del documento.
   */
  useEffect(() => {
    const previousCount = previousCountRef.current;
    previousCountRef.current = inProgress.length;

    if (previousCount > 0 && inProgress.length === 0 && hadFocusRef.current) {
      hadFocusRef.current = false;
      document.getElementById(UPLOADS_TITLE_ID)?.focus();
    }
  }, [inProgress.length]);

  const handleFocus = (): void => {
    hadFocusRef.current = true;
  };

  const handleBlur = (): void => {
    hadFocusRef.current = false;
  };

  if (inProgress.length === 0) {
    return null;
  }

  const visible = inProgress.slice(0, VISIBLE_LIMIT);
  const hiddenCount = inProgress.length - visible.length;

  return (
    <section
      aria-labelledby={headingId}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="mb-6 rounded-xl border border-border bg-surface p-4 shadow-sm lg:mb-8 lg:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-h2 font-bold text-text">
          En curso
        </h2>
        <Button
          variant="secondary"
          size="sm"
          aria-haspopup="dialog"
          aria-expanded={isPanelOpen}
          onClick={() => {
            openPanel({ focus: true });
          }}
        >
          Abrir cola
        </Button>
      </div>

      <ul className="mt-3 flex flex-col">
        {visible.map((item) => {
          const name = formatUploadItemName(item);

          return (
            <li
              key={item.id}
              className="flex items-start gap-3 border-b border-border py-3 last:border-b-0"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {item.previewUrl.length > 0 ? (
                  <img src={item.previewUrl} alt="" className="size-full object-cover" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-semibold text-text" title={name}>
                  {name}
                </p>
                <p className="truncate text-caption text-muted" title={item.albumTitle}>
                  {item.albumTitle}
                </p>
                <p className={`text-caption ${statusClassName(item)}`}>
                  {formatUploadStatus(item)}
                </p>
                {item.status === 'error' ? (
                  <p className="text-caption text-danger-text">{getUploadErrorCopy(item.error)}</p>
                ) : null}
                {item.status === 'uploading' ? (
                  <ProgressBar
                    label={`Subida de ${name}`}
                    value={item.progress}
                    size={6}
                    className="mt-2"
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {hiddenCount > 0 ? (
        <p className="mt-3 text-caption text-muted">y {hiddenCount} más en la cola</p>
      ) : null}
    </section>
  );
}
