import type { PhotoSummary } from '@memora/shared';
import { useState } from 'react';

import { cx } from '../../components/layout/class-names';
import { getInitials } from './format';

export interface CircleCoverProps {
  readonly name: string;
  readonly photo?: PhotoSummary | null | undefined;
  readonly className?: string | undefined;
  readonly initialsClassName?: string | undefined;
}

/**
 * Portada de un círculo con degradado de reserva.
 *
 * `coverPhoto.thumbUrl` apuntará a un endpoint que llega en F29; hasta
 * entonces puede fallar. Si la imagen no carga se sustituye por el degradado
 * con iniciales, nunca por el icono de imagen rota del navegador. Es decorativa
 * porque el nombre del círculo siempre está en texto al lado.
 */
export function CircleCover({ name, photo, className, initialsClassName }: CircleCoverProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = photo !== null && photo !== undefined && failedUrl !== photo.thumbUrl;

  return (
    <div className={cx('relative overflow-hidden bg-surface-2', className)}>
      {showImage ? (
        <img
          src={photo.thumbUrl}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailedUrl(photo.thumbUrl)}
          className="size-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex size-full items-center justify-center bg-gradient-to-br from-primary-soft via-surface-2 to-surface-active"
        >
          <span
            className={cx(
              'text-h2 font-extrabold tracking-tight text-primary-text',
              initialsClassName,
            )}
          >
            {getInitials(name)}
          </span>
        </div>
      )}
    </div>
  );
}
