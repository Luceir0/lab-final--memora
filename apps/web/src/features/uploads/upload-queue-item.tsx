import { Button, IconButton, ProgressBar } from '@memora/ui';
import { CircleCheck, Image, RefreshCw, Trash2, X } from 'lucide-react';

import { getUploadErrorCopy } from './errors';
import { formatUploadItemName, formatUploadSource, formatUploadStatus } from './format';
import type { UploadItem } from './types';

export interface UploadQueueItemProps {
  readonly item: UploadItem;
  /** Muestra el álbum de origen; solo con subidas de más de un álbum. */
  readonly showAlbum?: boolean;
  readonly onCancel: (id: string) => void;
  readonly onRetry: (id: string) => void;
  readonly onRemove: (id: string) => void;
}

function statusTone(item: UploadItem): string {
  switch (item.status) {
    case 'done':
      return 'text-success-text';
    case 'error':
      return 'text-danger-text';
    case 'uploading':
      return 'text-primary-text';
    case 'pending':
    case 'cancelled':
      return 'text-muted';
  }
}

function progressTone(item: UploadItem): 'primary' | 'danger' {
  return item.status === 'error' ? 'danger' : 'primary';
}

/**
 * Fila de un archivo de la cola.
 *
 * El estado va en texto además del color; la barra de progreso lleva el nombre
 * accesible del archivo y solo aparece cuando aporta información.
 */
export function UploadQueueItem({
  item,
  showAlbum = false,
  onCancel,
  onRetry,
  onRemove,
}: UploadQueueItemProps) {
  const name = formatUploadItemName(item);
  const canCancel = item.status === 'pending' || item.status === 'uploading';
  const canRetry = item.status === 'error' || item.status === 'cancelled';

  return (
    <li className="flex gap-3 border-b border-border py-3 last:border-b-0">
      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
        {item.previewUrl.length > 0 ? (
          <img src={item.previewUrl} alt="" className="size-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-full items-center justify-center text-muted [&>svg]:size-5"
          >
            <Image />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-semibold text-text" title={name}>
          {name}
        </p>
        {showAlbum ? (
          <p className="mt-0.5 truncate text-caption text-muted" title={item.albumTitle}>
            {item.albumTitle}
          </p>
        ) : null}
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-caption text-muted">
          <span>{formatUploadSource(item.source)}</span>
          <span aria-hidden="true">·</span>
          <span className={statusTone(item)}>{formatUploadStatus(item)}</span>
        </p>

        {item.status === 'error' ? (
          <p className="mt-1 text-caption text-danger-text">{getUploadErrorCopy(item.error)}</p>
        ) : null}

        {item.status === 'pending' || item.status === 'uploading' || item.status === 'error' ? (
          <ProgressBar
            label={`Subida de ${name}`}
            value={item.progress}
            size={6}
            tone={progressTone(item)}
            className="mt-2"
          />
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {canCancel ? (
          <IconButton
            label={`Cancelar ${name}`}
            icon={<X />}
            onClick={() => {
              onCancel(item.id);
            }}
          />
        ) : null}

        {canRetry ? (
          <Button
            variant="soft"
            size="sm"
            icon={<RefreshCw />}
            aria-label={`Reintentar ${name}`}
            onClick={() => {
              onRetry(item.id);
            }}
          >
            Reintentar
          </Button>
        ) : null}

        {item.status === 'error' ? (
          <IconButton
            label={`Descartar ${name}`}
            icon={<Trash2 />}
            onClick={() => {
              onRemove(item.id);
            }}
          />
        ) : null}

        {item.status === 'done' ? (
          <CircleCheck aria-hidden="true" className="size-5 text-success" />
        ) : null}
      </div>
    </li>
  );
}
